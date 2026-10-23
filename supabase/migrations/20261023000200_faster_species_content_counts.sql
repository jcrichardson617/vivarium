-- fn48 ran two correlated counts per species (~2.8 s), close to anon's 3 s
-- statement timeout, so the sitemap query timed out and failed the build.
-- Same output, one grouped pass per table (~0.2 s).
create or replace function public.fn48_species_content_counts()
 returns table(species_id uuid, gene_count bigint, paper_count bigint)
 language sql
 stable
 set search_path to 'public'
as $function$
    with g as (
      select genes.species_id, count(*) as n from genes where genes.active group by 1
    ), p as (
      select r.species_id, count(*) as n
        from research_document_species r
        join research_documents d on d.id = r.document_id
       where d.ingest_status = 'ready'
       group by 1
    )
    select s.id, coalesce(g.n, 0), coalesce(p.n, 0)
      from species s
      left join g on g.species_id = s.id
      left join p on p.species_id = s.id
     where s.active;
$function$;
