-- Species search for the add-animal picker, and adding an animal whose species is
-- still waiting for moderator approval. On approval the animal is linked to the
-- new species automatically.

alter table public.species_submissions
  add column taxon_class text check (taxon_class in ('Reptilia', 'Amphibia'));

alter table public.animals
  add column pending_species_submission_id uuid references public.species_submissions(id) on delete set null;

create index animals_pending_species_idx on public.animals (pending_species_submission_id)
  where pending_species_submission_id is not null;

-- Search common names, scientific names and synonyms. Prefix matches rank first.
create or replace function public.fn35_search_species(p_query text)
 returns table(id uuid, common_name text, scientific_name text, taxon_class text, matched_alias text)
 language sql
 stable
 set search_path = public
as $$
    with q as (
        select lower(trim(p_query)) as term,
               replace(replace(replace(lower(trim(p_query)), '\', '\\'), '%', '\%'), '_', '\_') as escaped
    ),
    matches as (
        select s.id, s.common_name, s.scientific_name, s.taxon_class, null::text as matched_alias,
               case
                   when lower(s.common_name) like q.escaped || '%' then 0
                   when lower(s.scientific_name) like q.escaped || '%' then 1
                   else 2
               end as rank
        from species s, q
        where s.active
          and length(q.term) >= 2
          and (lower(s.common_name) like '%' || q.escaped || '%'
               or lower(s.scientific_name) like '%' || q.escaped || '%')
        union all
        select s.id, s.common_name, s.scientific_name, s.taxon_class, ss.synonym_name,
               case when lower(ss.synonym_name) like q.escaped || '%' then 3 else 4 end
        from species_synonyms ss
        join species s on s.id = ss.species_id, q
        where s.active
          and length(q.term) >= 2
          and lower(ss.synonym_name) like '%' || q.escaped || '%'
    )
    select distinct on (m.id) m.id, m.common_name, m.scientific_name, m.taxon_class, m.matched_alias
    from matches m
    order by m.id, m.rank
    limit 50;
$$;

-- Create an animal for a species that is not in the list yet. Reuses an existing
-- pending request for the same scientific name so duplicates are not queued.
create or replace function public.fn34_create_animal_with_species_request(
    p_scientific_name text,
    p_common_name text,
    p_taxon_class text,
    p_name text,
    p_sex text,
    p_hatch_date date default null
)
 returns uuid
 language plpgsql
 security definer
 set search_path = public
as $$
declare
    -- Normalise to "Genus species": single spaces, capital genus, lowercase rest.
    v_clean text := regexp_replace(trim(coalesce(p_scientific_name, '')), '\s+', ' ', 'g');
    v_scientific text := upper(left(v_clean, 1)) || lower(substr(v_clean, 2));
    v_submission_id uuid;
    v_animal_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    if v_clean !~ '^[A-Za-z]+ [A-Za-z]+( [A-Za-z]+)?$' then
        raise exception 'Enter the scientific name as genus and species, e.g. Python regius';
    end if;

    if exists (select 1 from species where lower(scientific_name) = lower(v_scientific))
       or exists (select 1 from species_synonyms where lower(synonym_name) = lower(v_scientific)) then
        raise exception 'That species is already listed. Search for it instead.';
    end if;

    select id into v_submission_id
    from species_submissions
    where lower(scientific_name) = lower(v_scientific) and status = 'pending'
    order by created_at
    limit 1;

    if v_submission_id is null then
        insert into species_submissions (submitted_by, scientific_name, common_name, genus, taxon_class)
        values (auth.uid(), v_scientific, nullif(trim(p_common_name), ''), split_part(v_scientific, ' ', 1),
                case when p_taxon_class in ('Reptilia', 'Amphibia') then p_taxon_class end)
        returning id into v_submission_id;
    end if;

    insert into animals (species_id, created_by, name, sex, hatch_date, pending_species_submission_id)
    values (null, auth.uid(), trim(p_name), p_sex, p_hatch_date, v_submission_id)
    returning id into v_animal_id;

    insert into animal_ownership (animal_id, user_id, start_date, is_current_owner)
    values (v_animal_id, auth.uid(), now(), true);

    return v_animal_id;
end;
$$;

revoke execute on function public.fn34_create_animal_with_species_request(text, text, text, text, text, date) from public, anon;

-- Approval now links any animals that were waiting on this species.
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

    insert into species (scientific_name, common_name, genus, family, taxon_class)
    values (v_submission.scientific_name, v_submission.common_name, v_submission.genus, v_submission.family,
            coalesce(v_submission.taxon_class, 'Reptilia'))
    returning id into v_species_id;

    update animals
    set species_id = v_species_id, pending_species_submission_id = null
    where pending_species_submission_id = p_submission_id;

    update species_submissions
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_submission_id;

    return v_species_id;
end;
$function$;
