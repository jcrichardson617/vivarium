-- One-off emails written in Admin → Email and sent from info@reptilytics.com
-- by the send-emails edge function (kind "outbox"). Kept as a sent log.

create table public.outbound_emails (
  id uuid primary key default gen_random_uuid(),
  to_email text not null check (to_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text not null check (length(subject) between 1 and 200),
  body text not null check (length(body) between 1 and 20000),
  sent_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'error')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.outbound_emails enable row level security;
create policy outbound_emails_select on public.outbound_emails for select to authenticated
  using (private.is_moderator());

-- Queue an email and ask the edge function to send it right away.
create or replace function public.fn60_send_email(p_to text, p_subject text, p_body text)
 returns uuid
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_id uuid;
begin
    if not private.is_moderator() then
        raise exception 'Moderator access required';
    end if;
    insert into public.outbound_emails (to_email, subject, body, sent_by)
    values (btrim(p_to), btrim(p_subject), p_body, (select auth.uid()))
    returning id into v_id;
    perform private.call_research_function('send-emails', '{"kind":"outbox"}'::jsonb);
    return v_id;
end;
$$;

revoke execute on function public.fn60_send_email(text, text, text) from public, anon;
grant execute on function public.fn60_send_email(text, text, text) to authenticated;
