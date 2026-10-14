-- Automated harvesting of literature into the research library.
-- pg_cron calls two edge functions:
--   harvest-research  (every 10 min) pulls papers for the next species from Europe PMC
--   fetch-fulltext    (every 2 min)  pulls full text of open-access papers whose license allows reuse
--   embed-chunks      (every 20 s)   embeds passages that do not have an embedding yet
-- The edge functions authenticate cron calls with a shared secret that never
-- leaves the database: it lives in Vault and is checked by fn45.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

alter table public.research_documents
  add column external_source text,
  add column external_id text,
  add column cited_by_count integer,
  -- Full text is fetched only for open-access papers under licenses that allow
  -- commercial reuse (CC BY, CC BY-SA, CC0); everything else keeps its abstract.
  add column fulltext_status text check (fulltext_status in ('pending', 'done', 'error', 'unavailable')),
  add column pmcid text,
  add constraint research_documents_external_key unique (external_source, external_id);

-- Per-species harvest progress.
create table public.research_harvest_state (
  species_id uuid primary key references public.species(id) on delete cascade,
  last_harvested_at timestamptz,
  last_status text check (last_status in ('ok', 'error')),
  last_error text,
  hit_count integer,
  docs_added integer not null default 0
);

create index research_documents_fulltext_pending_idx on public.research_documents (created_at)
  where fulltext_status = 'pending';

alter table public.research_harvest_state enable row level security;
create policy research_harvest_state_select on public.research_harvest_state for select to authenticated
  using (private.is_moderator());

-- Shared secret for cron -> edge function calls.
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'herpatlas_cron_secret',
                           'Authenticates pg_cron calls to the research edge functions')
where not exists (select 1 from vault.secrets where name = 'herpatlas_cron_secret');

create or replace function public.fn45_check_cron_secret(p_secret text)
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select exists (
        select 1 from vault.decrypted_secrets
        where name = 'herpatlas_cron_secret' and decrypted_secret = p_secret
    );
$$;

revoke execute on function public.fn45_check_cron_secret(text) from public, anon, authenticated;
grant execute on function public.fn45_check_cron_secret(text) to service_role;

-- The species to harvest next: never harvested first, then anything older than 30 days.
create or replace function public.fn46_next_harvest_species()
 returns table(id uuid, scientific_name text, common_name text, synonyms text[])
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select s.id, s.scientific_name, s.common_name,
           coalesce(array_agg(ss.synonym_name) filter (where ss.synonym_name is not null), '{}')
    from public.species s
    left join public.research_harvest_state h on h.species_id = s.id
    left join public.species_synonyms ss on ss.species_id = s.id
    where s.active
      and (h.last_harvested_at is null or h.last_harvested_at < now() - interval '30 days')
    group by s.id, h.last_harvested_at
    order by h.last_harvested_at nulls first, s.common_name
    limit 1;
$$;

revoke execute on function public.fn46_next_harvest_species() from public, anon, authenticated;
grant execute on function public.fn46_next_harvest_species() to service_role;

-- POST to one of the research edge functions with the cron secret.
create or replace function private.call_research_function(p_name text, p_body jsonb default '{}'::jsonb)
 returns bigint
 language sql
 security definer
 set search_path = ''
as $$
    select net.http_post(
        url := 'https://megvsfrjvmjpujarjksx.supabase.co/functions/v1/' || p_name,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'herpatlas_cron_secret')
        ),
        body := p_body,
        timeout_milliseconds := 120000
    );
$$;

revoke all on function private.call_research_function(text, jsonb) from public, anon, authenticated;

-- Admin "Harvest now" button.
create or replace function public.fn44_run_research_job(p_job text)
 returns bigint
 language plpgsql
 security definer
 set search_path = ''
as $$
begin
    if not private.is_moderator() then
        raise exception 'Moderator access required';
    end if;
    if p_job not in ('harvest-research', 'fetch-fulltext', 'embed-chunks') then
        raise exception 'Unknown job';
    end if;
    return private.call_research_function(p_job);
end;
$$;

revoke execute on function public.fn44_run_research_job(text) from public, anon;

select cron.schedule('herpatlas-harvest', '*/10 * * * *', $$select private.call_research_function('harvest-research')$$);
select cron.schedule('herpatlas-fulltext', '*/2 * * * *', $$select private.call_research_function('fetch-fulltext')$$);
select cron.schedule('herpatlas-embed', '20 seconds', $$select private.call_research_function('embed-chunks')$$);
