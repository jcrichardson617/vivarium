-- Welcome email and weekly digest, sent by the send-emails edge function via
-- Resend. Keepers can opt out of the digest in Settings or with the one-click
-- unsubscribe link (email_token) in every digest.

alter table public.profiles
  add column email_digest boolean not null default true,
  add column email_token uuid not null default gen_random_uuid(),
  add column welcome_sent_at timestamptz,
  add column digest_sent_at timestamptz;

create unique index profiles_email_token_key on public.profiles (email_token);
grant update (email_digest) on public.profiles to authenticated;

-- Existing accounts already know the site; only new sign-ups get a welcome.
update public.profiles set welcome_sent_at = now() where welcome_sent_at is null;

-- New confirmed accounts that have not been welcomed (last 3 days only).
create or replace function public.fn53_pending_welcomes(p_limit integer default 50)
 returns table(user_id uuid, email text, display_name text)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select p.id, u.email::text, coalesce(p.display_name, p.username)
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.welcome_sent_at is null
      and u.email_confirmed_at is not null
      and p.created_at > now() - interval '3 days'
    order by p.created_at
    limit p_limit;
$$;

-- Keepers due a digest: opted in, not sent in the last 6 days, with at least
-- one active animal. due = animals due to eat by tomorrow; papers = papers added
-- this week for species they keep.
create or replace function public.fn55_digest_batch(p_limit integer default 50)
 returns table(user_id uuid, email text, display_name text, email_token uuid, due jsonb, papers jsonb)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    with keepers as (
        select p.id, u.email::text as email, coalesce(p.display_name, p.username) as display_name, p.email_token
        from public.profiles p
        join auth.users u on u.id = p.id
        where p.email_digest
          and u.email_confirmed_at is not null
          and (p.digest_sent_at is null or p.digest_sent_at < now() - interval '6 days')
          and exists (
              select 1 from public.animal_ownership o
              join public.animals a on a.id = o.animal_id
              where o.user_id = p.id and o.is_current_owner and a.status = 'active')
        order by p.digest_sent_at nulls first
        limit p_limit
    ),
    owned as (
        select k.id as user_id, a.id, a.name, a.species_id, a.feeding_interval_days
        from keepers k
        join public.animal_ownership o on o.user_id = k.id and o.is_current_owner
        join public.animals a on a.id = o.animal_id and a.status = 'active'
    ),
    due as (
        select o.user_id,
               jsonb_agg(jsonb_build_object('name', coalesce(o.name, 'Unnamed'), 'days', d.days) order by d.days, o.name) as due
        from owned o
        cross join lateral (
            select coalesce((max(f.fed_at)::date + o.feeding_interval_days) - current_date, 0) as days
            from public.feedings f
            where f.animal_id = o.id and f.accepted
        ) d
        where o.feeding_interval_days is not null and d.days <= 1
        group by o.user_id
    ),
    kept as (
        select distinct o.user_id, o.species_id from owned o where o.species_id is not null
    ),
    new_papers as (
        select k.user_id, s.common_name, s.scientific_name, count(*) as n,
               (array_agg(jsonb_build_object('title', d.title, 'url', d.source_url)
                          order by d.cited_by_count desc nulls last, d.published_date desc nulls last))[1:3] as top
        from kept k
        join public.species s on s.id = k.species_id
        join public.research_document_species rs on rs.species_id = k.species_id
        join public.research_documents d on d.id = rs.document_id
        where d.created_at > now() - interval '7 days'
        group by k.user_id, s.id, s.common_name, s.scientific_name
    ),
    papers as (
        select user_id,
               jsonb_agg(jsonb_build_object('common_name', common_name, 'scientific_name', scientific_name, 'count', n, 'top', to_jsonb(top))
                         order by n desc) as papers
        from new_papers
        group by user_id
    )
    select k.id, k.email, k.display_name, k.email_token,
           coalesce(due.due, '[]'::jsonb), coalesce(papers.papers, '[]'::jsonb)
    from keepers k
    left join due on due.user_id = k.id
    left join papers on papers.user_id = k.id;
$$;

create or replace function public.fn54_mark_emailed(p_user_id uuid, p_kind text)
 returns void
 language sql
 security definer
 set search_path = ''
as $$
    update public.profiles
    set welcome_sent_at = case when p_kind = 'welcome' then now() else welcome_sent_at end,
        digest_sent_at = case when p_kind = 'digest' then now() else digest_sent_at end
    where id = p_user_id;
$$;

revoke execute on function public.fn53_pending_welcomes(integer) from public, anon, authenticated;
revoke execute on function public.fn55_digest_batch(integer) from public, anon, authenticated;
revoke execute on function public.fn54_mark_emailed(uuid, text) from public, anon, authenticated;
grant execute on function public.fn53_pending_welcomes(integer) to service_role;
grant execute on function public.fn55_digest_batch(integer) to service_role;
grant execute on function public.fn54_mark_emailed(uuid, text) to service_role;

-- One-click unsubscribe from the link in the digest (no sign-in needed).
create or replace function public.fn56_unsubscribe(p_token uuid)
 returns boolean
 language sql
 security definer
 set search_path = ''
as $$
    with u as (
        update public.profiles set email_digest = false where email_token = p_token returning 1
    )
    select exists (select 1 from u);
$$;

revoke execute on function public.fn56_unsubscribe(uuid) from public;
grant execute on function public.fn56_unsubscribe(uuid) to anon, authenticated;

select cron.schedule('reptilytics-welcome-emails', '*/15 * * * *',
  $$select private.call_research_function('send-emails', '{"kind":"welcome"}'::jsonb)$$);
-- Mondays, 14:05 to 20:05 UTC (morning in the Americas, afternoon in Europe),
-- 50 keepers per run.
select cron.schedule('reptilytics-weekly-digest', '5 14-20 * * 1',
  $$select private.call_research_function('send-emails', '{"kind":"digest"}'::jsonb)$$);
