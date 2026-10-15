-- Organizing large collections: keeper-defined tags (per owner, so they don't
-- follow an animal to its next keeper) and one call that returns the whole
-- collection with what the list needs to search, filter, sort and group.

alter table public.animal_ownership add column tags text[] not null default '{}';
create index animal_ownership_tags_idx on public.animal_ownership using gin (tags) where is_current_owner;

create or replace function public.fn57_my_animals()
 returns table(
   id uuid, name text, sex text, hatch_date date, status text, animal_code text,
   feeding_interval_days integer, created_at timestamptz,
   species_common_name text, species_scientific_name text,
   pending_species text, pending_species_status text,
   last_fed_at timestamptz, enclosure_id uuid, enclosure_name text,
   tags text[], photo_path text)
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
             order by p.is_primary desc, p.created_at limit 1)
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
    where o.user_id = (select auth.uid()) and o.is_current_owner;
$$;

-- Replace one animal's tags.
create or replace function public.fn58_set_animal_tags(p_animal_id uuid, p_tags text[])
 returns void
 language sql
 security definer
 set search_path = ''
as $$
    update public.animal_ownership
    set tags = coalesce((select array_agg(distinct t order by t)
                         from unnest(p_tags) u(x), lateral (select left(btrim(x), 40) as t) c
                         where t <> ''), '{}')
    where animal_id = p_animal_id and user_id = (select auth.uid()) and is_current_owner;
$$;

-- Add or remove one tag on many animals at once (bulk actions on the list).
create or replace function public.fn59_tag_animals(p_animal_ids uuid[], p_tag text, p_add boolean)
 returns integer
 language sql
 security definer
 set search_path = ''
as $$
    with u as (
        update public.animal_ownership
        set tags = case
            when p_add then (select array_agg(distinct t order by t) from unnest(tags || left(btrim(p_tag), 40)) t)
            else array_remove(tags, btrim(p_tag)) end
        where animal_id = any(p_animal_ids) and user_id = (select auth.uid()) and is_current_owner
          and btrim(p_tag) <> ''
        returning 1
    )
    select count(*)::integer from u;
$$;

revoke execute on function public.fn57_my_animals() from public, anon;
revoke execute on function public.fn58_set_animal_tags(uuid, text[]) from public, anon;
revoke execute on function public.fn59_tag_animals(uuid[], text, boolean) from public, anon;
grant execute on function public.fn57_my_animals() to authenticated;
grant execute on function public.fn58_set_animal_tags(uuid, text[]) to authenticated;
grant execute on function public.fn59_tag_animals(uuid[], text, boolean) to authenticated;
