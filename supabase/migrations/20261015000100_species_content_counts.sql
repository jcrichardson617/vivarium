-- How much content each species page has (morph genes and research papers).
-- Used for the species directory badges, the sitemap, and to keep thin
-- species pages out of search results until they have content.
create or replace function public.fn48_species_content_counts()
 returns table(species_id uuid, gene_count bigint, paper_count bigint)
 language sql
 stable
 set search_path = public
as $$
    select s.id,
           (select count(*) from genes g where g.species_id = s.id and g.active),
           (select count(*) from research_document_species r
              join research_documents d on d.id = r.document_id
             where r.species_id = s.id and d.ingest_status = 'ready')
    from species s
    where s.active;
$$;
