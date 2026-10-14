-- Deleting an animal, and a user deleting their own account.
-- Photos in storage are removed by the app (storage API) before these run.

-- Delete an animal the caller currently owns, detaching records that point at it.
create or replace function public.fn40_delete_animal(p_animal_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path = public
as $$
begin
    if not private.owns_animal(p_animal_id) then
        raise exception 'Only the current owner can delete this animal';
    end if;

    delete from animal_enclosures where animal_id = p_animal_id;
    update breeding_pairings set male_id = null where male_id = p_animal_id;
    update breeding_pairings set female_id = null where female_id = p_animal_id;
    update hatchlings set animal_id = null where animal_id = p_animal_id;
    -- sire_id / dam_id on offspring are ON DELETE SET NULL; logs, photos rows,
    -- genes, ownership, transfers and acquisitions cascade.
    delete from animals where id = p_animal_id;
end;
$$;

revoke execute on function public.fn40_delete_animal(uuid) from public, anon;

-- Delete the caller's account and everything they own.
create or replace function public.fn41_delete_my_account()
 returns void
 language plpgsql
 security definer
 set search_path = public
as $$
declare
    v_user uuid := auth.uid();
    v_animal uuid;
begin
    if v_user is null then
        raise exception 'Authentication required';
    end if;

    -- Animals they currently own.
    for v_animal in
        select animal_id from animal_ownership where user_id = v_user and is_current_owner
    loop
        delete from animal_enclosures where animal_id = v_animal;
        update breeding_pairings set male_id = null where male_id = v_animal;
        update breeding_pairings set female_id = null where female_id = v_animal;
        update hatchlings set animal_id = null where animal_id = v_animal;
        delete from animals where id = v_animal;
    end loop;

    -- Their enclosures (and readings / placements in them).
    delete from environment_logs where enclosure_id in (select id from enclosures where owner_id = v_user);
    delete from animal_enclosures where enclosure_id in (select id from enclosures where owner_id = v_user);
    delete from enclosures where owner_id = v_user;

    -- Keep other keepers' records intact, but drop the link to this person.
    delete from ownership_transfers where from_user_id = v_user or to_user_id = v_user;
    delete from animal_acquisitions where user_id = v_user;
    update animal_ownership set user_id = null where user_id = v_user;
    update animals set created_by = null where created_by = v_user;
    update feedings set fed_by = null where fed_by = v_user;
    update sheds set recorded_by = null where recorded_by = v_user;
    update health_events set recorded_by = null where recorded_by = v_user;
    update length_logs set recorded_by = null where recorded_by = v_user;
    update weight_logs set recorded_by = null where recorded_by = v_user;
    update animal_notes set created_by = null where created_by = v_user;
    update animal_photos set uploaded_by = null where uploaded_by = v_user;
    update species_submissions set submitted_by = null where submitted_by = v_user;
    update species_submissions set reviewed_by = null where reviewed_by = v_user;
    update gene_submissions set submitted_by = null where submitted_by = v_user;
    update gene_submissions set reviewed_by = null where reviewed_by = v_user;

    -- Removing the auth user cascades to the profile and feature requests.
    delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.fn41_delete_my_account() from public, anon;
