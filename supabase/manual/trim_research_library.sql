-- Removes papers that aren't useful to keepers (see
-- migrations/20261016000400_research_relevance.sql for the filter, which is
-- already live and also blocks new ones). The connector can't run DELETEs,
-- so paste into Supabase Dashboard -> SQL Editor.
--
-- RUN THE THREE PARTS ONE AT A TIME (highlight a part, Run).

-- ===================== PART 1: preview (optional) =====================
select private.research_relevance(title, content) as verdict, count(*) as papers
from public.research_documents
group by 1;

-- ===================== PART 2: delete =====================
-- Passages and species tags go with each paper (on delete cascade).
set statement_timeout = 0;
delete from public.research_documents
where external_source = 'europepmc'
  and private.research_relevance(title, content) <> 'keep';

-- ===================== PART 3: give the space back =====================
-- Rewrites the tables without the deleted rows. Run on its own.
vacuum full public.research_chunks, public.research_documents, public.research_document_species;
select pg_size_pretty(pg_database_size(current_database())) as database_size;
