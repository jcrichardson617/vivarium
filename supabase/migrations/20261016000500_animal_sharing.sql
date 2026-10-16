-- Sharing an animal with other keepers. The owner invites someone by username:
--   caretaker: sees everything and can log feedings, weights, lengths, sheds,
--              health events, notes and photos (and edit or delete their own entries)
--   viewer:    sees everything, changes nothing
-- Editing the animal itself, genetics, enclosures, breeding, transfers, deleting
-- and managing shares stay with the owner. Shares end when the animal changes owner.

create table public.animal_shares (
    id uuid primary key default gen_random_uuid(),
    animal_id uuid not null references public.animals(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null check (role in ('caretaker', 'viewer')),
    shared_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    notified_at timestamptz,
    unique (animal_id, user_id)
);

create index animal_shares_user_idx on public.animal_shares (user_id);
create index animal_shares_unnotified_idx on public.animal_shares (created_at) where notified_at is null;

alter table public.animal_shares enable row level security;

-- The owner sees and removes everyone's access; a keeper sees and removes their own.
-- Adding and changing roles goes through fn68_share_animal.
create policy animal_shares_select on public.animal_shares for select to authenticated
  using (user_id = (select auth.uid()) or private.owns_animal(animal_id));
create policy animal_shares_delete on public.animal_shares for delete to authenticated
  using (user_id = (select auth.uid()) or private.owns_animal(animal_id));

grant select, delete on public.animal_shares to authenticated;

-- ============================================================================
-- Access helpers
-- ============================================================================

create or replace function private.can_view_animal(p_animal_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select private.owns_animal(p_animal_id)
        or exists (select 1 from public.animal_shares
                   where animal_id = p_animal_id and user_id = (select auth.uid()));
$$;

create or replace function private.can_care_for_animal(p_animal_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select private.owns_animal(p_animal_id)
        or exists (select 1 from public.animal_shares
                   where animal_id = p_animal_id and user_id = (select auth.uid()) and role = 'caretaker');
$$;

grant execute on function private.can_view_animal(uuid) to authenticated;
grant execute on function private.can_care_for_animal(uuid) to authenticated;

-- ============================================================================
-- Policies: viewers read, caretakers log, owners keep full control
-- ============================================================================

alter policy animals_select on public.animals
  using (visibility = 'public' or private.can_view_animal(id));

alter policy animal_enclosures_select on public.animal_enclosures
  using (private.owns_enclosure(enclosure_id) or private.can_view_animal(animal_id));

-- Log tables. Owners change any entry; caretakers change the entries they made.
alter policy feedings_select on public.feedings using (private.can_view_animal(animal_id));
alter policy feedings_insert on public.feedings
  with check (private.can_care_for_animal(animal_id) and fed_by = (select auth.uid()));
alter policy feedings_update on public.feedings
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and fed_by = (select auth.uid())))
  with check (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and fed_by = (select auth.uid())));
alter policy feedings_delete on public.feedings
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and fed_by = (select auth.uid())));

alter policy weight_logs_select on public.weight_logs using (private.can_view_animal(animal_id));
alter policy weight_logs_insert on public.weight_logs
  with check (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid()));
alter policy weight_logs_update on public.weight_logs
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())))
  with check (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));
alter policy weight_logs_delete on public.weight_logs
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));

alter policy length_logs_select on public.length_logs using (private.can_view_animal(animal_id));
alter policy length_logs_insert on public.length_logs
  with check (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid()));
alter policy length_logs_update on public.length_logs
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())))
  with check (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));
alter policy length_logs_delete on public.length_logs
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));

alter policy sheds_select on public.sheds using (private.can_view_animal(animal_id));
alter policy sheds_insert on public.sheds
  with check (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid()));
alter policy sheds_update on public.sheds
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())))
  with check (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));
alter policy sheds_delete on public.sheds
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));

alter policy health_events_select on public.health_events using (private.can_view_animal(animal_id));
alter policy health_events_insert on public.health_events
  with check (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid()));
alter policy health_events_update on public.health_events
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())))
  with check (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));
alter policy health_events_delete on public.health_events
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and recorded_by = (select auth.uid())));

