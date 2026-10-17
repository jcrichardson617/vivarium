-- Shrinks the research library so the database stays under the free plan's 500 MB.
-- Same as migrations 20261016000100..300 (shrink_research_chunks, halfvec, indexes).
-- The connector can't run the DROPs, so paste into Supabase Dashboard -> SQL Editor.
--
-- RUN THE THREE PARTS ONE AT A TIME (select a part, Run, then the next).
-- Each part must commit before the next starts, or the rewrite in part 2
-- temporarily needs more space than the plan allows.
-- Cron jobs herpatlas-embed / -harvest / -fulltext were paused for this; part 3
-- turns them back on.

-- ===================== PART 1 =====================
drop index if exists public.research_chunks_embedding_idx;
drop index if exists public.research_chunks_fts_idx;
alter table public.research_chunks drop column fts;

create or replace function public.fn43_search_research(
    p_query_embedding extensions.vector,
    p_query_text text,
    p_species_ids uuid[] default null,
    p_match_count integer default 8
)
 returns table(chunk_id bigint, document_id uuid, content text, score double precision, title text, source_url text, source_type text, evidence_level text, authors text[], publisher text, published_date date, doi text)
 language sql
 stable
 set search_path to 'public', 'extensions'
as $$
    with docs as (
        select d.id
        from research_documents d
        where d.ingest_status = 'ready'
          and (p_species_ids is null
               or not exists (select 1 from research_document_species s where s.document_id = d.id)
               or exists (select 1 from research_document_species s
                          where s.document_id = d.id and s.species_id = any (p_species_ids)))
    ),
    semantic as (
        select c.id, row_number() over (order by c.embedding <#> p_query_embedding::halfvec(384)) as rank
        from research_chunks c
        where c.document_id in (select id from docs) and c.embedding is not null
        order by c.embedding <#> p_query_embedding::halfvec(384)
        limit least(p_match_count, 50) * 3
    ),
    keyword as (
        select c.id, row_number() over (order by ts_rank_cd(to_tsvector('english', c.content), q) desc) as rank
        from research_chunks c, websearch_to_tsquery('english', coalesce(p_query_text, '')) q
        where c.document_id in (select id from docs) and to_tsvector('english', c.content) @@ q
        order by ts_rank_cd(to_tsvector('english', c.content), q) desc
        limit least(p_match_count, 50) * 3
    ),
    fused as (
        select coalesce(s.id, k.id) as id,
               coalesce(1.0 / (50 + s.rank), 0) + coalesce(1.0 / (50 + k.rank), 0) as score
        from semantic s
        full outer join keyword k on k.id = s.id
    )
    select c.id, d.id, c.content, f.score::double precision,
           d.title, d.source_url, d.source_type, d.evidence_level,
           d.authors, d.publisher, d.published_date, d.doi
    from fused f
    join research_chunks c on c.id = f.id
    join research_documents d on d.id = c.document_id
    order by f.score desc
    limit least(p_match_count, 50);
$$;

create or replace function public.fn49_species_term_papers(p_species_id uuid, p_term text, p_limit integer default 6)
 returns table(id uuid, title text, source_url text, publisher text, published_date date, cited_by_count integer)
 language sql
 stable
 set search_path to 'public'
as $$
    select d.id, d.title, d.source_url, d.publisher, d.published_date, d.cited_by_count
    from research_documents d
    where d.ingest_status = 'ready'
      and exists (select 1 from research_document_species s where s.document_id = d.id and s.species_id = p_species_id)
      and exists (select 1 from research_chunks c
                  where c.document_id = d.id
                    and to_tsvector('english', c.content) @@ phraseto_tsquery('english', p_term))
    order by d.cited_by_count desc nulls last
    limit least(greatest(p_limit, 1), 20);
$$;

-- Lets harvest-research stop adding papers before the database fills up.
create or replace function public.fn63_database_size_mb()
 returns integer
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select (pg_database_size(current_database()) / 1048576)::integer;
$$;

revoke execute on function public.fn63_database_size_mb() from public, anon, authenticated;
grant execute on function public.fn63_database_size_mb() to service_role;

-- ===================== PART 2 =====================
set statement_timeout = 0;
alter table public.research_chunks
  alter column embedding type extensions.halfvec(384) using embedding::extensions.halfvec(384);

-- ===================== PART 3 =====================
set statement_timeout = 0;
create index research_chunks_embedding_idx on public.research_chunks
  using hnsw (embedding extensions.halfvec_ip_ops);
create index research_chunks_fts_idx on public.research_chunks
  using gin (to_tsvector('english', content));
select cron.alter_job(jobid, active := true)
from cron.job where jobname in ('herpatlas-embed', 'herpatlas-harvest', 'herpatlas-fulltext');
select pg_size_pretty(pg_database_size(current_database())) as database_size;
