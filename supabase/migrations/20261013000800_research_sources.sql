-- Source tracking for HerpAtlas research.
--
-- Priority: open-access papers (full text allowed by license), then published
-- abstracts, then web care sheets. For copyrighted sources we keep only a link
-- and our own summary; `content` (stored source text) is allowed only when the
-- license permits it. The table was empty when this ran.

alter table public.research_documents
  add constraint research_documents_source_type_check
    check (source_type in ('journal_article', 'abstract', 'care_sheet', 'book', 'thesis', 'website', 'other')),
  -- What we are allowed to keep from the source.
  add column content_rights text not null default 'summary_only'
    check (content_rights in ('full_text', 'abstract', 'summary_only')),
  add column evidence_level text not null default 'grey_literature'
    check (evidence_level in ('peer_reviewed', 'grey_literature', 'community')),
  add column open_access boolean not null default false,
  -- SPDX id where one exists, e.g. 'CC-BY-4.0'; null when unknown or all rights reserved.
  add column license text,
  add column authors text[] not null default '{}',
  -- Journal name, website or publisher.
  add column publisher text,
  add column doi text,
  add column retrieved_at timestamptz,
  add column updated_at timestamptz not null default now(),
  -- Source text may only be stored when its rights allow it.
  add constraint research_documents_content_rights
    check (content is null or content_rights in ('full_text', 'abstract'));

alter table public.research_documents alter column source_type set not null;
alter table public.research_documents alter column source_url set not null;

create unique index research_documents_doi_key on public.research_documents (lower(doi)) where doi is not null;
create unique index research_documents_url_key on public.research_documents (source_url);

-- Papers often cover several species.
create table public.research_document_species (
  document_id uuid not null references public.research_documents(id) on delete cascade,
  species_id uuid not null references public.species(id) on delete cascade,
  primary key (document_id, species_id)
);

create index research_document_species_species_idx on public.research_document_species (species_id);

alter table public.research_document_species enable row level security;
create policy research_document_species_select on public.research_document_species
  for select to anon, authenticated using (true);

-- Writes to research tables come from moderators (and later the ingestion job,
-- which uses the service role and bypasses RLS).
create policy research_documents_insert on public.research_documents for insert to authenticated
  with check (private.is_moderator());
create policy research_documents_update on public.research_documents for update to authenticated
  using (private.is_moderator()) with check (private.is_moderator());
create policy research_documents_delete on public.research_documents for delete to authenticated
  using (private.is_moderator());

create policy research_document_species_insert on public.research_document_species for insert to authenticated
  with check (private.is_moderator());
create policy research_document_species_delete on public.research_document_species for delete to authenticated
  using (private.is_moderator());
