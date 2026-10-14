-- Public sharing: animal pages and keeper profiles that work without signing in.
-- Ownership rows are private, so these definer functions expose only what is
-- needed for animals their owner marked public.

-- Usernames appear in URLs: 3-30 lowercase letters, digits or underscores.
alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$') not valid;
alter table public.profiles validate constraint profiles_username_format;

create or replace function public.fn37_public_animal_keeper(p_animal_id uuid)
 returns table(username text, display_name text)
 language sql
 stable
 security definer
 set search_path = public
as $$
    select p.username, p.display_name
    from animals a
    join animal_ownership ao on ao.animal_id = a.id and ao.is_current_owner
    join profiles p on p.id = ao.user_id
    where a.id = p_animal_id and a.visibility = 'public';
$$;

create or replace function public.fn38_public_animals_for_keeper(p_username text)
 returns table(id uuid, name text, sex text, hatch_date date, common_name text, scientific_name text, photo_path text)
 language sql
 stable
 security definer
 set search_path = public
as $$
    select a.id, a.name, a.sex, a.hatch_date, s.common_name, s.scientific_name,
           (select ph.storage_path from animal_photos ph
             where ph.animal_id = a.id
             order by ph.is_primary desc, ph.created_at
             limit 1)
    from profiles p
    join animal_ownership ao on ao.user_id = p.id and ao.is_current_owner
    join animals a on a.id = ao.animal_id
    left join species s on s.id = a.species_id
    where p.username = lower(p_username)
      and a.visibility = 'public'
      and a.status = 'active'
    order by s.common_name nulls last, a.name;
$$;