-- Notes were already author-only for changes.
alter policy animal_notes_select on public.animal_notes using (private.can_view_animal(animal_id));
alter policy animal_notes_insert on public.animal_notes
  with check (private.can_care_for_animal(animal_id) and created_by = (select auth.uid()));
alter policy animal_notes_update on public.animal_notes
  using (private.can_care_for_animal(animal_id) and created_by = (select auth.uid()))
  with check (private.can_care_for_animal(animal_id) and created_by = (select auth.uid()));
alter policy animal_notes_delete on public.animal_notes
  using (private.can_care_for_animal(animal_id) and created_by = (select auth.uid()));

-- Photos: caretakers add and remove their own; the owner picks the main photo.
alter policy animal_photos_insert on public.animal_photos
  with check (private.can_care_for_animal(animal_id) and uploaded_by = (select auth.uid()));
alter policy animal_photos_delete on public.animal_photos
  using (private.owns_animal(animal_id) or (private.can_care_for_animal(animal_id) and uploaded_by = (select auth.uid())));

-- Photo files: the owner's plan sets the per-animal limit, whoever uploads.
create or replace function private.can_upload_animal_photo(p_object_name text)
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select exists (
        select 1
        from public.animal_ownership ao
        where ao.animal_id::text = split_part(p_object_name, '/', 1)
          and ao.is_current_owner
          and private.can_care_for_animal(ao.animal_id)
          and (
              select count(*) from storage.objects o
              where o.bucket_id = 'animal-photos'
                and split_part(o.name, '/', 1) = split_part(p_object_name, '/', 1)
          ) < private.photo_limit(ao.user_id)
    );
$$;

create or replace function private.can_care_for_animal_folder(p_object_name text)
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select exists (
        select 1 from public.animals a
        where a.id::text = split_part(p_object_name, '/', 1)
          and private.can_care_for_animal(a.id)
    );
$$;

grant execute on function private.can_care_for_animal_folder(text) to authenticated;

alter policy "animal photos deletable by owner" on storage.objects
  using (bucket_id = 'animal-photos'
         and (private.owns_animal_folder(name)
              or (owner_id = (select auth.uid())::text and private.can_care_for_animal_folder(name))));

-- ============================================================================
-- Shares end when the animal changes hands
-- ============================================================================

create or replace function private.clear_shares_on_new_owner()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
as $$
begin
    if new.is_current_owner and (tg_op = 'INSERT' or not coalesce(old.is_current_owner, false)) then
        delete from public.animal_shares where animal_id = new.animal_id;
    end if;
    return new;
end;
$$;

create trigger animal_ownership_clear_shares
  after insert or update of is_current_owner on public.animal_ownership
  for each row execute function private.clear_shares_on_new_owner();

-- ============================================================================
-- RPCs
-- ============================================================================

-- Share (or change the role of an existing share) by username. Owner only.
create or replace function public.fn68_share_animal(p_animal_id uuid, p_username text, p_role text)
 returns uuid
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_user uuid;
    v_id uuid;
begin
    if not private.owns_animal(p_animal_id) then
        raise exception 'Only the owner can share this animal';
    end if;
    if p_role not in ('caretaker', 'viewer') then
        raise exception 'Role must be caretaker or viewer';
    end if;

    select id into v_user from public.profiles where username = lower(trim(leading '@' from trim(p_username)));
    if v_user is null then
        raise exception 'No keeper with the username "%"', trim(p_username);
    end if;
    if v_user = auth.uid() then
        raise exception 'You already own this animal';
    end if;
    if (select count(*) from public.animal_shares where animal_id = p_animal_id) >= 20 then
        raise exception 'An animal can be shared with up to 20 keepers';
    end if;

    insert into public.animal_shares (animal_id, user_id, role, shared_by)
    values (p_animal_id, v_user, p_role, auth.uid())
    on conflict (animal_id, user_id) do update set role = excluded.role
    returning id into v_id;
    return v_id;
end;
$$;

revoke execute on function public.fn68_share_animal(uuid, text, text) from public, anon;
grant execute on function public.fn68_share_animal(uuid, text, text) to authenticated;

