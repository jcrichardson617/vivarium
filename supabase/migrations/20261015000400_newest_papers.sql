-- Newest papers in the research library (optionally for one species), for the
-- public "Latest research" pages. Returns only an excerpt of the text.
create or replace function public.fn50_newest_papers(p_species_id uuid default null, p_limit integer default 25, p_offset integer default 0)
 returns table(
   id uuid, title text, source_url text, publisher text, published_date date, authors text[],
   license text, excerpt text, cited_by_count integer, species jsonb
 )
 language sql
 stable
 set search_path = public
as $$
    select d.id, d.title, d.source_url, d.publisher, d.published_date, d.authors, d.license,
           left(d.content, 600),
           d.cited_by_count,
           coalesce((select jsonb_agg(jsonb_build_object('common_name', s.common_name, 'scientific_name', s.scientific_name))
                       from research_document_species rs join species s on s.id = rs.species_id
                      where rs.document_id = d.id), '[]'::jsonb)
    from research_documents d
    where d.published_date is not null
      and d.published_date <= current_date + 31
      and (p_species_id is null
           or exists (select 1 from research_document_species rs where rs.document_id = d.id and rs.species_id = p_species_id))
    order by d.published_date desc, d.id
    limit least(greatest(p_limit, 1), 100)
    offset greatest(p_offset, 0);
$$;

create index if not exists research_documents_published_idx on public.research_documents (published_date desc);
