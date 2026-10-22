-- Feeding schedules are optional for the whole account. Keepers who don't feed
-- on a schedule can turn them off in Settings: due badges, the "due to eat"
-- lists and the feeding part of the Monday email all go away. Each animal's
-- interval is kept, so turning schedules back on restores them as they were.

alter table public.profiles
  add column feeding_schedules boolean not null default true;

grant update (feeding_schedules) on public.profiles to authenticated;

create or replace function public.fn79_my_feeding_schedules()
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select coalesce((select p.feeding_schedules from public.profiles p where p.id = (select auth.uid())), true);
$$;

revoke execute on function public.fn79_my_feeding_schedules() from public, anon;
grant execute on function public.fn79_my_feeding_schedules() to authenticated;

-- Same as before, except feeding reminders need schedules on as well.
create or replace function public.fn55_digest_batch(p_limit integer default 50)
 returns table(user_id uuid, email text, display_name text, email_token uuid, due jsonb, papers jsonb)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    with keepers as (
        select p.id, u.email::text as email, coalesce(p.display_name, p.username) as display_name, p.email_token,
               (p.email_feeding and p.feeding_schedules) as email_feeding, p.email_research
        from public.profiles p
        join auth.users u on u.id = p.id
        where p.email_digest
          and ((p.email_feeding and p.feeding_schedules) or p.email_research)
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
        select k.id as user_id, k.email_feeding, k.email_research, a.id, a.name, a.species_id, a.feeding_interval_days
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
        where o.email_feeding and o.feeding_interval_days is not null and d.days <= 1
        group by o.user_id
    ),
    kept as (
        select distinct o.user_id, o.species_id
        from owned o
        where o.email_research and o.species_id is not null
          and not exists (select 1 from public.research_email_mutes m
                          where m.user_id = o.user_id and m.species_id = o.species_id)
    ),
    new_papers as (
        select k.user_id, s.id as species_id, s.common_name, s.scientific_name, count(*) as n,
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
               jsonb_agg(jsonb_build_object('species_id', species_id, 'common_name', common_name, 'scientific_name', scientific_name,
                                            'count', n, 'top', to_jsonb(top))
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

revoke execute on function public.fn55_digest_batch(integer) from public, anon, authenticated;
grant execute on function public.fn55_digest_batch(integer) to service_role;
