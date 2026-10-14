-- Use the username chosen at sign-up (passed as user metadata) when it is valid
-- and free; otherwise fall back to a generated one so sign-up never fails.

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path = public
as $function$
declare
  v_wanted text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  v_username text;
begin
  if v_wanted ~ '^[a-z0-9_]{3,30}$' and not exists (select 1 from public.profiles where username = v_wanted) then
    v_username := v_wanted;
  else
    v_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), v_username));

  return new;
end;
$function$;

-- Lets the sign-up form check availability before submitting.
create or replace function public.fn39_username_available(p_username text)
 returns boolean
 language sql
 stable
 security definer
 set search_path = public
as $$
    select lower(trim(p_username)) ~ '^[a-z0-9_]{3,30}$'
       and not exists (select 1 from profiles where username = lower(trim(p_username)));
$$;
