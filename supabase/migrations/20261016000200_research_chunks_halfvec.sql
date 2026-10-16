-- Step 2: rewrite research_chunks with halfvec embeddings. The rewrite also
-- reclaims the space of the fts column dropped in the previous migration.
set local statement_timeout = 0;
alter table public.research_chunks
  alter column embedding type extensions.halfvec(384) using embedding::extensions.halfvec(384);
