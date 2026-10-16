-- Profiles were readable in full by anyone, signed in or not: email_token (the
-- secret in unsubscribe links), country, plan, role, email settings. Only the
-- public profile (username, display name, join date) stays readable; keepers
-- read their own settings through fn72_my_profile.

revoke select on public.profiles from anon, authenticated;
grant select (id, username, display_name, created_at) on public.profiles to anon, authenticated;

-- Profiles are created by the sign-up trigger, never by API callers.
revoke insert on public.profiles from anon, authenticated;

create or replace function public.fn72_my_profile()
 returns table(username text, display_name text, role text, plan text, country text, unit_system text,
               animal_limit integer, share_gear boolean, email_digest boolean, onboarding_skipped text[])
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select p.username, p.display_name, p.role, p.plan, p.country, p.unit_system,
           p.animal_limit, p.share_gear, p.email_digest, p.onboarding_skipped
    from public.profiles p
    where p.id = (select auth.uid());
$$;

revoke execute on function public.fn72_my_profile() from public, anon;
grant execute on function public.fn72_my_profile() to authenticated;

-- Photos allowed per animal: set by the owner's plan, for anyone who can see the animal.
create or replace function public.fn73_animal_photo_limit(p_animal_id uuid)
 returns integer
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select private.photo_limit(o.user_id)
    from public.animal_ownership o
    where o.animal_id = p_animal_id and o.is_current_owner
      and private.can_view_animal(p_animal_id);
$$;

revoke execute on function public.fn73_animal_photo_limit(uuid) from public, anon;
grant execute on function public.fn73_animal_photo_limit(uuid) to authenticated;
