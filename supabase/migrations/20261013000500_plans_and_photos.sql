-- Subscription plan on profiles, and per-animal photos with plan-based limits.
-- Free: 3 photos per animal. Premium: 10.

-- ============================================================================
-- Plan
-- ============================================================================

-- Users cannot change this themselves (profiles UPDATE is limited to
-- username/display_name); billing will set it with the service role.
alter table public.profiles
  add column plan text not null default 'free'
  constraint profiles_plan_check check (plan in ('free', 'premium'));

create or replace function private.photo_limit(p_user_id uuid)
 returns integer
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select case when plan = 'premium' then 10 else 3 end
    from public.profiles
    where id = p_user_id;
$$;

-- ============================================================================
-- Photos
-- ============================================================================

create table public.animal_photos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  -- Path inside the animal-photos bucket: "<animal_id>/<file name>".
  storage_path text not null unique,
  caption text,
  taken_at date,
  is_primary boolean not null default false,
  uploaded_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  check (storage_path like animal_id::text || '/%')
);

create index animal_photos_animal_idx on public.animal_photos (animal_id, created_at);
create unique index animal_photos_one_primary on public.animal_photos (animal_id) where is_primary;

-- Enforce the current owner's plan limit.
create or replace function private.check_photo_limit()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_limit integer;
begin
    -- Serialize concurrent uploads for the same animal.
    perform 1 from public.animals where id = new.animal_id for update;

    select private.photo_limit(user_id) into v_limit
    from public.animal_ownership
    where animal_id = new.animal_id and is_current_owner;

    if (select count(*) from public.animal_photos where animal_id = new.animal_id) >= coalesce(v_limit, 3) then
        raise exception 'Photo limit reached (% per animal on your plan)', coalesce(v_limit, 3);
    end if;

    return new;
end;
$$;

create trigger animal_photos_limit
  before insert on public.animal_photos
  for each row execute function private.check_photo_limit();

revoke all on function private.check_photo_limit() from public, anon, authenticated;

alter table public.animal_photos enable row level security;

-- Photos are visible wherever the animal is visible.
create policy animal_photos_select on public.animal_photos for select to anon, authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id));
create policy animal_photos_insert on public.animal_photos for insert to authenticated
  with check (private.owns_animal(animal_id) and uploaded_by = (select auth.uid()));
create policy animal_photos_update on public.animal_photos for update to authenticated
  using (private.owns_animal(animal_id)) with check (private.owns_animal(animal_id));
create policy animal_photos_delete on public.animal_photos for delete to authenticated
  using (private.owns_animal(animal_id));
