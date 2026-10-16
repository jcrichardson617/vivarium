-- Step 3: rebuild the search indexes on the slimmer table.
set local statement_timeout = 0;
create index research_chunks_embedding_idx on public.research_chunks
  using hnsw (embedding extensions.halfvec_ip_ops);
create index research_chunks_fts_idx on public.research_chunks
  using gin (to_tsvector('english', content));
