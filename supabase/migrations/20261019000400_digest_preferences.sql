-- Weekly digest choices: feeding reminders and research updates can be turned
-- off separately, and research updates muted per species. email_digest stays
-- the master switch (the "unsubscribe from everything" link).

alter table public.profiles
  add column email_feeding boolean not null default true,
  add column email_research boolean not null default true;

grant update (email_feeding, email_research) on public.profiles to authenticated;

-- Species a keeper doesn't want research updates for (default: all they keep).
create table public.research_email_mutes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_id uuid not null references public.species(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, species_id)
);

alter table public.research_email_mutes enable row level security;
create policy research_email_mutes_select on public.research_email_mutes for select to authenticated
  using (user_id = (select auth.uid()));
create policy research_email_mutes_insert on public.research_email_mutes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy research_email_mutes_delete on public.research_email_mutes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Settings reads the two new switches here (fn72_my_profile keeps its shape).
create or replace function public.fn76_my_email_prefs()
 returns table(email_feeding boolean, email_research boolean)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select p.email_feeding, p.email_research from public.profiles p where p.id = (select auth.uid());
$$;

revoke execute on function public.fn76_my_email_prefs() from public, anon;
grant execute on function public.fn76_my_email_prefs() to authenticated;

create or replace function public.fn55_digest_batch(p_limit integer default 50)
 returns table(user_id uuid, email text, display_name text, email_token uuid, due jsonb, papers jsonb)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    with keepers as (
        select p.id, u.email::text as email, coalesce(p.display_name, p.username) as display_name, p.email_token,
               p.email_feeding, p.email_research
        from public.profiles p
        join auth.users u on u.id = p.id
        where p.email_digest
          and (p.email_feeding or p.email_research)
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

-- Unsubscribe links (no sign-in): 'all' turns the digest off, 'feeding' or
-- 'research' turns off that section, 'species' mutes research for one species.
-- (fn56_unsubscribe stays as the one-click "everything" for mail apps.)
create or replace function public.fn75_unsubscribe(p_token uuid, p_what text, p_species_id uuid default null)
 returns boolean
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_user uuid;
begin
    select id into v_user from public.profiles where email_token = p_token;
    if v_user is null then
        return false;
    end if;
    if p_what = 'feeding' then
        update public.profiles set email_feeding = false where id = v_user;
    elsif p_what = 'research' then
        update public.profiles set email_research = false where id = v_user;
    elsif p_what = 'species' and p_species_id is not null then
        insert into public.research_email_mutes (user_id, species_id) values (v_user, p_species_id)
        on conflict do nothing;
    else
        update public.profiles set email_digest = false where id = v_user;
    end if;
    return true;
end;
$$;

revoke execute on function public.fn75_unsubscribe(uuid, text, uuid) from public;
grant execute on function public.fn75_unsubscribe(uuid, text, uuid) to anon, authenticated;
