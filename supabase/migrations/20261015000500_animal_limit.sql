-- Safety cap on how many animals one account can own (stops spam/bots filling
-- the database). Generous by default; raise per account via profiles.animal_limit.
alter table public.profiles add column animal_limit integer not null default 500 check (animal_limit > 0);

create or replace function private.enforce_animal_limit()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_limit integer;
    v_count integer;
begin
    if not new.is_current_owner or new.user_id is null then
        return new;
    end if;
    select animal_limit into v_limit from public.profiles where id = new.user_id;
    select count(*) into v_count from public.animal_ownership
     where user_id = new.user_id and is_current_owner and animal_id <> new.animal_id;
    if v_count >= coalesce(v_limit, 500) then
        raise exception 'You have reached the limit of % animals. Email info@reptilytics.com and we''ll raise it.', coalesce(v_limit, 500);
    end if;
    return new;
end;
$$;

create trigger animal_ownership_limit
  before insert or update of user_id, is_current_owner on public.animal_ownership
  for each row execute function private.enforce_animal_limit();

revoke all on function private.enforce_animal_limit() from public, anon, authenticated;
