-- Feeding reminders and breeding screens.

-- How often the keeper plans to feed; the next feeding is due this many days
-- after the last accepted meal.
alter table public.animals
  add column feeding_interval_days integer check (feeding_interval_days between 1 and 365);

-- Clutch details keepers track during incubation.
alter table public.clutches
  add column expected_hatch_date date,
  add column incubation_temp_c numeric(4, 1) check (incubation_temp_c between 10 and 45);

alter table public.eggs
  add constraint eggs_status_check
  check (status is null or status in ('incubating', 'hatched', 'infertile', 'failed')) not valid;
alter table public.eggs validate constraint eggs_status_check;

create index if not exists breeding_pairings_male_idx on public.breeding_pairings (male_id);
create index if not exists breeding_pairings_female_idx on public.breeding_pairings (female_id);
create index if not exists clutches_pairing_idx on public.clutches (pairing_id);
create index if not exists eggs_clutch_idx on public.eggs (clutch_id);
create index if not exists hatchlings_egg_idx on public.hatchlings (egg_id);

-- Hatch an egg: creates the new animal (owned by the caller, same species as its
-- parents), records the hatchling, and marks the egg hatched. Parents and hatch
-- date are filled in by the hatchlings_set_parents trigger.
create or replace function public.fn42_hatch_egg(
    p_egg_id uuid,
    p_name text,
    p_sex text,
    p_hatch_date date,
    p_weight_g numeric default null
)
 returns uuid
 language plpgsql
 security definer
 set search_path = public
as $$
declare
    v_species uuid;
    v_animal_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;
    if not private.can_access_egg(p_egg_id) then
        raise exception 'Egg not found';
    end if;
    if exists (select 1 from hatchlings where egg_id = p_egg_id) then
        raise exception 'This egg has already hatched';
    end if;

    select coalesce(f.species_id, m.species_id) into v_species
    from eggs e
    join clutches c on c.id = e.clutch_id
    join breeding_pairings bp on bp.id = c.pairing_id
    left join animals f on f.id = bp.female_id
    left join animals m on m.id = bp.male_id
    where e.id = p_egg_id;

    insert into animals (species_id, created_by, name, sex, hatch_date)
    values (v_species, auth.uid(), nullif(trim(p_name), ''), coalesce(p_sex, 'unknown'), p_hatch_date)
    returning id into v_animal_id;

    insert into animal_ownership (animal_id, user_id, start_date, is_current_owner)
    values (v_animal_id, auth.uid(), now(), true);

    insert into hatchlings (egg_id, animal_id, hatch_date, hatch_weight_g)
    values (p_egg_id, v_animal_id, p_hatch_date, p_weight_g);

    if p_weight_g is not null then
        insert into weight_logs (animal_id, weight_grams, recorded_at)
        values (v_animal_id, p_weight_g, p_hatch_date);
    end if;

    update eggs set status = 'hatched' where id = p_egg_id;

    return v_animal_id;
end;
$$;

revoke execute on function public.fn42_hatch_egg(uuid, text, text, date, numeric) from public, anon;
