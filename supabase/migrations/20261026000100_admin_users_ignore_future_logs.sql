-- Admin → Users: a log typed with a future date (e.g. 2028 for 2024) made
-- "Last log" show that future date and counted it in "Logs (30d)" until that date passed.
-- Ignore entries more than a day ahead (a day of slack for keepers ahead of UTC).

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
        where who is not null and at <= now() + interval '1 day'
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
