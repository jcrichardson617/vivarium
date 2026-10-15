-- Gear: a product catalog, the gear each enclosure uses, and an anonymous,
-- aggregated "popular with <species> keepers" list for species pages.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  brand text check (length(brand) <= 80),
  category text not null check (category in ('lighting', 'heating', 'thermostat', 'substrate', 'enclosure', 'food', 'supplement', 'monitoring', 'other')),
  -- Public advisory shown with the product, e.g. "outdated" guidance.
  note text,
  -- Blocked products are never recommended (clear safety record against them).
  blocked boolean not null default false,
  block_reason text,
  status text not null default 'pending' check (status in ('approved', 'pending', 'rejected')),
  amazon_url text,
  chewy_url text,
  other_url text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index products_name_key on public.products (lower(trim(name)));

alter table public.products enable row level security;
create policy products_select on public.products for select to anon, authenticated
  using (status = 'approved' or created_by = (select auth.uid()) or private.is_moderator());
-- Keepers can suggest products; moderators approve them and add links.
create policy products_insert on public.products for insert to authenticated
  with check (
    created_by = (select auth.uid()) and status = 'pending' and not blocked
    and amazon_url is null and chewy_url is null and other_url is null and note is null
  );
create policy products_update on public.products for update to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

create table public.enclosure_gear (
  id uuid primary key default gen_random_uuid(),
  enclosure_id uuid not null references public.enclosures(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  added_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (enclosure_id, product_id)
);

create index enclosure_gear_product_idx on public.enclosure_gear (product_id);

alter table public.enclosure_gear enable row level security;
create policy enclosure_gear_select on public.enclosure_gear for select to authenticated
  using (private.owns_enclosure(enclosure_id));
create policy enclosure_gear_insert on public.enclosure_gear for insert to authenticated
  with check (private.owns_enclosure(enclosure_id) and exists (select 1 from public.products p where p.id = product_id));
-- Removing gear sets removed_at (soft delete) so nothing is ever deleted.
create policy enclosure_gear_update on public.enclosure_gear for update to authenticated
  using (private.owns_enclosure(enclosure_id)) with check (private.owns_enclosure(enclosure_id));

-- Opt-out of contributing to anonymous gear statistics.
alter table public.profiles add column share_gear boolean not null default true;
grant update (share_gear) on public.profiles to authenticated;

-- Products used by at least p_min_keepers different keepers (never fewer than 5)
-- in enclosures currently housing this species. Counts only, no identities.
create or replace function public.fn51_species_popular_gear(p_species_id uuid, p_min_keepers integer default 5)
 returns table(id uuid, name text, brand text, category text, note text, amazon_url text, chewy_url text, other_url text, keepers bigint)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select p.id, p.name, p.brand, p.category, p.note, p.amazon_url, p.chewy_url, p.other_url,
           count(distinct e.owner_id) as keepers
    from public.enclosure_gear g
    join public.products p on p.id = g.product_id
    join public.enclosures e on e.id = g.enclosure_id
    join public.profiles pr on pr.id = e.owner_id and pr.share_gear
    join public.animal_enclosures ae on ae.enclosure_id = e.id and ae.end_date is null
    join public.animals a on a.id = ae.animal_id and a.species_id = p_species_id
    where p.status = 'approved' and not p.blocked and g.removed_at is null
    group by p.id
    having count(distinct e.owner_id) >= greatest(coalesce(p_min_keepers, 5), 5)
    order by keepers desc, p.name
    limit 12;
$$;

-- Moderator: fold a suggested product into an existing one (keeps everyone's gear).
create or replace function public.fn52_merge_product(p_from uuid, p_into uuid)
 returns void
 language plpgsql
 security definer
 set search_path = ''
as $$
begin
    if not private.is_moderator() then
        raise exception 'Moderator access required';
    end if;
    if p_from = p_into then
        raise exception 'Pick a different product';
    end if;
    insert into public.enclosure_gear (enclosure_id, product_id, added_at)
    select enclosure_id, p_into, added_at from public.enclosure_gear where product_id = p_from
    on conflict (enclosure_id, product_id) do nothing;
    -- The duplicate is retired rather than removed; its gear rows no longer count.
    update public.products set status = 'rejected', note = 'Merged into another product.' where id = p_from;
end;
$$;

revoke execute on function public.fn52_merge_product(uuid, uuid) from public, anon;

-- Starter catalog.
insert into public.products (name, brand, category, note, blocked, block_reason, status, created_by) values
  ('Arcadia T5 HO 6% UVB (Forest)', 'Arcadia', 'lighting', null, false, null, 'approved', null),
  ('Arcadia T5 HO 12% UVB (Desert)', 'Arcadia', 'lighting', null, false, null, 'approved', null),
  ('Arcadia T5 HO 14% UVB (Dragon)', 'Arcadia', 'lighting', null, false, null, 'approved', null),
  ('Zoo Med ReptiSun T5 HO 5.0', 'Zoo Med', 'lighting', null, false, null, 'approved', null),
  ('Zoo Med ReptiSun T5 HO 10.0', 'Zoo Med', 'lighting', null, false, null, 'approved', null),
  ('Compact (coil) UVB bulb', null, 'lighting', 'Outdated: small, short-range UVB coverage that fades quickly. Linear T5 HO tubes are the modern standard.', false, null, 'approved', null),
  ('Arcadia Deep Heat Projector', 'Arcadia', 'heating', null, false, null, 'approved', null),
  ('Halogen flood bulb', null, 'heating', null, false, null, 'approved', null),
  ('Ceramic heat emitter', null, 'heating', 'Use with a thermostat.', false, null, 'approved', null),
  ('Radiant heat panel', null, 'heating', 'Use with a thermostat.', false, null, 'approved', null),
  ('Heat mat', null, 'heating', 'Always use with a thermostat.', false, null, 'approved', null),
  ('Heat rock', null, 'heating', null, true, 'Heat rocks can overheat unevenly and cause serious burns.', 'approved', null),
  ('Spyder Robotics Herpstat', 'Spyder Robotics', 'thermostat', null, false, null, 'approved', null),
  ('Inkbird ITC-308', 'Inkbird', 'thermostat', null, false, null, 'approved', null),
  ('Vivarium Electronics VE-200', 'Vivarium Electronics', 'thermostat', null, false, null, 'approved', null),
  ('Zoo Med ReptiSoil', 'Zoo Med', 'substrate', null, false, null, 'approved', null),
  ('Cypress mulch', null, 'substrate', null, false, null, 'approved', null),
  ('Coco coir / coconut fiber', null, 'substrate', null, false, null, 'approved', null),
  ('Bioactive soil mix', null, 'substrate', null, false, null, 'approved', null),
  ('Paper towel / newspaper', null, 'substrate', null, false, null, 'approved', null),
  ('Calcium sand', null, 'substrate', 'Not recommended: associated with impaction.', false, null, 'approved', null),
  ('Zen Habitats enclosure', 'Zen Habitats', 'enclosure', null, false, null, 'approved', null),
  ('Exo Terra glass terrarium', 'Exo Terra', 'enclosure', null, false, null, 'approved', null),
  ('PVC enclosure', null, 'enclosure', null, false, null, 'approved', null),
  ('Repashy Crested Gecko MRP', 'Repashy', 'food', null, false, null, 'approved', null),
  ('Pangea Fruit Mix Complete', 'Pangea', 'food', null, false, null, 'approved', null),
  ('Repashy Calcium Plus', 'Repashy', 'supplement', null, false, null, 'approved', null),
  ('Zoo Med Repti Calcium with D3', 'Zoo Med', 'supplement', null, false, null, 'approved', null),
  ('Digital thermometer / hygrometer', null, 'monitoring', null, false, null, 'approved', null),
  ('Infrared temperature gun', null, 'monitoring', null, false, null, 'approved', null)
on conflict do nothing;
