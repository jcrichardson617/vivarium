-- Keeper dashboard: one call returns everything the page needs, scoped to
-- the signed-in keeper's current, active animals.

create or replace function public.fn61_dashboard()
 returns jsonb
 language sql
 stable
 security definer
 set search_path = ''
as $$
    with mine as (
        select a.id, coalesce(a.name, 'Unnamed') as name, a.species_id
        from public.animal_ownership o
        join public.animals a on a.id = o.animal_id
        where o.user_id = (select auth.uid()) and o.is_current_owner and a.status = 'active'
    ),
    days as (
        select d::date as day from generate_series(current_date - 29, current_date, interval '1 day') d
    ),
    meals as (
        select f.animal_id, f.fed_at, f.accepted
        from public.feedings f join mine m on m.id = f.animal_id
        where f.fed_at >= current_date - 29
    ),
    -- Last two meals per animal, to spot refusal streaks.
    last_two as (
        select f.animal_id, array_agg(f.accepted order by f.fed_at desc) as accepted
        from mine m
        cross join lateral (
            select fe.animal_id, fe.accepted, fe.fed_at from public.feedings fe
            where fe.animal_id = m.id order by fe.fed_at desc limit 2
        ) f
        group by f.animal_id
    ),
    weights as (
        select m.id, m.name,
               (select w.weight_grams from public.weight_logs w where w.animal_id = m.id order by w.recorded_at desc limit 1) as latest,
               (select w.recorded_at from public.weight_logs w where w.animal_id = m.id order by w.recorded_at desc limit 1) as latest_at,
               (select max(w.weight_grams) from public.weight_logs w
                 where w.animal_id = m.id and w.recorded_at >= now() - interval '90 days'
                   and w.recorded_at < (select max(w2.recorded_at) from public.weight_logs w2 where w2.animal_id = m.id)) as recent_max
        from mine m
    ),
    watch as (
        select m.id, m.name, 'Refused the last 2 meals' as reason
        from mine m join last_two l on l.animal_id = m.id
        where array_length(l.accepted, 1) = 2 and not l.accepted[1] and not l.accepted[2]
        union all
        select w.id, w.name, 'Down ' || round(100 - 100 * w.latest / w.recent_max) || '% in weight'
        from weights w
        where w.latest is not null and w.recent_max > 0 and w.latest < 0.9 * w.recent_max
    ),
    clutch_eggs as (
        select c.id, c.expected_hatch_date, c.laid_date,
               coalesce(fa.name, 'Female') as female, coalesce(ma.name, 'Male') as male,
               count(*) filter (where e.status = 'incubating') as incubating
        from public.clutches c
        join public.breeding_pairings p on p.id = c.pairing_id
        left join public.animals fa on fa.id = p.female_id
        left join public.animals ma on ma.id = p.male_id
        left join public.eggs e on e.clutch_id = c.id
        where private.can_access_clutch(c.id)
        group by c.id, fa.name, ma.name
    ),
    activity as (
        select * from (
            select f.animal_id, m.name, 'feeding' as kind,
                   case when f.accepted then 'Fed' || coalesce(' ' || nullif(f.feeder_size, ''), '') || coalesce(' ' || nullif(f.feeder_type, ''), '') else 'Refused a meal' end as detail,
                   f.fed_at as at
            from public.feedings f join mine m on m.id = f.animal_id
            union all
            select w.animal_id, m.name, 'weight', w.weight_grams::text || ' g', w.recorded_at
            from public.weight_logs w join mine m on m.id = w.animal_id
            union all
            select s.animal_id, m.name, 'shed', case when s.complete_shed then 'Complete shed' else 'Incomplete shed' end, s.shed_date
            from public.sheds s join mine m on m.id = s.animal_id
            union all
            select h.animal_id, m.name, 'health', coalesce(h.event_type, 'Health event'), h.event_date::timestamptz
            from public.health_events h join mine m on m.id = h.animal_id
            union all
            select n.animal_id, m.name, 'note', left(n.note_text, 80), n.created_at
            from public.animal_notes n join mine m on m.id = n.animal_id
        ) x
        order by at desc nulls last
        limit 10
    ),
    papers as (
        select s.common_name, s.scientific_name, count(*) as n,
               (array_agg(jsonb_build_object('title', d.title, 'url', d.source_url)
                          order by d.cited_by_count desc nulls last))[1:3] as top
        from (select distinct species_id from mine where species_id is not null) k
        join public.species s on s.id = k.species_id
        join public.research_document_species rs on rs.species_id = k.species_id
        join public.research_documents d on d.id = rs.document_id
        where d.created_at > now() - interval '7 days'
        group by s.id, s.common_name, s.scientific_name
    )
    select jsonb_build_object(
        'active', (select count(*) from mine),
        'meals_week', (select count(*) from meals where fed_at >= now() - interval '7 days'),
        'accepted_week', (select count(*) from meals where fed_at >= now() - interval '7 days' and accepted),
        'feeding_days', (select jsonb_agg(jsonb_build_object(
                             'day', d.day,
                             'fed', (select count(*) from meals where fed_at::date = d.day and accepted),
                             'refused', (select count(*) from meals where fed_at::date = d.day and not accepted))
                           order by d.day) from days d),
        'watch', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'reason', reason)) from watch), '[]'),
        'no_weight', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'last', latest_at) order by latest_at nulls first)
                               from weights where latest_at is null or latest_at < now() - interval '30 days'), '[]'),
        'incubating_clutches', (select count(*) from clutch_eggs where incubating > 0),
        'hatching_soon', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'female', female, 'male', male,
                                       'expected', expected_hatch_date, 'eggs', incubating) order by expected_hatch_date)
                                   from clutch_eggs
                                   where incubating > 0 and expected_hatch_date <= current_date + 7), '[]'),
        'activity', coalesce((select jsonb_agg(jsonb_build_object('animal_id', animal_id, 'name', name, 'kind', kind, 'detail', detail, 'at', at)
                                               order by at desc nulls last) from activity), '[]'),
        'papers', coalesce((select jsonb_agg(jsonb_build_object('common_name', common_name, 'scientific_name', scientific_name,
                                               'count', n, 'top', to_jsonb(top)) order by n desc) from papers), '[]')
    );
$$;

revoke execute on function public.fn61_dashboard() from public, anon;
grant execute on function public.fn61_dashboard() to authenticated;

