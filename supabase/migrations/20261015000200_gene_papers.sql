-- Papers in the research library tagged with a species that mention a term
-- (a morph gene name), for the public morph pages.
create or replace function public.fn49_species_term_papers(p_species_id uuid, p_term text, p_limit integer default 6)
 returns table(id uuid, title text, source_url text, publisher text, published_date date, cited_by_count integer)
 language sql
 stable
 set search_path = public
as $$
    select d.id, d.title, d.source_url, d.publisher, d.published_date, d.cited_by_count
    from research_documents d
    where d.ingest_status = 'ready'
      and exists (select 1 from research_document_species s where s.document_id = d.id and s.species_id = p_species_id)
      and exists (select 1 from research_chunks c
                  where c.document_id = d.id
                    and c.fts @@ phraseto_tsquery('english', p_term))
    order by d.cited_by_count desc nulls last
    limit least(greatest(p_limit, 1), 20);
$$;
