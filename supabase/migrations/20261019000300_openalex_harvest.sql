-- Second research source: OpenAlex, for herpetology journals PubMed doesn't index
-- (and so Europe PMC misses). harvest-openalex asks only for works without a
-- PubMed id, so it fills gaps rather than repeating Europe PMC. Species runs only.

create table public.research_harvest_openalex (
  species_id uuid primary key references public.species(id) on delete cascade,
  last_harvested_at timestamptz,
  last_status text check (last_status in ('ok', 'error')),
  last_error text,
  hit_count integer,
  docs_added integer not null default 0
);

alter table public.research_harvest_openalex enable row level security;
create policy research_harvest_openalex_select on public.research_harvest_openalex for select to authenticated
  using (private.is_moderator());

create or replace function public.fn74_next_openalex_species()
 returns table(id uuid, scientific_name text, common_name text, synonyms text[])
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select s.id, s.scientific_name, s.common_name,
           coalesce(array_agg(ss.synonym_name) filter (where ss.synonym_name is not null), '{}')
    from public.species s
    left join public.research_harvest_openalex h on h.species_id = s.id
    left join public.species_synonyms ss on ss.species_id = s.id
    where s.active
      and (h.last_harvested_at is null or h.last_harvested_at < now() - interval '30 days')
    group by s.id, h.last_harvested_at
    order by h.last_harvested_at nulls first, s.common_name
    limit 1;
$$;

revoke execute on function public.fn74_next_openalex_species() from public, anon, authenticated;
grant execute on function public.fn74_next_openalex_species() to service_role;

-- The keeper-relevance filter applies to OpenAlex papers too.
create or replace function private.research_documents_relevance_gate()
 returns trigger language plpgsql set search_path = '' as $$
begin
    if new.external_source in ('europepmc', 'openalex') and private.research_relevance(new.title, new.content) <> 'keep' then
        return null;
    end if;
    return new;
end;
$$;

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
    if p_job not in ('harvest-research', 'harvest-openalex', 'fetch-fulltext', 'embed-chunks') then
        raise exception 'Unknown job';
    end if;
    return private.call_research_function(p_job);
end;
$$;

-- Every 20 minutes: about 3 requests per run stays inside OpenAlex's free daily budget.
select cron.schedule('herpatlas-harvest-openalex', '5-59/20 * * * *', $$select private.call_research_function('harvest-openalex')$$);

-- The gate calls private.research_relevance, which the harvesters' service role
-- can't reach; run the trigger as its owner.
alter function private.research_documents_relevance_gate() security definer;
