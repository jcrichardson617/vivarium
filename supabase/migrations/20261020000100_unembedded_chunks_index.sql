-- embed-chunks picks the next passages with `embedding is null order by id`.
-- Without an index on id for just those rows it walks the primary key past every
-- embedded passage (5 s+, often over the 8 s API timeout), so embedding stalled.
create index if not exists research_chunks_unembedded_idx
  on public.research_chunks (id) where embedding is null;
