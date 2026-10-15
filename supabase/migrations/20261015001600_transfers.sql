-- Ownership transfers in the app: a keeper sends an animal to another keeper by
-- username, the recipient gets an email and accepts or declines on /transfers.
-- The animal's logs go with it; tags, enclosure and acquisition stay with each
-- keeper (the recipient gets a new acquisition record dated the day they accept).

alter table public.ownership_transfers
  add column note text check (char_length(note) <= 500),
  add column notified_at timestamptz;

-- Existing transfers (none in production) are not emailed.
update public.ownership_transfers set notified_at = now() where notified_at is null;

create index ownership_transfers_to_pending on public.ownership_transfers (to_user_id) where status = 'pending';

-- Request by username, with an optional note for the recipient.
create or replace function public.fn63_request_transfer(p_animal_id uuid, p_username text, p_note text default null)
 returns uuid
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_to uuid;
    v_id uuid;
begin
    if not private.owns_animal(p_animal_id) then
        raise exception 'Only the current owner can transfer this animal';
    end if;

    select id into v_to from public.profiles where username = lower(trim(leading '@' from trim(p_username)));
    if v_to is null then
        raise exception 'No keeper with the username "%"', trim(p_username);
    end if;
    if v_to = auth.uid() then
        raise exception 'You already own this animal';
    end if;

    if exists (select 1 from public.ownership_transfers where animal_id = p_animal_id and status = 'pending') then
        raise exception 'This animal already has a pending transfer';
    end if;

    insert into public.ownership_transfers (animal_id, from_user_id, to_user_id, note)
    values (p_animal_id, auth.uid(), v_to, nullif(trim(p_note), ''))
    returning id into v_id;
    return v_id;
end;
$$;

-- Accepting also records the acquisition for the new keeper.
create or replace function public.fn01_accept_ownership_transfer(transfer_uuid uuid)
 returns void
 language plpgsql
 security definer
 set search_path = public
as $function$
declare
    v_transfer ownership_transfers;
    v_from text;
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

    select username into v_from from profiles where id = v_transfer.from_user_id;
    insert into animal_acquisitions (animal_id, user_id, acquired_date, source_type, source_name, notes)
    values (v_transfer.animal_id, v_transfer.to_user_id, current_date, 'other', '@' || v_from, 'Transferred on Reptilytics')
    on conflict (animal_id, user_id) do update
      set acquired_date = excluded.acquired_date, source_type = excluded.source_type,
          source_name = excluded.source_name, notes = excluded.notes, price = null, currency = null;

    update ownership_transfers
    set status = 'accepted', completed_at = now()
    where id = transfer_uuid;
end;
$function$;

-- Your transfers, both directions: pending ones plus the last 90 days of the rest.
-- The recipient can't read the animal yet, so this carries what they need to decide.
create or replace function public.fn64_my_transfers()
 returns table(
   id uuid, direction text, status text, note text, created_at timestamptz, completed_at timestamptz,
   animal_id uuid, animal_name text, sex text, hatch_date date, species_common_name text, species_scientific_name text,
   other_username text, other_display_name text)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select t.id,
           case when t.to_user_id = (select auth.uid()) then 'incoming' else 'outgoing' end,
           t.status, t.note, t.created_at, t.completed_at,
           a.id, a.name, a.sex, a.hatch_date, s.common_name, s.scientific_name,
           p.username, p.display_name
    from public.ownership_transfers t
    join public.animals a on a.id = t.animal_id
    left join public.species s on s.id = a.species_id
    join public.profiles p on p.id = case when t.to_user_id = (select auth.uid()) then t.from_user_id else t.to_user_id end
    where ((select auth.uid()) in (t.from_user_id, t.to_user_id))
      and (t.status = 'pending' or t.completed_at > now() - interval '90 days')
    order by (t.status = 'pending') desc, coalesce(t.completed_at, t.created_at) desc;
$$;

-- Pending transfers whose recipient hasn't been emailed (send-emails, kind "transfers").
create or replace function public.fn65_pending_transfer_emails(p_limit integer default 50)
 returns table(transfer_id uuid, email text, to_name text, from_username text, from_display_name text,
               animal_name text, species text, note text)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select t.id, u.email::text, coalesce(tp.display_name, tp.username),
           fp.username, fp.display_name,
           coalesce(a.name, 'Unnamed'), coalesce(s.common_name, s.scientific_name), t.note
    from public.ownership_transfers t
    join auth.users u on u.id = t.to_user_id
    join public.profiles tp on tp.id = t.to_user_id
    join public.profiles fp on fp.id = t.from_user_id
    join public.animals a on a.id = t.animal_id
    left join public.species s on s.id = a.species_id
    where t.status = 'pending' and t.notified_at is null and u.email_confirmed_at is not null
    order by t.created_at
    limit p_limit;
$$;

create or replace function public.fn66_mark_transfer_notified(p_transfer_id uuid)
 returns void
 language sql
 security definer
 set search_path = ''
as $$
    update public.ownership_transfers set notified_at = now() where id = p_transfer_id;
$$;

revoke execute on function public.fn63_request_transfer(uuid, text, text) from public, anon;
grant execute on function public.fn63_request_transfer(uuid, text, text) to authenticated;
revoke execute on function public.fn64_my_transfers() from public, anon;
grant execute on function public.fn64_my_transfers() to authenticated;
revoke execute on function public.fn65_pending_transfer_emails(integer) from public, anon, authenticated;
revoke execute on function public.fn66_mark_transfer_notified(uuid) from public, anon, authenticated;
grant execute on function public.fn65_pending_transfer_emails(integer) to service_role;
grant execute on function public.fn66_mark_transfer_notified(uuid) to service_role;

select cron.schedule('reptilytics-transfer-emails', '*/5 * * * *',
  $$select private.call_research_function('send-emails', '{"kind":"transfers"}'::jsonb)$$);
