-- Account deletion keeps husbandry data for research, anonymized:
-- animals, logs, genetics, lineage, enclosures and readings stay but are no
-- longer linked to the person. Personal content (login, profile, photos, free-text
-- notes, purchase details) is deleted. Photo files are removed by the app first.

create or replace function public.fn41_delete_my_account()
 returns void
 language plpgsql
 security definer
 set search_path = public
as $$
declare
    v_user uuid := auth.uid();
    v_animals uuid[];
begin
    if v_user is null then
        raise exception 'Authentication required';
    end if;

    select coalesce(array_agg(animal_id), '{}') into v_animals
    from animal_ownership where user_id = v_user and is_current_owner;

    -- Personal content.
    delete from animal_photos where animal_id = any(v_animals);
    delete from animal_notes where animal_id = any(v_animals) or created_by = v_user;
    delete from animal_acquisitions where user_id = v_user;
    delete from ownership_transfers where from_user_id = v_user or to_user_id = v_user;

    -- Kept animals become private and ownerless; their logs stay attached.
    update animals set visibility = 'private', name = null where id = any(v_animals);
    update animals set created_by = null where created_by = v_user;
    update animal_ownership set user_id = null where user_id = v_user;

    -- Enclosures and readings stay, unowned.
    update enclosures set owner_id = null, notes = null where owner_id = v_user;
    update environment_logs set notes = null where enclosure_id in (select id from enclosures where owner_id is null);

    -- Unlink the person from everything else they touched.
    update feedings set fed_by = null where fed_by = v_user;
    update sheds set recorded_by = null where recorded_by = v_user;
    update health_events set recorded_by = null where recorded_by = v_user;
    update length_logs set recorded_by = null where recorded_by = v_user;
    update weight_logs set recorded_by = null where recorded_by = v_user;
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
