-- The research library had filled ~97% of the 500 MB free-plan database, and
-- embedding the ~50k passages still waiting would have pushed it over.
-- Biggest wins, in research_chunks:
--   * the stored fts column (87 MB) duplicated content as a tsvector; keyword
--     search now uses an expression index on to_tsvector(content) instead.
--   * embeddings move from vector (4 bytes/dim) to halfvec (2 bytes/dim),
--     halving the column and the HNSW index.
-- Split across three migrations so each commits (and frees disk) before the
-- next one rewrites the table; one transaction would peak above the limit.

-- Step 1: drop the large indexes and the stored tsvector.
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
