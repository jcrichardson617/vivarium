-- embed-chunks picks the next passages with `embedding is null order by id`.
-- Without an index on id for just those rows it walks the primary key past every
-- embedded passage (5 s+, often over the 8 s API timeout), so embedding stalled.
create index if not exists research_chunks_unembedded_idx
  on public.research_chunks (id) where embedding is null;

-- Embedding (5 passages a call) fell behind the OpenAlex harvest (~10k passages a
-- day). Embed every 30 s (up to ~14k a day) and harvest hourly until it catches up.
select cron.alter_job((select jobid from cron.job where jobname = 'herpatlas-embed'), schedule := '30 seconds');
select cron.alter_job((select jobid from cron.job where jobname = 'herpatlas-harvest-openalex'), schedule := '5 * * * *');
