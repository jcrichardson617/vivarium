-- Admin → Users → a keeper: read-only look at a keeper's animals, enclosures and
-- breeding as they see them. Admin-gated security definer reads; no table policy
-- changes, and nothing here writes.

create or replace function public.fn80_admin_keeper(p_user_id uuid)
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
    with mine as (
        select o.animal_id, o.tags
        from public.animal_ownership o
        where o.user_id = p_user_id and o.is_current_owner
    ),
    meals as (
        select f.fed_at, f.accepted
        from public.feedings f join mine m on m.animal_id = f.animal_id
        where f.fed_at >= current_date - 29 and f.fed_at <= now() + interval '1 day'
    )
    select jsonb_build_object(
        'profile', (select jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name,
                                              'joined', p.created_at, 'country', p.country, 'unit_system', p.unit_system)
                    from public.profiles p where p.id = p_user_id),
        'animals', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', a.id, 'name', a.name, 'sex', a.sex, 'hatch_date', a.hatch_date, 'status', a.status,
                'animal_code', a.animal_code, 'visibility', a.visibility, 'tags', m.tags,
                'species', coalesce(s.common_name, ss.scientific_name), 'scientific', s.scientific_name,
                'morph', nullif(public.morph_name(a.id), ''),
                'last_fed_at', (select max(f.fed_at) from public.feedings f where f.animal_id = a.id and f.accepted),
                'latest_weight_g', (select w.weight_grams from public.weight_logs w where w.animal_id = a.id order by w.recorded_at desc limit 1),
                'enclosure_id', e.id, 'enclosure_name', e.name,
                'photo_path', (select ph.storage_path from public.animal_photos ph where ph.animal_id = a.id
                                order by ph.is_primary desc, ph.created_at limit 1))
                order by (a.status <> 'active'), lower(coalesce(a.name, '')))
            from mine m
            join public.animals a on a.id = m.animal_id
            left join public.species s on s.id = a.species_id
            left join public.species_submissions ss on ss.id = a.pending_species_submission_id
            left join lateral (
                select en.id, en.name from public.animal_enclosures ae
                join public.enclosures en on en.id = ae.enclosure_id
                where ae.animal_id = a.id and ae.end_date is null
                order by ae.start_date desc nulls last limit 1
            ) e on true), '[]'),
        'enclosures', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', en.id, 'name', en.name, 'enclosure_type', en.enclosure_type,
                'animals', (select count(*) from public.animal_enclosures ae where ae.enclosure_id = en.id and ae.end_date is null),
                'readings', (select count(*) from public.environment_logs l where l.enclosure_id = en.id),
                'last_reading', (select max(l.recorded_at) from public.environment_logs l where l.enclosure_id = en.id))
                order by en.name)
            from public.enclosures en where en.owner_id = p_user_id), '[]'),
        'pairings', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', bp.id, 'pairing_date', bp.pairing_date, 'notes', bp.notes,
                'male', ma.name, 'female', fa.name, 'species', sp.common_name,
                'clutches', (select count(*) from public.clutches c where c.pairing_id = bp.id),
                'incubating', (select count(*) from public.clutches c join public.eggs eg on eg.clutch_id = c.id
                               where c.pairing_id = bp.id and eg.status = 'incubating'),
                'hatched', (select count(*) from public.clutches c join public.eggs eg on eg.clutch_id = c.id
                            where c.pairing_id = bp.id and eg.status = 'hatched'))
                order by bp.pairing_date desc)
            from public.breeding_pairings bp
            left join public.animals ma on ma.id = bp.male_id
            left join public.animals fa on fa.id = bp.female_id
            left join public.species sp on sp.id = coalesce(fa.species_id, ma.species_id)
            where exists (select 1 from mine m where m.animal_id in (bp.male_id, bp.female_id))), '[]'),
        'feeding_days', (select jsonb_agg(jsonb_build_object(
                             'day', d.day,
                             'fed', (select count(*) from meals where fed_at::date = d.day and accepted),
                             'refused', (select count(*) from meals where fed_at::date = d.day and not accepted))
                           order by d.day)
                         from (select g::date as day from generate_series(current_date - 29, current_date, interval '1 day') g) d)
    ) into result;
    return result;
end;
$$;