-- What the current keeper can do with an animal, and who owns it.
create or replace function public.fn69_animal_access(p_animal_id uuid)
 returns table(access text, owner_username text, owner_display_name text)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select case
             when private.owns_animal(p_animal_id) then 'owner'
             else (select s.role from public.animal_shares s
                   where s.animal_id = p_animal_id and s.user_id = (select auth.uid()))
           end,
           p.username, p.display_name
    from public.animal_ownership o
    join public.profiles p on p.id = o.user_id
    where o.animal_id = p_animal_id and o.is_current_owner
      and private.can_view_animal(p_animal_id);
$$;

revoke execute on function public.fn69_animal_access(uuid) from public, anon;
grant execute on function public.fn69_animal_access(uuid) to authenticated;

-- The collection: animals you own plus animals shared with you. Shared animals
-- show the owner's enclosure name but not their tags.
create or replace function public.fn67_my_animals()
 returns table(
   id uuid, name text, sex text, hatch_date date, status text, animal_code text,
   feeding_interval_days integer, created_at timestamptz,
   species_common_name text, species_scientific_name text,
   pending_species text, pending_species_status text,
   last_fed_at timestamptz, enclosure_id uuid, enclosure_name text,
   tags text[], photo_path text, morph text, latest_weight_g numeric, weights_g numeric[],
   access text, owner_username text)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    with mine as (
        select o.animal_id, o.tags, 'owner'::text as access, null::text as owner_username
        from public.animal_ownership o
        where o.user_id = (select auth.uid()) and o.is_current_owner
        union all
        select sh.animal_id, '{}'::text[], sh.role, p.username
        from public.animal_shares sh
        join public.animal_ownership o on o.animal_id = sh.animal_id and o.is_current_owner
        join public.profiles p on p.id = o.user_id
        where sh.user_id = (select auth.uid())
    )
    select a.id, a.name, a.sex, a.hatch_date, a.status, a.animal_code,
           a.feeding_interval_days, a.created_at,
           s.common_name, s.scientific_name,
           ss.scientific_name, ss.status,
           (select max(f.fed_at) from public.feedings f where f.animal_id = a.id and f.accepted),
           e.id, e.name,
           m.tags,
           (select ph.storage_path from public.animal_photos ph where ph.animal_id = a.id
             order by ph.is_primary desc, ph.created_at limit 1),
           nullif(public.morph_name(a.id), ''),
           w.weights[array_length(w.weights, 1)],
           w.weights,
           m.access, m.owner_username
    from mine m
    join public.animals a on a.id = m.animal_id
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
    ) w on true;
$$;

revoke execute on function public.fn67_my_animals() from public, anon;
grant execute on function public.fn67_my_animals() to authenticated;

-- New shares that haven't been emailed (send-emails, kind "transfers").
create or replace function public.fn70_pending_share_emails(p_limit integer default 50)
 returns table(share_id uuid, email text, to_name text, from_username text, from_display_name text,
               animal_id uuid, animal_name text, species text, role text)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select sh.id, u.email::text, coalesce(tp.display_name, tp.username),
           fp.username, fp.display_name,
           a.id, coalesce(a.name, 'an animal'), s.common_name, sh.role
    from public.animal_shares sh
    join auth.users u on u.id = sh.user_id
    join public.profiles tp on tp.id = sh.user_id
    join public.profiles fp on fp.id = sh.shared_by
    join public.animals a on a.id = sh.animal_id
    left join public.species s on s.id = a.species_id
    where sh.notified_at is null and u.email_confirmed_at is not null
    order by sh.created_at
    limit p_limit;
$$;

create or replace function public.fn71_mark_share_notified(p_share_id uuid)
 returns void
 language sql
 security definer
 set search_path = ''
as $$
    update public.animal_shares set notified_at = now() where id = p_share_id;
$$;

revoke execute on function public.fn70_pending_share_emails(integer) from public, anon, authenticated;
revoke execute on function public.fn71_mark_share_notified(uuid) from public, anon, authenticated;
grant execute on function public.fn70_pending_share_emails(integer) to service_role;
grant execute on function public.fn71_mark_share_notified(uuid) to service_role;
