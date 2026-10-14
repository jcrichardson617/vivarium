-- HerpAtlas research library: documents are split into passages ("chunks"),
-- each with a gte-small embedding (384 dims, generated in the embed-chunks
-- edge function) and a full-text index, so Monty can retrieve cited passages.

create extension if not exists vector with schema extensions;

alter table public.research_documents
  add column ingest_status text not null default 'pending'
    check (ingest_status in ('pending', 'processing', 'ready', 'error')),
  add column ingest_error text,
  add column file_path text,
  add column chunk_count integer not null default 0,
  add column added_by uuid default auth.uid() references public.profiles(id) on delete set null;

create table public.research_chunks (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.research_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null check (length(content) between 1 and 4000),
  embedding extensions.vector(384),
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index research_chunks_embedding_idx on public.research_chunks
  using hnsw (embedding extensions.vector_ip_ops);
create index research_chunks_fts_idx on public.research_chunks using gin (fts);
create index research_chunks_pending_idx on public.research_chunks (document_id) where embedding is null;

alter table public.research_chunks enable row level security;

create policy research_chunks_select on public.research_chunks for select to anon, authenticated using (true);
create policy research_chunks_insert on public.research_chunks for insert to authenticated with check (private.is_moderator());
create policy research_chunks_update on public.research_chunks for update to authenticated
  using (private.is_moderator()) with check (private.is_moderator());
create policy research_chunks_delete on public.research_chunks for delete to authenticated using (private.is_moderator());

-- Original files (PDFs) are kept privately for moderators only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('research-files', 'research-files', false, 52428800, array['application/pdf', 'text/plain'])
on conflict (id) do nothing;

create policy research_files_select on storage.objects for select to authenticated
  using (bucket_id = 'research-files' and private.is_moderator());
create policy research_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'research-files' and private.is_moderator());
create policy research_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'research-files' and private.is_moderator());

-- Hybrid retrieval: semantic similarity and keyword match, merged with
-- reciprocal rank fusion. Optionally limited to documents tagged with any of
-- the given species (untagged, general-husbandry documents are always included).
create or replace function public.fn43_search_research(
    p_query_embedding extensions.vector(384),
    p_query_text text,
    p_species_ids uuid[] default null,
    p_match_count integer default 8
)
 returns table(
   chunk_id bigint, document_id uuid, content text, score double precision,
   title text, source_url text, source_type text, evidence_level text,
   authors text[], publisher text, published_date date, doi text
 )
 language sql
 stable
 set search_path = public, extensions
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
        select c.id, row_number() over (order by c.embedding <#> p_query_embedding) as rank
        from research_chunks c
        where c.document_id in (select id from docs) and c.embedding is not null
        order by c.embedding <#> p_query_embedding
        limit least(p_match_count, 50) * 3
    ),
    keyword as (
        select c.id, row_number() over (order by ts_rank_cd(c.fts, q) desc) as rank
        from research_chunks c, websearch_to_tsquery('english', coalesce(p_query_text, '')) q
        where c.document_id in (select id from docs) and c.fts @@ q
        order by ts_rank_cd(c.fts, q) desc
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
