-- Structured morph genetics.
--
-- genes:            curated per-species list keepers pick from (no free-text morphs).
-- animal_genes:     which genes an animal carries, and how (visual / super / het / possible het).
-- gene_submissions: keepers propose missing genes; moderators approve or reject.
-- morph_name():     builds the display name ("Pastel Enchi 66% het Clown") from animal_genes.

-- ============================================================================
-- Tables
-- ============================================================================

create table public.genes (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.species(id) on delete cascade,
  name text not null,
  inheritance text not null
    check (inheritance in ('recessive', 'incomplete_dominant', 'dominant', 'polygenic')),
  -- Genes sharing a group are alleles at the same locus (e.g. the BEL complex);
  -- pairing predictions need this to know two genes cannot both be passed on.
  allelic_group text,
  -- Hobby name for the homozygous form of an incomplete dominant gene (Super Pastel, Ivory...).
  super_name text,
  aliases text[] not null default '{}',
  notes text,
  -- Seeded genes start unverified until a human has checked them.
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index genes_species_name_key on public.genes (species_id, lower(name));
create index genes_species_idx on public.genes (species_id) where active;

create table public.animal_genes (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  gene_id uuid not null references public.genes(id),
  status text not null
    check (status in ('visual', 'super', 'het', 'possible_het')),
  -- Only for possible_het, e.g. 50 or 66.
  het_probability numeric(5,2)
    check (het_probability is null or (het_probability > 0 and het_probability < 100)),
  created_at timestamptz not null default now(),
  unique (animal_id, gene_id),
  check ((status = 'possible_het') = (het_probability is not null))
);

create index animal_genes_gene_idx on public.animal_genes (gene_id);

create table public.gene_submissions (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references public.species(id),
  name text not null,
  inheritance text not null
    check (inheritance in ('recessive', 'incomplete_dominant', 'dominant', 'polygenic')),
  allelic_group text,
  super_name text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid default auth.uid() references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index gene_submissions_pending_idx on public.gene_submissions (created_at) where status = 'pending';

-- ============================================================================
-- Validation: the status must make sense for the gene's inheritance and species
-- ============================================================================

create or replace function private.check_animal_gene()
 returns trigger
 language plpgsql
 security definer
 set search_path = ''
as $$
declare
    v_gene public.genes;
    v_species_id uuid;
begin
    select * into v_gene from public.genes where id = new.gene_id;
    select species_id into v_species_id from public.animals where id = new.animal_id;

    if v_gene.species_id is distinct from v_species_id then
        raise exception 'Gene % does not belong to this animal''s species', v_gene.name;
    end if;

    if new.status in ('het', 'possible_het') and v_gene.inheritance <> 'recessive' then
        raise exception '% is not recessive, so it cannot be het', v_gene.name;
    end if;

    if new.status = 'super' and v_gene.inheritance <> 'incomplete_dominant' then
        raise exception '% has no super form', v_gene.name;
    end if;

    return new;
end;
$$;

create trigger animal_genes_check
  before insert or update on public.animal_genes
  for each row execute function private.check_animal_gene();

-- ============================================================================
-- Morph name
-- ============================================================================

-- Order: super forms, visual genes, then hets (100% before possible hets).
create or replace function public.morph_name(p_animal_id uuid)
 returns text
 language sql
 stable
 set search_path = public
as $$
    select coalesce(
        nullif(string_agg(label, ' ' order by sort_key, gene_name), ''),
        'Normal'
    )
    from (
        select
            g.name as gene_name,
            case ag.status
                when 'super' then 0
                when 'visual' then 1
                when 'het' then 2
                else 3
            end as sort_key,
            case ag.status
                when 'super' then coalesce(g.super_name, 'Super ' || g.name)
                when 'visual' then g.name
                when 'het' then '100% het ' || g.name
                else trim(to_char(ag.het_probability, 'FM990.##')) || '% het ' || g.name
            end as label
        from animal_genes ag
        join genes g on g.id = ag.gene_id
        where ag.animal_id = p_animal_id
    ) parts;
$$;

-- ============================================================================
-- Gene submission review
-- ============================================================================

create or replace function public.fn29_submit_gene(
    p_species_id uuid, p_name text, p_inheritance text,
    p_allelic_group text default null, p_super_name text default null, p_notes text default null)
 returns uuid
 language plpgsql
 set search_path = public
as $$
declare
    v_id uuid;
begin
    if exists (
        select 1 from genes
        where species_id = p_species_id and lower(name) = lower(trim(p_name))
    ) then
        raise exception 'Gene already exists for this species';
    end if;

    insert into gene_submissions (species_id, name, inheritance, allelic_group, super_name, notes)
    values (p_species_id, trim(p_name), p_inheritance, nullif(trim(p_allelic_group), ''),
            nullif(trim(p_super_name), ''), p_notes)
    returning id into v_id;

    return v_id;
end;
$$;

create or replace function public.fn30_approve_gene_submission(p_submission_id uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path = public
as $$
declare
    v_sub gene_submissions;
    v_gene_id uuid;
begin
    if not private.is_moderator() then
        raise exception 'Moderator access required';
    end if;

    select * into v_sub from gene_submissions where id = p_submission_id for update;

    if not found then
        raise exception 'Submission not found';
    end if;

    if v_sub.status <> 'pending' then
        raise exception 'Submission already reviewed';
    end if;

    insert into genes (species_id, name, inheritance, allelic_group, super_name, notes, verified)
    values (v_sub.species_id, v_sub.name, v_sub.inheritance, v_sub.allelic_group,
            v_sub.super_name, v_sub.notes, true)
    returning id into v_gene_id;

    update gene_submissions
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_submission_id;

    return v_gene_id;
end;
$$;

create or replace function public.fn31_reject_gene_submission(p_submission_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path = public
as $$
begin
    if not private.is_moderator() then
        raise exception 'Moderator access required';
    end if;

    update gene_submissions
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_submission_id and status = 'pending';
end;
$$;

revoke execute on function public.fn29_submit_gene(uuid, text, text, text, text, text) from public, anon;
revoke execute on function public.fn30_approve_gene_submission(uuid) from public, anon;
revoke execute on function public.fn31_reject_gene_submission(uuid) from public, anon;
revoke all on function private.check_animal_gene() from public, anon, authenticated;

-- ============================================================================
-- Access rules
-- ============================================================================

alter table public.genes enable row level security;
alter table public.animal_genes enable row level security;
alter table public.gene_submissions enable row level security;

create policy genes_select on public.genes for select to anon, authenticated
  using (true);

-- Genetics are visible wherever the animal is visible (public animals or your own).
create policy animal_genes_select on public.animal_genes for select to anon, authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id));
create policy animal_genes_insert on public.animal_genes for insert to authenticated
  with check (private.owns_animal(animal_id));
create policy animal_genes_update on public.animal_genes for update to authenticated
  using (private.owns_animal(animal_id)) with check (private.owns_animal(animal_id));
create policy animal_genes_delete on public.animal_genes for delete to authenticated
  using (private.owns_animal(animal_id));

create policy gene_submissions_select on public.gene_submissions for select to authenticated
  using (submitted_by = (select auth.uid()) or private.is_moderator());
create policy gene_submissions_insert on public.gene_submissions for insert to authenticated
  with check (submitted_by = (select auth.uid()) and status = 'pending');
