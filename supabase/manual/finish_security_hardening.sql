-- Finishes the security hardening migration on production.
-- Parts 1-3 (views, roles, helpers) were applied by Claude; this part removes
-- old policies and functions, which the connector could not run.
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.

begin;

-- ============================================================================
-- Policies: drop everything and rebuild one coherent set
-- ============================================================================

do $$
declare
    r record;
begin
    for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
        execute format('drop policy %I on public.%I', r.policyname, r.tablename);
    end loop;
end;
$$;

-- profiles: usernames are public (shown on public animals); only you edit yours.
create policy profiles_select on public.profiles for select to anon, authenticated
  using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- species, synonyms, research: public read; writes only via moderator functions.
create policy species_select on public.species for select to anon, authenticated
  using (true);
create policy species_synonyms_select on public.species_synonyms for select to anon, authenticated
  using (true);
create policy research_documents_select on public.research_documents for select to anon, authenticated
  using (true);

-- species_submissions: submit your own, see your own; moderators see all.
create policy species_submissions_select on public.species_submissions for select to authenticated
  using (submitted_by = (select auth.uid()) or private.is_moderator());
create policy species_submissions_insert on public.species_submissions for insert to authenticated
  with check (submitted_by = (select auth.uid()) and status = 'pending');

-- animals: public ones visible to all; the current owner manages the rest.
-- New animals are created through fn19_create_animal, which also records ownership.
create policy animals_select on public.animals for select to anon, authenticated
  using (visibility = 'public' or private.owns_animal(id));
create policy animals_update on public.animals for update to authenticated
  using (private.owns_animal(id)) with check (private.owns_animal(id));
create policy animals_delete on public.animals for delete to authenticated
  using (private.owns_animal(id));

-- animal_ownership: full history is visible to the current owner and to anyone
-- who was ever an owner of that animal. Writes go through the transfer functions.
create policy animal_ownership_select on public.animal_ownership for select to authenticated
  using (user_id = (select auth.uid()) or private.owns_animal(animal_id));

-- ownership_transfers: parties can see them; writes go through the transfer functions.
create policy ownership_transfers_select on public.ownership_transfers for select to authenticated
  using (from_user_id = (select auth.uid()) or to_user_id = (select auth.uid()));

-- Per-animal logs: the current owner reads and writes, and must record as themself.
create policy feedings_select on public.feedings for select to authenticated
  using (private.owns_animal(animal_id));
create policy feedings_insert on public.feedings for insert to authenticated
  with check (private.owns_animal(animal_id) and fed_by = (select auth.uid()));
create policy feedings_update on public.feedings for update to authenticated
  using (private.owns_animal(animal_id)) with check (private.owns_animal(animal_id));
create policy feedings_delete on public.feedings for delete to authenticated
  using (private.owns_animal(animal_id));

create policy sheds_select on public.sheds for select to authenticated
  using (private.owns_animal(animal_id));
create policy sheds_insert on public.sheds for insert to authenticated
  with check (private.owns_animal(animal_id) and recorded_by = (select auth.uid()));
create policy sheds_update on public.sheds for update to authenticated
  using (private.owns_animal(animal_id)) with check (private.owns_animal(animal_id));
create policy sheds_delete on public.sheds for delete to authenticated
  using (private.owns_animal(animal_id));

create policy health_events_select on public.health_events for select to authenticated
  using (private.owns_animal(animal_id));
create policy health_events_insert on public.health_events for insert to authenticated
  with check (private.owns_animal(animal_id) and recorded_by = (select auth.uid()));
create policy health_events_update on public.health_events for update to authenticated
  using (private.owns_animal(animal_id)) with check (private.owns_animal(animal_id));
create policy health_events_delete on public.health_events for delete to authenticated
  using (private.owns_animal(animal_id));

create policy length_logs_select on public.length_logs for select to authenticated
  using (private.owns_animal(animal_id));
create policy length_logs_insert on public.length_logs for insert to authenticated
  with check (private.owns_animal(animal_id) and recorded_by = (select auth.uid()));
create policy length_logs_update on public.length_logs for update to authenticated
  using (private.owns_animal(animal_id)) with check (private.owns_animal(animal_id));
create policy length_logs_delete on public.length_logs for delete to authenticated
  using (private.owns_animal(animal_id));

