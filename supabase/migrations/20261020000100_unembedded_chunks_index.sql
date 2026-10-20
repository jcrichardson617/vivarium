-- embed-chunks picks the next passages with `embedding is null`, one paper at a
-- time (document_id, chunk_index). Without an index for just those rows it walked
-- past every embedded passage (5 s+, often over the 8 s API timeout), so
-- embedding stalled.
create index if not exists research_chunks_unembedded_doc_idx
  on public.research_chunks (document_id, chunk_index) where embedding is null;

-- Embedding (5 passages a call) fell behind the OpenAlex harvest (~10k passages a
-- day). Embed every 30 s (up to ~14k a day) and harvest hourly until it catches up.
select cron.alter_job((select jobid from cron.job where jobname = 'herpatlas-embed'), schedule := '30 seconds');
select cron.alter_job((select jobid from cron.job where jobname = 'herpatlas-harvest-openalex'), schedule := '5 * * * *');

-- fetch-fulltext is past FULLTEXT_CAP and only returns {"capped":true}. Paused;
-- reschedule it if the cap is raised:
--   select cron.schedule('herpatlas-fulltext', '*/2 * * * *', $$select private.call_research_function('fetch-fulltext')$$);
select cron.unschedule('herpatlas-fulltext')
where exists (select 1 from cron.job where jobname = 'herpatlas-fulltext');
