-- Lineage, locality, lifecycle status and private acquisition records.

-- ============================================================================
-- Localities: curated per species (no free text), added by moderators
-- ============================================================================

create table public.localities (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.species(id) on delete cascade,
  name text not null,
  region text,
  notes text,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index localities_species_name_key on public.localities (species_id, lower(name));

alter table public.localities enable row level security;
create policy localities_select on public.localities for select to anon, authenticated using (true);

-- ============================================================================
-- New animal columns
-- ============================================================================

alter table public.animals
  add column sire_id uuid references public.animals(id) on delete set null,
  add column dam_id uuid references public.animals(id) on delete set null,
  add column locality_id uuid references public.localities(id),
  add column status text not null default 'active'
    check (status in ('active', 'sold', 'deceased', 'lost', 'on_loan')),
  add column status_date date,
  -- The keeper's own tag or tub label, e.g. "BP-24-07".
  add column animal_code text,
  add constraint animals_not_own_parent check (sire_id <> id and dam_id <> id);

create index animals_sire_idx on public.animals (sire_id) where sire_id is not null;
create index animals_dam_idx on public.animals (dam_id) where dam_id is not null;

-- Parents must be the same species, and the right sex if their sex is known.
create or replace function private.check_animal_parents()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_parent public.animals;
begin
    if new.sire_id is not null then
        select * into v_parent from public.animals where id = new.sire_id;
        if v_parent.species_id is distinct from new.species_id then
            raise exception 'Sire must be the same species';
        end if;
        if v_parent.sex = 'female' then
            raise exception 'Sire cannot be female';
        end if;
    end if;

    if new.dam_id is not null then
        select * into v_parent from public.animals where id = new.dam_id;
        if v_parent.species_id is distinct from new.species_id then
            raise exception 'Dam must be the same species';
        end if;
        if v_parent.sex = 'male' then
            raise exception 'Dam cannot be male';
        end if;
    end if;

    if new.locality_id is not null and not exists (
        select 1 from public.localities
        where id = new.locality_id and species_id = new.species_id
    ) then
        raise exception 'Locality does not belong to this species';
    end if;

    return new;
end;
$$;

create trigger animals_check_parents
  before insert or update of sire_id, dam_id, locality_id, species_id on public.animals
  for each row execute function private.check_animal_parents();

-- A hatchling linked to an animal inherits that clutch's parents.
create or replace function private.set_hatchling_parents()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
as $$
begin
    if new.animal_id is null then
        return new;
    end if;

    update public.animals a
    set sire_id = coalesce(a.sire_id, bp.male_id),
        dam_id = coalesce(a.dam_id, bp.female_id),
        hatch_date = coalesce(a.hatch_date, new.hatch_date::date)
    from public.eggs e
    join public.clutches c on c.id = e.clutch_id
    join public.breeding_pairings bp on bp.id = c.pairing_id
    where e.id = new.egg_id and a.id = new.animal_id;

    return new;
end;
$$;

create trigger hatchlings_set_parents
  after insert or update of animal_id on public.hatchlings
  for each row execute function private.set_hatchling_parents();

revoke all on function private.check_animal_parents() from public, anon, authenticated;
revoke all on function private.set_hatchling_parents() from public, anon, authenticated;

-- ============================================================================
-- Acquisitions: private to each owner, one row per owner per animal
-- ============================================================================

create table public.animal_acquisitions (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id),
  acquired_date date,
  source_type text
    check (source_type in ('own_breeding', 'breeder', 'pet_store', 'expo', 'rescue', 'gift', 'wild_caught', 'other')),
  source_name text,
  price numeric(10,2) check (price >= 0),
  currency text default 'USD' check (currency ~ '^[A-Z]{3}$'),
  notes text,
  created_at timestamptz not null default now(),
  unique (animal_id, user_id)
);

alter table public.animal_acquisitions enable row level security;

create policy animal_acquisitions_select on public.animal_acquisitions for select to authenticated
  using (user_id = (select auth.uid()));
create policy animal_acquisitions_insert on public.animal_acquisitions for insert to authenticated
  with check (user_id = (select auth.uid()) and private.owns_animal(animal_id));
create policy animal_acquisitions_update on public.animal_acquisitions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy animal_acquisitions_delete on public.animal_acquisitions for delete to authenticated
  using (user_id = (select auth.uid()));

-- ============================================================================
-- Lineage lookup
-- ============================================================================

-- Ancestors up to p_generations back. Runs as the caller, so parents the
-- caller cannot see (another keeper's private animal) are left out.
create or replace function public.fn32_get_ancestors(p_animal_id uuid, p_generations integer default 3)
 returns table(animal_id uuid, name text, sex text, generation integer, relation text)
 language sql
 stable
 set search_path = public
as $$
    with recursive tree as (
        select a.id, a.name, a.sex, a.sire_id, a.dam_id, 0 as generation, 'self'::text as relation
        from animals a
        where a.id = p_animal_id
      union all
        select p.id, p.name, p.sex, p.sire_id, p.dam_id, t.generation + 1,
               case when p.id = t.sire_id then 'sire' else 'dam' end
        from tree t
        join animals p on p.id in (t.sire_id, t.dam_id)
        where t.generation < least(p_generations, 10)
    )
    select id, name, sex, generation, relation
    from tree
    where generation > 0
    order by generation, relation desc;
$$;

create or replace function public.fn33_get_offspring(p_animal_id uuid)
 returns table(animal_id uuid, name text, sex text, hatch_date date)
 language sql
 stable
 set search_path = public
as $$
    select a.id, a.name, a.sex, a.hatch_date
    from animals a
    where a.sire_id = p_animal_id or a.dam_id = p_animal_id
    order by a.hatch_date nulls last, a.name;
$$;