create policy weight_logs_select on public.weight_logs for select to authenticated
  using (private.owns_animal(animal_id));
create policy weight_logs_insert on public.weight_logs for insert to authenticated
  with check (private.owns_animal(animal_id) and recorded_by = (select auth.uid()));
create policy weight_logs_update on public.weight_logs for update to authenticated
  using (private.owns_animal(animal_id)) with check (private.owns_animal(animal_id));
create policy weight_logs_delete on public.weight_logs for delete to authenticated
  using (private.owns_animal(animal_id));

create policy animal_notes_select on public.animal_notes for select to authenticated
  using (private.owns_animal(animal_id));
create policy animal_notes_insert on public.animal_notes for insert to authenticated
  with check (private.owns_animal(animal_id) and created_by = (select auth.uid()));
create policy animal_notes_update on public.animal_notes for update to authenticated
  using (private.owns_animal(animal_id) and created_by = (select auth.uid()))
  with check (private.owns_animal(animal_id) and created_by = (select auth.uid()));
create policy animal_notes_delete on public.animal_notes for delete to authenticated
  using (private.owns_animal(animal_id) and created_by = (select auth.uid()));

-- enclosures and their environment logs belong to the enclosure owner.
create policy enclosures_select on public.enclosures for select to authenticated
  using (owner_id = (select auth.uid()));
create policy enclosures_insert on public.enclosures for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy enclosures_update on public.enclosures for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy enclosures_delete on public.enclosures for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy environment_logs_select on public.environment_logs for select to authenticated
  using (private.owns_enclosure(enclosure_id));
create policy environment_logs_insert on public.environment_logs for insert to authenticated
  with check (private.owns_enclosure(enclosure_id));
create policy environment_logs_update on public.environment_logs for update to authenticated
  using (private.owns_enclosure(enclosure_id)) with check (private.owns_enclosure(enclosure_id));
create policy environment_logs_delete on public.environment_logs for delete to authenticated
  using (private.owns_enclosure(enclosure_id));

-- animal_enclosures: you must own both the enclosure and the animal to place it.
create policy animal_enclosures_select on public.animal_enclosures for select to authenticated
  using (private.owns_enclosure(enclosure_id) or private.owns_animal(animal_id));
create policy animal_enclosures_insert on public.animal_enclosures for insert to authenticated
  with check (private.owns_enclosure(enclosure_id) and private.owns_animal(animal_id));
create policy animal_enclosures_update on public.animal_enclosures for update to authenticated
  using (private.owns_enclosure(enclosure_id) and private.owns_animal(animal_id))
  with check (private.owns_enclosure(enclosure_id) and private.owns_animal(animal_id));
create policy animal_enclosures_delete on public.animal_enclosures for delete to authenticated
  using (private.owns_enclosure(enclosure_id) and private.owns_animal(animal_id));

-- Breeding chain: pairing -> clutch -> egg -> incubation log / hatchling.
create policy breeding_pairings_select on public.breeding_pairings for select to authenticated
  using (private.owns_animal(male_id) or private.owns_animal(female_id));
create policy breeding_pairings_insert on public.breeding_pairings for insert to authenticated
  with check (private.owns_animal(male_id) or private.owns_animal(female_id));
create policy breeding_pairings_update on public.breeding_pairings for update to authenticated
  using (private.owns_animal(male_id) or private.owns_animal(female_id))
  with check (private.owns_animal(male_id) or private.owns_animal(female_id));
create policy breeding_pairings_delete on public.breeding_pairings for delete to authenticated
  using (private.owns_animal(male_id) or private.owns_animal(female_id));

create policy clutches_select on public.clutches for select to authenticated
  using (private.can_access_pairing(pairing_id));
create policy clutches_insert on public.clutches for insert to authenticated
  with check (private.can_access_pairing(pairing_id));
create policy clutches_update on public.clutches for update to authenticated
  using (private.can_access_pairing(pairing_id)) with check (private.can_access_pairing(pairing_id));
create policy clutches_delete on public.clutches for delete to authenticated
  using (private.can_access_pairing(pairing_id));

create policy eggs_select on public.eggs for select to authenticated
  using (private.can_access_clutch(clutch_id));
create policy eggs_insert on public.eggs for insert to authenticated
  with check (private.can_access_clutch(clutch_id));