create or replace function public.fn81_admin_animal(p_animal_id uuid)
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
        'animal', jsonb_build_object(
            'id', a.id, 'name', a.name, 'sex', a.sex, 'hatch_date', a.hatch_date, 'status', a.status,
            'animal_code', a.animal_code, 'visibility', a.visibility, 'feeding_interval_days', a.feeding_interval_days,
            'species', coalesce(s.common_name, ss.scientific_name), 'scientific', s.scientific_name,
            'morph', nullif(public.morph_name(a.id), ''),
            'sire', (select jsonb_build_object('id', x.id, 'name', x.name) from public.animals x where x.id = a.sire_id),
            'dam', (select jsonb_build_object('id', x.id, 'name', x.name) from public.animals x where x.id = a.dam_id),
            'acquired_date', (select q.acquired_date from public.animal_acquisitions q where q.animal_id = a.id limit 1)),
        'owner', (select jsonb_build_object('id', p.id, 'username', p.username, 'unit_system', p.unit_system)
                  from public.animal_ownership o join public.profiles p on p.id = o.user_id
                  where o.animal_id = a.id and o.is_current_owner limit 1),
        'enclosure', (select jsonb_build_object('id', en.id, 'name', en.name)
                      from public.animal_enclosures ae join public.enclosures en on en.id = ae.enclosure_id
                      where ae.animal_id = a.id and ae.end_date is null
                      order by ae.start_date desc nulls last limit 1),
        'photos', coalesce((select jsonb_agg(jsonb_build_object('id', ph.id, 'path', ph.storage_path, 'is_primary', ph.is_primary)
                                             order by ph.created_at)
                            from public.animal_photos ph where ph.animal_id = a.id), '[]'),
        'feedings', coalesce((select jsonb_agg(to_jsonb(f) order by f.fed_at desc) from (
            select id, fed_at, feeder_type, feeder_size, quantity, accepted, notes from public.feedings
            where animal_id = a.id order by fed_at desc limit 100) f), '[]'),
        'weights', coalesce((select jsonb_agg(to_jsonb(w) order by w.recorded_at desc) from (
            select id, recorded_at, weight_grams, notes from public.weight_logs
            where animal_id = a.id order by recorded_at desc limit 100) w), '[]'),
        'lengths', coalesce((select jsonb_agg(to_jsonb(l) order by l.recorded_at desc) from (
            select id, recorded_at, length_cm, notes from public.length_logs
            where animal_id = a.id order by recorded_at desc limit 100) l), '[]'),
        'sheds', coalesce((select jsonb_agg(to_jsonb(sh) order by sh.shed_date desc) from (
            select id, shed_date, complete_shed, retained_eye_caps, retained_tail_tip, notes from public.sheds
            where animal_id = a.id order by shed_date desc limit 100) sh), '[]'),
        'health', coalesce((select jsonb_agg(to_jsonb(h) order by h.event_date desc) from (
            select id, event_date, event_type, severity, notes from public.health_events
            where animal_id = a.id order by event_date desc limit 100) h), '[]'),
        'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc) from (
            select id, created_at, note_text from public.animal_notes
            where animal_id = a.id order by created_at desc limit 100) n), '[]')
    ) into result
    from public.animals a
    left join public.species s on s.id = a.species_id
    left join public.species_submissions ss on ss.id = a.pending_species_submission_id
    where a.id = p_animal_id;
    return result;
end;
$$;

create or replace function public.fn82_admin_enclosure(p_enclosure_id uuid)
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
        'enclosure', to_jsonb(en) - 'owner_id',
        'owner', (select jsonb_build_object('id', p.id, 'username', p.username, 'unit_system', p.unit_system)
                  from public.profiles p where p.id = en.owner_id),
        'housed', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'since', ae.start_date) order by a.name)
                            from public.animal_enclosures ae join public.animals a on a.id = ae.animal_id
                            where ae.enclosure_id = en.id and ae.end_date is null), '[]'),
        'gear', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', pr.name, 'category', pr.category,
                                                              'blocked', pr.blocked, 'note', pr.note) order by g.added_at)
                          from public.enclosure_gear g join public.products pr on pr.id = g.product_id
                          where g.enclosure_id = en.id and g.removed_at is null), '[]'),
        'readings', coalesce((select jsonb_agg(to_jsonb(l) - 'enclosure_id' order by l.recorded_at desc) from (
            select * from public.environment_logs where enclosure_id = en.id
            order by recorded_at desc nulls last limit 100) l), '[]')
    ) into result
    from public.enclosures en
    where en.id = p_enclosure_id;
    return result;
end;
$$;

revoke execute on function public.fn80_admin_keeper(uuid) from public, anon;
revoke execute on function public.fn81_admin_animal(uuid) from public, anon;
revoke execute on function public.fn82_admin_enclosure(uuid) from public, anon;
grant execute on function public.fn80_admin_keeper(uuid) to authenticated;
grant execute on function public.fn81_admin_animal(uuid) to authenticated;
grant execute on function public.fn82_admin_enclosure(uuid) to authenticated;

-- Admins can open (sign URLs for) any animal photo, so the read-only view shows them.
-- is_admin() only tells the caller whether they themselves are an admin.
grant execute on function private.is_admin() to authenticated;
create policy "admins read animal photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'animal-photos' and private.is_admin());
