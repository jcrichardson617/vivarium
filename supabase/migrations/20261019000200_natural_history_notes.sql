-- Herpetological Review "Natural History Notes" live in the research library as
-- summary-only documents (external_source = 'herp_review'): we keep the citation,
-- topic, a link to SSAR's PDF and our own summary, never the note's text.
alter table public.research_documents
  add column note_topic text,
  -- e.g. 'Herpetological Review 46(2): 235–236'
  add column citation text;

create index research_documents_herp_review_idx on public.research_documents (external_source)
  where external_source = 'herp_review';
