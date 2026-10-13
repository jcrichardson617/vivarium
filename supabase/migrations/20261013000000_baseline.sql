-- Baseline: snapshot of the live Reptilytics / HerpAtlas schema as of 2026-10-13.
-- Captured from the production project (megvsfrjvmjpujarjksx), which was built in the
-- Supabase dashboard before migrations were tracked. Already applied there; do not re-run.
-- Known issues are left as-is here and fixed in later migrations.

set check_function_bodies = false;

-- ============================================================================
-- Tables
-- ============================================================================

create table public.animal_enclosures (
  id uuid default gen_random_uuid() not null,
  animal_id uuid,
  enclosure_id uuid,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone,
  notes text
);

create table public.animal_notes (
  id uuid default gen_random_uuid() not null,
  animal_id uuid not null,
  created_by uuid,
  note_type text default 'general'::text not null,
  note_text text not null,
  created_at timestamp with time zone default now() not null
);

create table public.animal_ownership (
  id uuid default gen_random_uuid() not null,
  animal_id uuid,
  user_id uuid,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone,
  is_current_owner boolean default true
);

create table public.animals (
  id uuid default gen_random_uuid() not null,
  species_id uuid,
  created_by uuid,
  name text,
  sex text,
  hatch_date date,
  visibility text default 'private'::text,
  created_at timestamp with time zone default now()
);

create table public.breeding_pairings (
  id uuid default gen_random_uuid() not null,
  male_id uuid,
  female_id uuid,
  pairing_date timestamp with time zone default now() not null,
  notes text
);

create table public.clutches (
  id uuid default gen_random_uuid() not null,
  pairing_id uuid,
  laid_date timestamp with time zone,
  egg_count integer,
  fertile_count integer,
  notes text
);

create table public.eggs (
  id uuid default gen_random_uuid() not null,
  clutch_id uuid,
  egg_number integer,
  laid_date timestamp with time zone,
  incubation_start timestamp with time zone,
  status text,
  notes text
);

