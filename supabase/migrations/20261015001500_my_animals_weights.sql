-- My animals list, now with morph name, latest weight and the last eight
-- weights (replaces fn57_my_animals in the app).
create or replace function public.fn62_my_animals()
 returns table(
   id uuid, name text, sex text, hatch_date date, status text, animal_code text,
   feeding_interval_days integer, created_at timestamptz,
   species_common_name text, species_scientific_name text,
   pending_species text, pending_species_status text,
   last_fed_at timestamptz, enclosure_id uuid, enclosure_name text,
   tags text[], photo_path text,
   morph text, latest_weight_g numeric, weights_g numeric[])
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select a.id, a.name, a.sex, a.hatch_date, a.status, a.animal_code,
           a.feeding_interval_days, a.created_at,
           s.common_name, s.scientific_name,
           ss.scientific_name, ss.status,
           (select max(f.fed_at) from public.feedings f where f.animal_id = a.id and f.accepted),
           e.id, e.name,
           o.tags,
           (select p.storage_path from public.animal_photos p where p.animal_id = a.id
             order by p.is_primary desc, p.created_at limit 1),
           nullif(public.morph_name(a.id), ''),
           w.weights[array_length(w.weights, 1)],
           w.weights
    from public.animal_ownership o
    join public.animals a on a.id = o.animal_id
    left join public.species s on s.id = a.species_id
    left join public.species_submissions ss on ss.id = a.pending_species_submission_id
    left join lateral (
        select en.id, en.name from public.animal_enclosures ae
        join public.enclosures en on en.id = ae.enclosure_id
        where ae.animal_id = a.id and ae.end_date is null
        order by ae.start_date desc nulls last limit 1
    ) e on true
    left join lateral (
        select array_agg(x.weight_grams order by x.recorded_at) as weights
        from (select wl.weight_grams, wl.recorded_at from public.weight_logs wl
              where wl.animal_id = a.id order by wl.recorded_at desc limit 8) x
    ) w on true
    where o.user_id = (select auth.uid()) and o.is_current_owner;
$$;

revoke execute on function public.fn62_my_animals() from public, anon;
grant execute on function public.fn62_my_animals() to authenticated;
