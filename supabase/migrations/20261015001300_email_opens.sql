-- Open tracking for Admin → Email: keep Resend's email id, and every 30
-- minutes ask Resend for the latest event of recent emails (send-emails,
-- kind "opens"). Opens are approximate (image blocking, Apple Mail preloads).

alter table public.outbound_emails
  add column resend_id text,
  add column last_event text,
  add column opened_at timestamptz;

select cron.schedule('reptilytics-email-opens', '*/30 * * * *',
  $$select private.call_research_function('send-emails', '{"kind":"opens"}'::jsonb)$$);