create policy eggs_update on public.eggs for update to authenticated
  using (private.can_access_clutch(clutch_id)) with check (private.can_access_clutch(clutch_id));
create policy eggs_delete on public.eggs for delete to authenticated
  using (private.can_access_clutch(clutch_id));

create policy incubation_logs_select on public.incubation_logs for select to authenticated
  using (private.can_access_egg(egg_id));
create policy incubation_logs_insert on public.incubation_logs for insert to authenticated
  with check (private.can_access_egg(egg_id));
create policy incubation_logs_update on public.incubation_logs for update to authenticated
  using (private.can_access_egg(egg_id)) with check (private.can_access_egg(egg_id));
create policy incubation_logs_delete on public.incubation_logs for delete to authenticated
  using (private.can_access_egg(egg_id));

-- A hatchling row links an egg to the animal record created for it.
create policy hatchlings_select on public.hatchlings for select to authenticated
  using (private.can_access_egg(egg_id) or private.owns_animal(animal_id));
create policy hatchlings_insert on public.hatchlings for insert to authenticated
  with check (private.can_access_egg(egg_id) and (animal_id is null or private.owns_animal(animal_id)));
create policy hatchlings_update on public.hatchlings for update to authenticated
  using (private.can_access_egg(egg_id))
  with check (private.can_access_egg(egg_id) and (animal_id is null or private.owns_animal(animal_id)));
create policy hatchlings_delete on public.hatchlings for delete to authenticated
  using (private.can_access_egg(egg_id));

-- ============================================================================
-- Functions that need elevated rights, with explicit caller checks
-- ============================================================================

-- Duplicate of fn01_accept_ownership_transfer.
drop function public.accept_transfer(uuid);

create or replace function public.fn19_create_animal(p_species_id uuid, p_name text, p_sex text, p_hatch_date date default null::date)
 returns uuid
 language plpgsql
 security definer
 set search_path = public
as $function$
declare
    v_animal_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    insert into animals (species_id, created_by, name, sex, hatch_date)
    values (p_species_id, auth.uid(), trim(p_name), p_sex, p_hatch_date)
    returning id into v_animal_id;

    insert into animal_ownership (animal_id, user_id, start_date, is_current_owner)
    values (v_animal_id, auth.uid(), now(), true);

    return v_animal_id;
end;
$function$;