create table public.enclosures (
  id uuid default gen_random_uuid() not null,
  owner_id uuid,
  name text not null,
  enclosure_type text,
  length_inches numeric,
  width_inches numeric,
  height_inches numeric,
  substrate text,
  heat_source text,
  uvb_type text,
  target_hot_temp numeric,
  target_cool_temp numeric,
  target_humidity numeric,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.environment_logs (
  id uuid default gen_random_uuid() not null,
  enclosure_id uuid,
  temperature_hot numeric,
  temperature_cool numeric,
  humidity numeric,
  uv_index numeric,
  recorded_at timestamp with time zone default now(),
  notes text
);

create table public.feedings (
  id uuid default gen_random_uuid() not null,
  animal_id uuid not null,
  fed_by uuid,
  fed_at timestamp with time zone default now() not null,
  feeder_type text not null,
  feeder_size text,
  quantity integer default 1,
  accepted boolean default true not null,
  notes text
);

create table public.hatchlings (
  id uuid default gen_random_uuid() not null,
  egg_id uuid,
  animal_id uuid,
  hatch_date timestamp with time zone,
  hatch_weight numeric,
  notes text
);

create table public.health_events (
  id uuid default gen_random_uuid() not null,
  animal_id uuid not null,
  recorded_by uuid,
  event_date timestamp with time zone default now() not null,
  event_type text not null,
  severity text,
  notes text
);

create table public.incubation_logs (
  id uuid default gen_random_uuid() not null,
  egg_id uuid,
  recorded_at timestamp with time zone default now(),
  temperature numeric,
  humidity numeric,
  incubation_day integer,
  notes text
);

create table public.length_logs (
  id uuid default gen_random_uuid() not null,
  animal_id uuid not null,
  recorded_by uuid,
  length_cm numeric not null,
  recorded_at timestamp with time zone default now() not null,
  notes text
);

create table public.ownership_transfers (
  id uuid default gen_random_uuid() not null,
  animal_id uuid not null,
  from_user_id uuid not null,
  to_user_id uuid not null,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create table public.profiles (
  id uuid not null,
  username text not null,
  display_name text,
  created_at timestamp with time zone default now()
);

create table public.research_documents (
  id uuid default gen_random_uuid() not null,
  title text not null,
  source_url text,
  source_type text,
  species_id uuid,
  summary text,
  content text,
  published_date date,
  created_at timestamp with time zone default now()
);

create table public.sheds (
  id uuid default gen_random_uuid() not null,
  animal_id uuid not null,
  recorded_by uuid,
  shed_date timestamp with time zone default now() not null,
  complete_shed boolean default true not null,
  retained_eye_caps boolean default false not null,
  retained_tail_tip boolean default false not null,
  notes text
);

create table public.species (
  id uuid default gen_random_uuid() not null,
  scientific_name text not null,
  common_name text,
  genus text,
  family text,
  created_at timestamp with time zone default now(),
  active boolean default true,
  notes text,
  accepted_name boolean default true
);

create table public.species_submissions (
  id uuid default gen_random_uuid() not null,
  submitted_by uuid,
  scientific_name text not null,
  common_name text,
  genus text,
  family text,
  notes text,
  status text default 'pending'::text not null,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table public.species_synonyms (
  id uuid default gen_random_uuid() not null,
  species_id uuid not null,
  synonym_name text not null,
  source text,
  created_at timestamp with time zone default now() not null
);

create table public.weight_logs (
  id uuid default gen_random_uuid() not null,
  animal_id uuid,
  recorded_by uuid,
  weight_grams numeric(10,2),
  recorded_at timestamp with time zone default now(),
  notes text
);

-- ============================================================================
-- Constraints
-- ============================================================================

alter table public.animal_enclosures add constraint animal_enclosures_pkey primary key (id);
alter table public.animal_notes add constraint animal_notes_pkey primary key (id);
alter table public.animal_ownership add constraint animal_ownership_pkey primary key (id);
alter table public.animals add constraint animals_pkey primary key (id);
alter table public.breeding_pairings add constraint breeding_pairings_pkey primary key (id);
alter table public.clutches add constraint clutches_pkey primary key (id);
alter table public.eggs add constraint eggs_pkey primary key (id);
alter table public.enclosures add constraint enclosures_pkey primary key (id);
alter table public.environment_logs add constraint environment_logs_pkey primary key (id);
alter table public.feedings add constraint feedings_pkey primary key (id);
alter table public.hatchlings add constraint hatchlings_pkey primary key (id);
alter table public.health_events add constraint health_events_pkey primary key (id);
alter table public.incubation_logs add constraint incubation_logs_pkey primary key (id);
alter table public.length_logs add constraint length_logs_pkey primary key (id);
alter table public.ownership_transfers add constraint ownership_transfers_pkey primary key (id);
alter table public.profiles add constraint profiles_pkey primary key (id);
alter table public.research_documents add constraint research_documents_pkey primary key (id);
alter table public.sheds add constraint sheds_pkey primary key (id);
alter table public.species add constraint species_pkey primary key (id);
alter table public.species_submissions add constraint species_submissions_pkey primary key (id);
alter table public.species_synonyms add constraint species_synonyms_pkey primary key (id);
alter table public.weight_logs add constraint weight_logs_pkey primary key (id);

alter table public.profiles add constraint profiles_username_key unique (username);
alter table public.species add constraint species_scientific_name_key unique (scientific_name);

alter table public.animals add constraint animals_sex_check check ((sex = any (array['male'::text, 'female'::text, 'unknown'::text])));
alter table public.animals add constraint animals_visibility_check check ((visibility = any (array['private'::text, 'public'::text])));
alter table public.ownership_transfers add constraint ownership_transfers_status_check check ((status = any (array['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text])));
alter table public.species_submissions add constraint species_submissions_status_check check ((status = any (array['pending'::text, 'approved'::text, 'rejected'::text])));

alter table public.animal_enclosures add constraint animal_enclosures_animal_id_fkey foreign key (animal_id) references public.animals(id);
alter table public.animal_enclosures add constraint animal_enclosures_enclosure_id_fkey foreign key (enclosure_id) references public.enclosures(id);
alter table public.animal_notes add constraint animal_notes_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.animal_notes add constraint animal_notes_created_by_fkey foreign key (created_by) references public.profiles(id);
alter table public.animal_ownership add constraint animal_ownership_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.animal_ownership add constraint animal_ownership_user_id_fkey foreign key (user_id) references public.profiles(id);
alter table public.animals add constraint animals_created_by_fkey foreign key (created_by) references public.profiles(id);
alter table public.animals add constraint animals_species_id_fkey foreign key (species_id) references public.species(id);
alter table public.breeding_pairings add constraint breeding_pairings_female_id_fkey foreign key (female_id) references public.animals(id);
alter table public.breeding_pairings add constraint breeding_pairings_male_id_fkey foreign key (male_id) references public.animals(id);
alter table public.clutches add constraint clutches_pairing_id_fkey foreign key (pairing_id) references public.breeding_pairings(id);
alter table public.eggs add constraint eggs_clutch_id_fkey foreign key (clutch_id) references public.clutches(id);
alter table public.enclosures add constraint enclosures_owner_id_fkey foreign key (owner_id) references public.profiles(id);
alter table public.environment_logs add constraint environment_logs_enclosure_id_fkey foreign key (enclosure_id) references public.enclosures(id);
alter table public.feedings add constraint feedings_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.feedings add constraint feedings_fed_by_fkey foreign key (fed_by) references public.profiles(id);
alter table public.hatchlings add constraint hatchlings_animal_id_fkey foreign key (animal_id) references public.animals(id);
alter table public.hatchlings add constraint hatchlings_egg_id_fkey foreign key (egg_id) references public.eggs(id);
alter table public.health_events add constraint health_events_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.health_events add constraint health_events_recorded_by_fkey foreign key (recorded_by) references public.profiles(id);
alter table public.incubation_logs add constraint incubation_logs_egg_id_fkey foreign key (egg_id) references public.eggs(id);
alter table public.length_logs add constraint length_logs_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.length_logs add constraint length_logs_recorded_by_fkey foreign key (recorded_by) references public.profiles(id);
alter table public.ownership_transfers add constraint ownership_transfers_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.ownership_transfers add constraint ownership_transfers_from_user_id_fkey foreign key (from_user_id) references public.profiles(id);
alter table public.ownership_transfers add constraint ownership_transfers_to_user_id_fkey foreign key (to_user_id) references public.profiles(id);
alter table public.research_documents add constraint research_documents_species_id_fkey foreign key (species_id) references public.species(id);
alter table public.sheds add constraint sheds_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.sheds add constraint sheds_recorded_by_fkey foreign key (recorded_by) references public.profiles(id);
alter table public.species_submissions add constraint species_submissions_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id);
alter table public.species_submissions add constraint species_submissions_submitted_by_fkey foreign key (submitted_by) references public.profiles(id);
alter table public.species_synonyms add constraint species_synonyms_species_id_fkey foreign key (species_id) references public.species(id) on delete cascade;
alter table public.weight_logs add constraint weight_logs_animal_id_fkey foreign key (animal_id) references public.animals(id) on delete cascade;
alter table public.weight_logs add constraint weight_logs_recorded_by_fkey foreign key (recorded_by) references public.profiles(id);

-- ============================================================================
-- Indexes
-- ============================================================================

create unique index idx_species_scientific_name on public.species using btree (lower(scientific_name));
create unique index idx_species_synonyms_name on public.species_synonyms using btree (lower(synonym_name));
create unique index animal_ownership_one_current_owner on public.animal_ownership using btree (animal_id) where (is_current_owner = true);
create unique index ownership_transfers_one_pending on public.ownership_transfers using btree (animal_id) where (status = 'pending'::text);
create index idx_feedings_animal on public.feedings using btree (animal_id, fed_at desc);
create index idx_sheds_animal on public.sheds using btree (animal_id, shed_date desc);
create index idx_animal_notes_animal on public.animal_notes using btree (animal_id, created_at desc);
create index idx_length_logs_animal on public.length_logs using btree (animal_id, recorded_at desc);
create index idx_species_submissions_status on public.species_submissions using btree (status);
create index idx_species_submissions_created on public.species_submissions using btree (created_at desc);

-- ============================================================================
-- Functions
-- ============================================================================

create or replace function public.accept_transfer(transfer_uuid uuid)
 returns void
 language plpgsql
as $function$
declare
    v_transfer ownership_transfers;
begin
    select * into v_transfer from ownership_transfers where id = transfer_uuid;

    update animal_ownership
    set end_date = now(), is_current_owner = false
    where animal_id = v_transfer.animal_id and is_current_owner = true;

    insert into animal_ownership (animal_id, user_id, start_date, is_current_owner)
    values (v_transfer.animal_id, v_transfer.to_user_id, now(), true);

    update ownership_transfers
    set status = 'accepted', completed_at = now()
    where id = transfer_uuid;
end;
$function$;

create or replace function public.fn01_accept_ownership_transfer(transfer_uuid uuid)
 returns void
 language plpgsql
as $function$
declare
    v_transfer ownership_transfers;
begin
    select * into v_transfer from ownership_transfers where id = transfer_uuid;

    update animal_ownership
    set end_date = now(), is_current_owner = false
    where animal_id = v_transfer.animal_id and is_current_owner = true;

    insert into animal_ownership (animal_id, user_id, start_date, is_current_owner)
    values (v_transfer.animal_id, v_transfer.to_user_id, now(), true);

    update ownership_transfers
    set status = 'accepted', completed_at = now()
    where id = transfer_uuid;
end;
$function$;

create or replace function public.fn02_request_ownership_transfer(p_animal_id uuid, p_to_user_id uuid)
 returns uuid
 language plpgsql
as $function$
declare
    v_transfer_id uuid;
begin
    if exists (
        select 1 from ownership_transfers
        where animal_id = p_animal_id and status = 'pending'
    ) then
        raise exception 'Animal already has a pending transfer';
    end if;

    insert into ownership_transfers (animal_id, from_user_id, to_user_id)
    select p_animal_id, user_id, p_to_user_id
    from animal_ownership
    where animal_id = p_animal_id and is_current_owner = true
    returning id into v_transfer_id;

    return v_transfer_id;
end;
$function$;

create or replace function public.fn03_cancel_ownership_transfer(p_transfer_id uuid)
 returns void
 language plpgsql
as $function$
begin
    update ownership_transfers set status = 'cancelled'
    where id = p_transfer_id and status = 'pending';
end;
$function$;

create or replace function public.fn04_decline_ownership_transfer(p_transfer_id uuid)
 returns void
 language plpgsql
as $function$
begin
    update ownership_transfers set status = 'declined'
    where id = p_transfer_id and status = 'pending';
end;
$function$;

create or replace function public.fn05_get_current_owner(p_animal_id uuid)
 returns uuid
 language sql
as $function$
    select user_id from animal_ownership
    where animal_id = p_animal_id and is_current_owner = true
    limit 1;
$function$;

create or replace function public.fn06_is_current_owner(p_animal_id uuid, p_user_id uuid)
 returns boolean
 language sql
as $function$
    select exists (
        select 1 from animal_ownership
        where animal_id = p_animal_id and user_id = p_user_id and is_current_owner = true
    );
$function$;

create or replace function public.fn07_get_ownership_history(p_animal_id uuid)
 returns table(user_id uuid, start_date timestamp with time zone, end_date timestamp with time zone, is_current_owner boolean)
 language sql
as $function$
    select ao.user_id, ao.start_date, ao.end_date, ao.is_current_owner
    from animal_ownership ao
    where ao.animal_id = p_animal_id
    order by ao.start_date;
$function$;

create or replace function public.fn08_log_feeding(p_animal_id uuid, p_feeder_type text, p_feeder_size text, p_quantity integer, p_accepted boolean, p_notes text)
 returns uuid
 language plpgsql
as $function$
declare
    v_id uuid;
begin
    insert into feedings (animal_id, feeder_type, feeder_size, quantity, accepted, notes)
    values (p_animal_id, p_feeder_type, p_feeder_size, p_quantity, p_accepted, p_notes)
    returning id into v_id;
    return v_id;
end;
$function$;

create or replace function public.fn09_log_shed(p_animal_id uuid, p_complete_shed boolean, p_retained_eye_caps boolean, p_retained_tail_tip boolean, p_notes text)
 returns uuid
 language plpgsql
as $function$
declare
    v_id uuid;
begin
    insert into sheds (animal_id, complete_shed, retained_eye_caps, retained_tail_tip, notes)
    values (p_animal_id, p_complete_shed, p_retained_eye_caps, p_retained_tail_tip, p_notes)
    returning id into v_id;
    return v_id;
end;
$function$;

create or replace function public.fn14_submit_species(p_scientific_name text, p_common_name text, p_genus text, p_family text, p_notes text)
 returns uuid
 language plpgsql
as $function$
declare
    v_id uuid;
begin
    -- Already exists in species table?
    if exists (
        select 1 from species
        where lower(scientific_name) = lower(trim(p_scientific_name))
    ) then
        raise exception 'Species already exists';
    end if;

    insert into species_submissions (scientific_name, common_name, genus, family, notes)
    values (trim(p_scientific_name), trim(p_common_name), trim(p_genus), trim(p_family), p_notes)
    returning id into v_id;

    return v_id;
end;
$function$;

create or replace function public.fn15_approve_species_submission(p_submission_id uuid)
 returns uuid
 language plpgsql
as $function$
declare
    v_submission species_submissions;
    v_species_id uuid;
begin
    select * into v_submission from species_submissions where id = p_submission_id;

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
    set status = 'approved', reviewed_at = now()
    where id = p_submission_id;

    return v_species_id;
end;
$function$;

create or replace function public.fn16_reject_species_submission(p_submission_id uuid)
 returns void
 language plpgsql
as $function$
begin
    update species_submissions
    set status = 'rejected', reviewed_at = now()
    where id = p_submission_id and status = 'pending';
end;
$function$;

create or replace function public.fn17_search_species(p_search text)
 returns table(id uuid, display_name text)
 language sql
as $function$
    select s.id, s.common_name || ' (' || s.scientific_name || ')' as display_name
    from species s
    where lower(s.common_name) like lower('%' || p_search || '%')
       or lower(s.scientific_name) like lower('%' || p_search || '%')
    order by
        case
            when lower(s.common_name) like lower(p_search || '%') then 0
            when lower(s.scientific_name) like lower(p_search || '%') then 1
            else 2
        end,
        s.common_name
    limit 25;
$function$;

create or replace function public.fn18_get_species(p_species_id uuid)
 returns table(id uuid, scientific_name text, common_name text, genus text, family text)
 language sql
as $function$
    select s.id, s.scientific_name, s.common_name, s.genus, s.family
    from species s
    where s.id = p_species_id;
$function$;

create or replace function public.fn19_create_animal(p_species_id uuid, p_name text, p_sex text, p_hatch_date date default null::date)
 returns uuid
 language plpgsql
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

create or replace function public.fn20_log_weight(p_animal_id uuid, p_weight_grams numeric, p_notes text default null::text)
 returns uuid
 language plpgsql
as $function$
declare
    v_log_id uuid;
begin
    insert into weight_logs (animal_id, recorded_by, weight_grams, notes)
    values (p_animal_id, auth.uid(), p_weight_grams, p_notes)
    returning id into v_log_id;
    return v_log_id;
end;
$function$;

create or replace function public.fn21_get_weight_history(p_animal_id uuid)
 returns table(weight_grams numeric, recorded_at timestamp with time zone, notes text)
 language sql
as $function$
    select wl.weight_grams, wl.recorded_at, wl.notes
    from weight_logs wl
    where wl.animal_id = p_animal_id
    order by wl.recorded_at desc;
$function$;

create or replace function public.fn22_get_latest_weight(p_animal_id uuid)
 returns table(weight_grams numeric, recorded_at timestamp with time zone)
 language sql
as $function$
    select wl.weight_grams, wl.recorded_at
    from weight_logs wl
    where wl.animal_id = p_animal_id
    order by wl.recorded_at desc
    limit 1;
$function$;

create or replace function public.fn23_get_animal_dashboard(p_animal_id uuid)
 returns table(animal_name text, species_name text, latest_weight numeric, latest_feeding text)
 language sql
as $function$
    select
        a.name,
        s.common_name,
        (select wl.weight_grams from weight_logs wl
          where wl.animal_id = a.id order by wl.recorded_at desc limit 1) as latest_weight,
        (select f.feeder_type from feedings f
          where f.animal_id = a.id order by f.fed_at desc limit 1) as latest_feeding
    from animals a
    join species s on s.id = a.species_id
    where a.id = p_animal_id;
$function$;

create or replace function public.fn24_get_my_animals(p_user_id uuid)
 returns table(animal_id uuid, animal_name text, species_name text, latest_weight numeric)
 language sql
as $function$
    select
        a.id,
        a.name,
        s.common_name,
        (select wl.weight_grams from weight_logs wl
          where wl.animal_id = a.id order by wl.recorded_at desc limit 1) as latest_weight
    from animals a
    join animal_ownership ao on ao.animal_id = a.id and ao.is_current_owner = true
    join species s on s.id = a.species_id
    where ao.user_id = p_user_id
    order by a.name;
$function$;

create or replace function public.fn25_log_length(p_animal_id uuid, p_length_cm numeric, p_notes text default null::text)
 returns uuid
 language plpgsql
as $function$
declare
    v_log_id uuid;
begin
    insert into length_logs (animal_id, recorded_by, length_cm, notes)
    values (p_animal_id, auth.uid(), p_length_cm, p_notes)
    returning id into v_log_id;
    return v_log_id;
end;
$function$;

create or replace function public.fn26_get_length_history(p_animal_id uuid)
 returns table(length_cm numeric, recorded_at timestamp with time zone, notes text)
 language sql
as $function$
    select ll.length_cm, ll.recorded_at, ll.notes
    from length_logs ll
    where ll.animal_id = p_animal_id
    order by ll.recorded_at desc;
$function$;

create or replace function public.fn27_get_latest_length(p_animal_id uuid)
 returns table(length_cm numeric, recorded_at timestamp with time zone)
 language sql
as $function$
    select ll.length_cm, ll.recorded_at
    from length_logs ll
    where ll.animal_id = p_animal_id
    order by ll.recorded_at desc
    limit 1;
$function$;

create or replace function public.fn28_get_species_names(p_species_id uuid)
 returns table(species_name text)
 language sql
as $function$
    select scientific_name from species where id = p_species_id
    union
    select synonym_name from species_synonyms where species_id = p_species_id;
$function$;

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
as $function$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'user_' || substr(new.id::text, 1, 8), 'New User');
  return new;
end;
$function$;

create or replace function public.rls_auto_enable()
 returns event_trigger
 language plpgsql
 security definer
 set search_path to 'pg_catalog'
as $function$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
     if cmd.schema_name is not null and cmd.schema_name in ('public') and cmd.schema_name not in ('pg_catalog', 'information_schema') and cmd.schema_name not like 'pg_toast%' and cmd.schema_name not like 'pg_temp%' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
     else
        raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     end if;
  end loop;
end;
$function$;

-- ============================================================================
-- Triggers
-- ============================================================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create event trigger ensure_rls on ddl_command_end
  execute function public.rls_auto_enable();

-- ============================================================================
-- Views
-- ============================================================================

create view public.animal_detail_view with (security_invoker=true) as
 select a.id,
    a.name,
    a.sex,
    a.hatch_date,
    a.visibility,
    a.created_at,
    s.common_name,
    s.scientific_name,
    ao.user_id as current_owner_id,
    p.username as current_owner_username,
    (select wl.weight_grams from weight_logs wl
      where wl.animal_id = a.id order by wl.recorded_at desc limit 1) as latest_weight_grams,
    (select count(*) as count from weight_logs wl where wl.animal_id = a.id) as weight_log_count,
    (select count(*) as count from animal_ownership o where o.animal_id = a.id) as ownership_count
   from animals a
     left join species s on s.id = a.species_id
     left join animal_ownership ao on ao.animal_id = a.id and ao.is_current_owner = true
     left join profiles p on p.id = ao.user_id;

create view public.animal_timeline_view with (security_invoker=true) as
 select animal_ownership.animal_id,
    animal_ownership.start_date as event_date,
    'ownership_started'::text as event_type,
    animal_ownership.user_id::text as event_value
   from animal_ownership
union all
 select animal_ownership.animal_id,
    animal_ownership.end_date as event_date,
    'ownership_ended'::text as event_type,
    animal_ownership.user_id::text as event_value
   from animal_ownership
  where animal_ownership.end_date is not null
union all
 select weight_logs.animal_id,
    weight_logs.recorded_at as event_date,
    'weight_recorded'::text as event_type,
    weight_logs.weight_grams::text as event_value
   from weight_logs
union all
 select feedings.animal_id,
    feedings.fed_at as event_date,
    'feeding'::text as event_type,
    feedings.feeder_type as event_value
   from feedings
union all
 select sheds.animal_id,
    sheds.shed_date as event_date,
    'shed'::text as event_type,
        case
            when sheds.complete_shed then 'complete'::text
            else 'incomplete'::text
        end as event_value
   from sheds;

create view public.collection_view with (security_invoker=true) as
 select a.id,
    a.name,
    s.common_name,
    s.scientific_name,
    p.username as owner_username,
    (select wl.weight_grams from weight_logs wl
      where wl.animal_id = a.id order by wl.recorded_at desc limit 1) as current_weight
   from animals a
     left join species s on s.id = a.species_id
     left join animal_ownership ao on ao.animal_id = a.id and ao.is_current_owner = true
     left join profiles p on p.id = ao.user_id;

create view public.enclosure_detail_view as
 select e.id,
    e.owner_id,
    e.name,
    e.enclosure_type,
    e.length_inches,
    e.width_inches,
    e.height_inches,
    e.substrate,
    e.heat_source,
    e.uvb_type,
    e.target_hot_temp,
    e.target_cool_temp,
    e.target_humidity,
    count(distinct ae.animal_id) as animal_count,
    max(el.recorded_at) as last_environment_log,
    e.created_at,
    e.updated_at
   from enclosures e
     left join animal_enclosures ae on ae.enclosure_id = e.id and ae.end_date is null
     left join environment_logs el on el.enclosure_id = e.id
  group by e.id, e.owner_id, e.name, e.enclosure_type, e.length_inches, e.width_inches, e.height_inches, e.substrate, e.heat_source, e.uvb_type, e.target_hot_temp, e.target_cool_temp, e.target_humidity, e.created_at, e.updated_at;

create view public.enclosure_timeline_view as
 select e.id as enclosure_id,
    'environment'::text as event_type,
    el.recorded_at as event_date,
    concat('Temp: ', coalesce(el.temperature_hot::text, '?'::text), '/', coalesce(el.temperature_cool::text, '?'::text), ' | Humidity: ', coalesce(el.humidity::text, '?'::text), '%') as title,
    el.notes as details
   from environment_logs el
     join enclosures e on e.id = el.enclosure_id
union all
 select e.id as enclosure_id,
    'animal_move'::text as event_type,
    ae.start_date as event_date,
    concat('Animal Added: ', a.name) as title,
    ae.notes as details
   from animal_enclosures ae
     join enclosures e on e.id = ae.enclosure_id
     join animals a on a.id = ae.animal_id;

create view public.breeding_detail_view as
 select c.id as clutch_id,
    c.pairing_id,
    c.laid_date,
    c.egg_count as declared_egg_count,
    c.fertile_count as declared_fertile_count,
    count(distinct e.id) as tracked_egg_count,
    count(distinct e.id) filter (where e.status = 'incubating'::text) as incubating_count,
    count(distinct e.id) filter (where e.status = 'hatched'::text) as hatched_egg_count,
    count(distinct e.id) filter (where e.status = 'infertile'::text) as infertile_count,
    count(distinct e.id) filter (where e.status = 'slug'::text) as slug_count,
    count(distinct e.id) filter (where e.status = 'failed'::text) as failed_count,
    count(distinct h.id) as hatchling_count,
        case
            when count(distinct e.id) = 0 then 0::numeric
            else round(count(distinct h.id)::numeric / count(distinct e.id)::numeric * 100::numeric, 2)
        end as tracked_hatch_rate,
    c.notes
   from clutches c
     left join eggs e on e.clutch_id = c.id
     left join hatchlings h on h.egg_id = e.id
  group by c.id, c.pairing_id, c.laid_date, c.egg_count, c.fertile_count, c.notes;

create view public.breeding_metrics_view as
 select c.id as clutch_id,
    c.laid_date,
    c.egg_count,
    c.fertile_count,
    count(distinct e.id) as tracked_eggs,
    count(distinct h.id) as hatchlings,
    round(count(distinct h.id)::numeric / nullif(count(distinct e.id), 0)::numeric * 100::numeric, 2) as hatch_rate,
    round(avg(il.temperature), 2) as avg_incubation_temp,
    round(avg(il.humidity), 2) as avg_incubation_humidity,
    min(h.hatch_date) as first_hatch_date,
    max(h.hatch_date) as last_hatch_date
   from clutches c
     left join eggs e on e.clutch_id = c.id
     left join hatchlings h on h.egg_id = e.id
     left join incubation_logs il on il.egg_id = e.id
  group by c.id, c.laid_date, c.egg_count, c.fertile_count;

create view public.growth_metrics_view as
 select a.id as animal_id,
    a.name,
    a.species_id,
    min(w.recorded_at) as first_weight_date,
    max(w.recorded_at) as latest_weight_date,
    min(w.weight_grams) as first_weight,
    max(w.weight_grams) as max_recorded_weight,
    (select wl.weight_grams from weight_logs wl
      where wl.animal_id = a.id order by wl.recorded_at desc limit 1) as current_weight,
    count(w.id) as weight_entries,
    round(max(w.weight_grams) - min(w.weight_grams), 2) as total_weight_gain,
    round(
        case
            when count(w.id) < 2 then null::numeric
            else (max(w.weight_grams) - min(w.weight_grams)) / greatest(extract(epoch from max(w.recorded_at) - min(w.recorded_at)) / 86400::numeric, 1::numeric)
        end, 2) as avg_daily_weight_gain
   from animals a
     left join weight_logs w on w.animal_id = a.id
  group by a.id, a.name, a.species_id;

create view public.dashboard_view as
 select (select count(*) as count from animals) as total_animals,
    (select count(*) as count from enclosures) as total_enclosures,
    (select count(*) as count from breeding_pairings) as total_pairings,
    (select count(*) as count from clutches) as total_clutches,
    (select count(*) as count from eggs) as total_eggs,
    (select count(*) as count from hatchlings) as total_hatchlings,
    (select count(*) as count from weight_logs
      where weight_logs.recorded_at >= (now() - '30 days'::interval)) as weight_logs_last_30_days,
    (select count(*) as count from feedings
      where feedings.fed_at >= (now() - '30 days'::interval)) as feedings_last_30_days,
    (select count(*) as count from health_events
      where health_events.event_date >= (now() - '30 days'::interval)) as health_events_last_30_days,
    (select avg(growth_metrics_view.current_weight) as avg from growth_metrics_view
      where growth_metrics_view.current_weight is not null) as average_current_weight,
    (select avg(growth_metrics_view.total_weight_gain) as avg from growth_metrics_view
      where growth_metrics_view.total_weight_gain is not null) as average_weight_gain;

create view public.species_benchmark_view as
 select a.species_id,
    count(distinct a.id) as animal_count,
    round(avg(g.current_weight), 2) as avg_current_weight,
    round(min(g.current_weight), 2) as min_current_weight,
    round(max(g.current_weight), 2) as max_current_weight,
    round(avg(g.avg_daily_weight_gain), 4) as avg_daily_weight_gain,
    round(max(g.avg_daily_weight_gain), 4) as best_daily_growth
   from animals a
     join growth_metrics_view g on g.animal_id = a.id
  group by a.species_id;

create view public.growth_percentile_view as
 select g.animal_id,
    a.name,
    a.species_id,
    g.current_weight,
    g.avg_daily_weight_gain,
    percent_rank() over (partition by a.species_id order by g.current_weight) * 100::double precision as weight_percentile,
    percent_rank() over (partition by a.species_id order by g.avg_daily_weight_gain) * 100::double precision as growth_percentile,
    sb.avg_current_weight,
    sb.avg_daily_weight_gain as species_avg_growth
   from growth_metrics_view g
     join animals a on a.id = g.animal_id
     left join species_benchmark_view sb on sb.species_id = a.species_id;

create view public.species_detail_view as
 select s.id,
    s.common_name,
    s.scientific_name,
    count(distinct a.id) as animal_count,
    round(avg(g.current_weight), 2) as avg_weight_grams,
    round(avg(g.avg_daily_weight_gain), 4) as avg_daily_growth,
    count(distinct bp.id) as pairing_count,
    count(distinct c.id) as clutch_count,
    count(distinct e.id) as egg_count,
    count(distinct h.id) as hatchling_count,
    round(avg(bm.hatch_rate), 2) as avg_hatch_rate,
    min(a.created_at) as first_record_added,
    max(a.created_at) as latest_record_added
   from species s
     left join animals a on a.species_id = s.id
     left join growth_metrics_view g on g.animal_id = a.id
     left join breeding_pairings bp on bp.male_id = a.id or bp.female_id = a.id
     left join clutches c on c.pairing_id = bp.id
     left join eggs e on e.clutch_id = c.id
     left join hatchlings h on h.egg_id = e.id
     left join breeding_metrics_view bm on bm.clutch_id = c.id
  group by s.id, s.common_name, s.scientific_name;

create view public.husbandry_metrics_view as
 select a.id as animal_id,
    a.name,
    a.species_id,
    count(distinct f.id) as feeding_count,
    count(distinct s.id) as shed_count,
    count(distinct h.id) as health_event_count,
    count(distinct w.id) as weight_log_count,
    max(f.fed_at) as last_feeding_date,
    max(s.shed_date) as last_shed_date,
    max(w.recorded_at) as last_weight_date,
    max(h.event_date) as last_health_event_date,
    round(avg(g.current_weight), 2) as current_weight_grams,
    round(avg(g.avg_daily_weight_gain), 4) as avg_daily_growth
   from animals a
     left join feedings f on f.animal_id = a.id
     left join sheds s on s.animal_id = a.id
     left join health_events h on h.animal_id = a.id
     left join weight_logs w on w.animal_id = a.id
     left join growth_metrics_view g on g.animal_id = a.id
  group by a.id, a.name, a.species_id;

create view public.search_documents_view as
 select a.id,
    'animal'::text as document_type,
    a.name as title,
    a.species_id,
    coalesce(string_agg(an.note_text, ' '::text), ''::text) as content,
    a.created_at
   from animals a
     left join animal_notes an on an.animal_id = a.id
  group by a.id, a.name, a.species_id, a.created_at
union all
 select s.id,
    'species'::text as document_type,
    s.common_name as title,
    s.id as species_id,
    coalesce(s.scientific_name, ''::text) as content,
    s.created_at
   from species s
union all
 select n.id,
    'animal_note'::text as document_type,
    a.name as title,
    a.species_id,
    coalesce(n.note_text, ''::text) as content,
    n.created_at
   from animal_notes n
     join animals a on a.id = n.animal_id
union all
 select rd.id,
    'research_document'::text as document_type,
    rd.title,
    rd.species_id,
    concat(coalesce(rd.summary, ''::text), ' ', coalesce(rd.content, ''::text)) as content,
    rd.created_at
   from research_documents rd;

create view public.recommendations_view as
 select a.id as animal_id,
    a.name,
    a.species_id,
    g.current_weight,
    g.avg_daily_weight_gain,
    gp.weight_percentile,
    gp.growth_percentile,
    hm.last_feeding_date,
    hm.last_shed_date,
    hm.last_health_event_date,
    hm.feeding_count,
    hm.health_event_count,
        case
            when hm.last_feeding_date is null then 'NO_FEEDING_RECORD'::text
            when hm.last_feeding_date < (now() - '30 days'::interval) then 'FEEDING_OVERDUE'::text
            else null::text
        end as feeding_alert,
        case
            when hm.last_shed_date is null then 'NO_SHED_RECORD'::text
            when hm.last_shed_date < (now() - '180 days'::interval) then 'SHED_REVIEW'::text
            else null::text
        end as shed_alert,
        case
            when hm.health_event_count > 0 then 'HEALTH_HISTORY_EXISTS'::text
            else null::text
        end as health_alert,
        case
            when gp.growth_percentile < 25::double precision then 'BELOW_AVERAGE_GROWTH'::text
            when gp.growth_percentile > 75::double precision then 'ABOVE_AVERAGE_GROWTH'::text
            else null::text
        end as growth_flag
   from animals a
     left join growth_metrics_view g on g.animal_id = a.id
     left join growth_percentile_view gp on gp.animal_id = a.id
     left join husbandry_metrics_view hm on hm.animal_id = a.id;

-- ============================================================================
-- Row level security
-- ============================================================================

alter table public.animal_enclosures enable row level security;
alter table public.animal_notes enable row level security;
alter table public.animal_ownership enable row level security;
alter table public.animals enable row level security;
alter table public.breeding_pairings enable row level security;
alter table public.clutches enable row level security;
alter table public.eggs enable row level security;
alter table public.enclosures enable row level security;
alter table public.environment_logs enable row level security;
alter table public.feedings enable row level security;
alter table public.hatchlings enable row level security;
alter table public.health_events enable row level security;
alter table public.incubation_logs enable row level security;
alter table public.length_logs enable row level security;
alter table public.ownership_transfers enable row level security;
alter table public.profiles enable row level security;
alter table public.research_documents enable row level security;
alter table public.sheds enable row level security;
alter table public.species enable row level security;
alter table public.species_submissions enable row level security;
alter table public.species_synonyms enable row level security;
alter table public.weight_logs enable row level security;

create policy notes_select on public.animal_notes for select to public
  using (exists (select 1 from animals a join animal_ownership ao on ao.animal_id = a.id
                 where a.id = animal_notes.animal_id and ao.user_id = auth.uid() and ao.is_current_owner = true));
create policy notes_update on public.animal_notes for update to public
  using (created_by = auth.uid());

create policy ownership_insert on public.animal_ownership for insert to public
  with check (user_id = auth.uid());
create policy ownership_select on public.animal_ownership for select to public
  using (user_id = auth.uid());

create policy animals_delete on public.animals for delete to public
  using (created_by = auth.uid());
create policy animals_insert on public.animals for insert to public
  with check (created_by = auth.uid());
create policy animals_insert_own on public.animals for insert to public
  with check (created_by = auth.uid());
create policy animals_select on public.animals for select to public
  using (visibility = 'public'::text or exists (select 1 from animal_ownership ao
         where ao.animal_id = animals.id and ao.user_id = auth.uid() and ao.is_current_owner = true));
create policy animals_select_own on public.animals for select to public
  using (created_by = auth.uid());
create policy animals_update on public.animals for update to public
  using (exists (select 1 from animal_ownership ao
         where ao.animal_id = animals.id and ao.user_id = auth.uid() and ao.is_current_owner = true));
create policy animals_update_own on public.animals for update to public
  using (created_by = auth.uid());

create policy pairings_select on public.breeding_pairings for select to public
  using (exists (select 1 from animal_ownership ao
         where ao.user_id = auth.uid() and ao.is_current_owner = true
           and (ao.animal_id = breeding_pairings.male_id or ao.animal_id = breeding_pairings.female_id)));

create policy clutches_select on public.clutches for select to public
  using (exists (select 1 from breeding_pairings bp join animal_ownership ao on ao.animal_id = bp.female_id
         where bp.id = clutches.pairing_id and ao.user_id = auth.uid() and ao.is_current_owner = true));

create policy feedings_all on public.feedings for all to public
  using (exists (select 1 from animal_ownership ao
         where ao.animal_id = feedings.animal_id and ao.user_id = auth.uid() and ao.is_current_owner = true))
  with check (fed_by = auth.uid());
create policy feedings_insert_own on public.feedings for insert to public
  with check (fn06_is_current_owner(animal_id, auth.uid()));
create policy feedings_select_own on public.feedings for select to public
  using (fn06_is_current_owner(animal_id, auth.uid()));
create policy feedings_update_own on public.feedings for update to public
  using (fn06_is_current_owner(animal_id, auth.uid()));

create policy health_events_all on public.health_events for all to public
  using (exists (select 1 from animal_ownership ao
         where ao.animal_id = health_events.animal_id and ao.user_id = auth.uid() and ao.is_current_owner = true))
  with check (recorded_by = auth.uid());
create policy health_events_insert_own on public.health_events for insert to public
  with check (fn06_is_current_owner(animal_id, auth.uid()));
create policy health_events_select_own on public.health_events for select to public
  using (fn06_is_current_owner(animal_id, auth.uid()));
create policy health_events_update_own on public.health_events for update to public
  using (fn06_is_current_owner(animal_id, auth.uid()));

create policy length_logs_all on public.length_logs for all to public
  using (exists (select 1 from animal_ownership ao
         where ao.animal_id = length_logs.animal_id and ao.user_id = auth.uid() and ao.is_current_owner = true))
  with check (recorded_by = auth.uid());
create policy length_logs_insert_own on public.length_logs for insert to public
  with check (fn06_is_current_owner(animal_id, auth.uid()));
create policy length_logs_select_own on public.length_logs for select to public
  using (fn06_is_current_owner(animal_id, auth.uid()));
create policy length_logs_update_own on public.length_logs for update to public
  using (fn06_is_current_owner(animal_id, auth.uid()));

create policy transfers_select on public.ownership_transfers for select to public
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy profiles_select on public.profiles for select to public
  using (true);
create policy profiles_select_own on public.profiles for select to public
  using (id = auth.uid());
create policy profiles_update on public.profiles for update to public
  using (id = auth.uid());

create policy sheds_all on public.sheds for all to public
  using (exists (select 1 from animal_ownership ao
         where ao.animal_id = sheds.animal_id and ao.user_id = auth.uid() and ao.is_current_owner = true))
  with check (recorded_by = auth.uid());
create policy sheds_insert_own on public.sheds for insert to public
  with check (fn06_is_current_owner(animal_id, auth.uid()));
create policy sheds_select_own on public.sheds for select to public
  using (fn06_is_current_owner(animal_id, auth.uid()));
create policy sheds_update_own on public.sheds for update to public
  using (fn06_is_current_owner(animal_id, auth.uid()));

create policy species_are_readable on public.species for select to public
  using (true);

create policy weight_insert_own on public.weight_logs for insert to public
  with check (exists (select 1 from animals a where a.id = weight_logs.animal_id and a.created_by = auth.uid()));
create policy weight_select_own on public.weight_logs for select to public
  using (exists (select 1 from animals a where a.id = weight_logs.animal_id and a.created_by = auth.uid()));
create policy weight_update_own on public.weight_logs for update to public
  using (exists (select 1 from animals a where a.id = weight_logs.animal_id and a.created_by = auth.uid()));
