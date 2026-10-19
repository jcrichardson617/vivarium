-- Admin → Users and Admin → Animals: who has signed up and what they keep.
-- Admins only (emails are personal data); moderators don't see these.

create or replace function private.is_admin()
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

revoke all on function private.is_admin() from public, anon;

create or replace function public.fn77_admin_users()
 returns table(id uuid, username text, display_name text, email text, role text, plan text, country text,
               joined timestamptz, last_sign_in timestamptz, confirmed boolean,
               animals integer, logs_30d integer, last_log timestamptz)
 language plpgsql
 stable
 security definer
 set search_path = ''
as $$
begin
    if not private.is_admin() then
        raise exception 'Admin access required';
    end if;
    return query
    with owned as (
        select o.user_id, count(*)::int as n
        from public.animal_ownership o
        join public.animals a on a.id = o.animal_id and a.status = 'active'
        where o.is_current_owner
        group by o.user_id
    ),
    logs as (
        select who, count(*) filter (where at > now() - interval '30 days')::int as n30, max(at) as last_at
        from (
            select fed_by as who, fed_at as at from public.feedings
            union all select recorded_by, recorded_at from public.weight_logs
            union all select recorded_by, shed_date::timestamptz from public.sheds
        ) l
        where who is not null
        group by who
    )
    select p.id, p.username, p.display_name, u.email::text, p.role, p.plan, p.country,
           p.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
           coalesce(owned.n, 0), coalesce(logs.n30, 0), logs.last_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join owned on owned.user_id = p.id
    left join logs on logs.who = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.fn77_admin_users() from public, anon;
grant execute on function public.fn77_admin_users() to authenticated;

create or replace function public.fn78_admin_animal_stats()
 returns jsonb
 language plpgsql
 stable
 security definer
 set search_path = ''
as $$
declare
    result jsonb;
begin
    if not private.is_admin() then
        raise exception 'Admin access required';
    end if;
    select jsonb_build_object(
        'users', (select count(*) from public.profiles),
        'users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
        'users_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
        'users_with_animals', (select count(distinct o.user_id) from public.animal_ownership o where o.is_current_owner),
        'active_keepers_30d', (select count(distinct who) from (
            select fed_by as who from public.feedings where fed_at > now() - interval '30 days'
            union select recorded_by from public.weight_logs where recorded_at > now() - interval '30 days'
            union select recorded_by from public.sheds where shed_date > now() - interval '30 days') x where who is not null),
        'animals', (select count(*) from public.animals),
        'animals_7d', (select count(*) from public.animals where created_at > now() - interval '7 days'),
        'animals_public', (select count(*) from public.animals where visibility = 'public'),
        'by_status', (select coalesce(jsonb_object_agg(coalesce(status, 'unknown'), n), '{}'::jsonb)
                      from (select status, count(*) as n from public.animals group by status) s),
        'by_class', (select coalesce(jsonb_object_agg(coalesce(c, 'Unknown'), n), '{}'::jsonb)
                     from (select s.taxon_class as c, count(*) as n from public.animals a
                           left join public.species s on s.id = a.species_id group by s.taxon_class) t),
        'top_species', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'scientific', sci, 'animals', n, 'keepers', k) order by n desc), '[]'::jsonb)
                        from (select coalesce(s.common_name, s.scientific_name) as name, s.scientific_name as sci,
                                     count(*) as n, count(distinct o.user_id) as k
                              from public.animals a
                              join public.species s on s.id = a.species_id
                              left join public.animal_ownership o on o.animal_id = a.id and o.is_current_owner
                              where a.status = 'active'
                              group by s.id order by count(*) desc limit 25) t),
        'records', jsonb_build_object(
            'feedings', (select count(*) from public.feedings),
            'feedings_30d', (select count(*) from public.feedings where fed_at > now() - interval '30 days'),
            'weights', (select count(*) from public.weight_logs),
            'weights_30d', (select count(*) from public.weight_logs where recorded_at > now() - interval '30 days'),
            'sheds', (select count(*) from public.sheds),
            'sheds_30d', (select count(*) from public.sheds where shed_date > now() - interval '30 days'),
            'enclosures', (select count(*) from public.enclosures),
            'environment_logs', (select count(*) from public.environment_logs),
            'pairings', (select count(*) from public.breeding_pairings),
            'clutches', (select count(*) from public.clutches),
            'photos', (select count(*) from public.animal_photos)),
        'weekly', (select coalesce(jsonb_agg(jsonb_build_object('week', w, 'users', u, 'animals', an) order by w), '[]'::jsonb)
                   from (select g::date as w,
                                (select count(*) from public.profiles where created_at >= g and created_at < g + interval '7 days') as u,
                                (select count(*) from public.animals where created_at >= g and created_at < g + interval '7 days') as an
                         from generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') g) t)
    ) into result;
    return result;
end;
$$;

revoke execute on function public.fn78_admin_animal_stats() from public, anon;
grant execute on function public.fn78_admin_animal_stats() to authenticated;