create or replace function public.fn02_request_ownership_transfer(p_animal_id uuid, p_to_user_id uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path = public
as $function$
declare
    v_transfer_id uuid;
begin
    if not private.owns_animal(p_animal_id) then
        raise exception 'Only the current owner can transfer this animal';
    end if;

    if p_to_user_id = auth.uid() then
        raise exception 'Cannot transfer an animal to yourself';
    end if;

    if not exists (select 1 from profiles where id = p_to_user_id) then
        raise exception 'Recipient not found';
    end if;

    if exists (
        select 1 from ownership_transfers
        where animal_id = p_animal_id and status = 'pending'
    ) then
        raise exception 'Animal already has a pending transfer';
    end if;

    insert into ownership_transfers (animal_id, from_user_id, to_user_id)
    values (p_animal_id, auth.uid(), p_to_user_id)
    returning id into v_transfer_id;

    return v_transfer_id;
end;
$function$;

create or replace function public.fn01_accept_ownership_transfer(transfer_uuid uuid)
 returns void
 language plpgsql
 security definer
 set search_path = public
as $function$
declare
    v_transfer ownership_transfers;
begin
    select * into v_transfer
    from ownership_transfers
    where id = transfer_uuid
    for update;

    if not found or v_transfer.to_user_id is distinct from auth.uid() then
        raise exception 'Transfer not found';
    end if;

    if v_transfer.status <> 'pending' then
        raise exception 'Transfer is no longer pending';
    end if;

    -- The sender must still own the animal.
    if not exists (
        select 1 from animal_ownership
        where animal_id = v_transfer.animal_id
          and user_id = v_transfer.from_user_id
          and is_current_owner
    ) then
        raise exception 'Sender no longer owns this animal';
    end if;

    update animal_ownership
    set end_date = now(), is_current_owner = false
    where animal_id = v_transfer.animal_id and is_current_owner;

    insert into animal_ownership (animal_id, user_id, start_date, is_current_owner)
    values (v_transfer.animal_id, v_transfer.to_user_id, now(), true);

    -- The animal leaves the previous owner's enclosure.
    update animal_enclosures
    set end_date = now()
    where animal_id = v_transfer.animal_id and end_date is null;

    update ownership_transfers
    set status = 'accepted', completed_at = now()
    where id = transfer_uuid;
end;
$function$;

create or replace function public.fn03_cancel_ownership_transfer(p_transfer_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path = public
as $function$
begin
    update ownership_transfers
    set status = 'cancelled', completed_at = now()
    where id = p_transfer_id
      and status = 'pending'
      and from_user_id = auth.uid();

    if not found then
        raise exception 'No pending transfer of yours with that id';
    end if;
end;
$function$;

create or replace function public.fn04_decline_ownership_transfer(p_transfer_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path = public
as $function$
begin
    update ownership_transfers
    set status = 'declined', completed_at = now()
    where id = p_transfer_id
      and status = 'pending'
      and to_user_id = auth.uid();

    if not found then
        raise exception 'No pending transfer to you with that id';
    end if;
end;
$function$;

create or replace function public.fn15_approve_species_submission(p_submission_id uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path = public
as $function$
declare
    v_submission species_submissions;
    v_species_id uuid;
begin
    if not private.is_moderator() then
        raise exception 'Moderator access required';
    end if;

    select * into v_submission from species_submissions where id = p_submission_id for update;

    if not found then
        raise exception 'Submission not found';
    end if;

    if v_submission.status <> 'pending' then
        raise exception 'Submission already reviewed';
    end if;

    insert into species (scientific_name, common_name, genus, family)
    values (v_submission.scientific_name, v_submission.common_name, v_submission.genus, v_submission.family)
    returning id into v_species_id;

    update species_submissions
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_submission_id;

    return v_species_id;
end;
$function$;

create or replace function public.fn16_reject_species_submission(p_submission_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path = public
as $function$
begin
    if not private.is_moderator() then
        raise exception 'Moderator access required';
    end if;

    update species_submissions
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_submission_id and status = 'pending';
end;
$function$;

alter function public.handle_new_user() set search_path = public;

-- Trigger and event-trigger functions must never be callable through /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Anonymous visitors cannot call write functions.
revoke execute on function public.fn01_accept_ownership_transfer(uuid) from public, anon;
revoke execute on function public.fn02_request_ownership_transfer(uuid, uuid) from public, anon;
revoke execute on function public.fn03_cancel_ownership_transfer(uuid) from public, anon;
revoke execute on function public.fn04_decline_ownership_transfer(uuid) from public, anon;
revoke execute on function public.fn15_approve_species_submission(uuid) from public, anon;
revoke execute on function public.fn16_reject_species_submission(uuid) from public, anon;
revoke execute on function public.fn19_create_animal(uuid, text, text, date) from public, anon;

-- ============================================================================
-- Pin search_path on the remaining (security invoker) functions
-- ============================================================================

alter function public.fn05_get_current_owner(uuid) set search_path = public;
alter function public.fn06_is_current_owner(uuid, uuid) set search_path = public;
alter function public.fn07_get_ownership_history(uuid) set search_path = public;
alter function public.fn08_log_feeding(uuid, text, text, integer, boolean, text) set search_path = public;
alter function public.fn09_log_shed(uuid, boolean, boolean, boolean, text) set search_path = public;
alter function public.fn14_submit_species(text, text, text, text, text) set search_path = public;
alter function public.fn17_search_species(text) set search_path = public;
alter function public.fn18_get_species(uuid) set search_path = public;
alter function public.fn20_log_weight(uuid, numeric, text) set search_path = public;
alter function public.fn21_get_weight_history(uuid) set search_path = public;
alter function public.fn22_get_latest_weight(uuid) set search_path = public;
alter function public.fn23_get_animal_dashboard(uuid) set search_path = public;
alter function public.fn24_get_my_animals(uuid) set search_path = public;
alter function public.fn25_log_length(uuid, numeric, text) set search_path = public;
alter function public.fn26_get_length_history(uuid) set search_path = public;
alter function public.fn27_get_latest_length(uuid) set search_path = public;
alter function public.fn28_get_species_names(uuid) set search_path = public;

commit;
