-- Keep the research library focused on what reptile and amphibian keepers
-- need: natural history, ecology, captive care and health. Drops papers that
-- are not about herps at all (hobbyist nicknames like "Leo", "Uro", "ADF" or
-- "Anaconda" matched urology, satellites and stents) and lab-only work
-- (cell biology, genomics, venom biochemistry, model-organism development)
-- unless the title ties it to behaviour, husbandry, health or ecology.

create or replace function private.research_relevance(p_title text, p_abstract text)
 returns text language sql stable set search_path = '' as $$
  with t as (select p_title as ti, p_title || ' ' || coalesce(p_abstract, '') as txt)
  select case
    -- Not about reptiles or amphibians at all (ambiguous search terms).
    when not (txt ~* '(reptil|snake|serpent|lizard|squamat|chelon|tortois|turtle|terrapin|gecko|chamele|iguana|skink|varan|tegu|crocodil|alligator|caiman|pythons|pythonid|(ball|burmese|reticulated|carpet|green tree|blood|african rock) python|\mboas\M|boidae|viper|colubr|elapid|anole|amphibi|frog|toad|salamand|newt|caecilian|axolotl|anura|urodel|herpet|cobra|rattlesnake|agamid|lacert|testudin|emydid|gila monster|heloderma|uromastyx)'
              or exists (select 1 from public.species s
                         where split_part(s.scientific_name, ' ', 1) not in ('Python', 'Boa')
                           and txt ~ ('\m' || split_part(s.scientific_name, ' ', 1) || '\M')))
      then 'off_topic'
    -- Natural history, captive care and health always stay.
    when ti ~* '(captiv|husbandry|\mzoos?\M|\mpets?\M|keeper|welfare|enrichment|veterinar|natural history|\mwild|ecolog|habitat|\mdiet|feeding|nutrition|new species|taxonom|endemic)'
      then 'keep'
    -- Lab, cell and human-medicine work.
    when ti ~* '(\mpatients?\M|human|clinical trial|\mcells?\M|cell (death|line|culture)|oocyte|in vitro|transcriptom|genom|single-cell|crispr|knockout|transgenic|\mmice\M|\mmouse\M|\mrats?\M|neuron|synap|retina|gastrula|blastema|morphogen|\mmrna\M|microrna|cytokine|kinase|ligand|isoform|immunohisto|electrophysiolog|biomaterial|hydrogel|nanostruct|crystal structure|\mnmr\M)'
      then 'lab'
    -- Molecular topics, unless the title ties them to something keepers see.
    when ti ~* '(protein|peptide|\mgenes?\M|proteom|metabolom|\mrna\M|\mdna\M|receptor|enzyme|channel|embryo|cellular|molecular|signal+ing|expression|biosynthes|toxin|venom|neural|spinal|regenerat|mitochondri|antibod|immunoglobulin|binding|chromosom|cancer|tumou?r|insulin|glucagon|exendin|hormone|steroid|ultrastructur|histolog|keratin|adhesi|phylogen|cytochrome|lectin|antimicrobial)'
     and ti !~* '(behavio|thermal|temperature|thermoreg|bask|ultraviolet|\muvb?\M|light|humidity|hydrat|brumat|hibernat|incubat|clutch|\meggs?\M|hatchl|breed|reproduc|mating|courtship|growth|longevity|lifespan|distribution|population|field|season|activity|shed|ecdysis|disease|health|clinical|infection|parasit|pathogen|fung|vir(us|al)|bacteri|salmonella|treatment|anest|anaest|surgery|surgical|hematolog|haematolog|\mblood|reference (interval|value)|radiograph|diagnos|mortality|survival|\mmorphs?\M|colou?ration|pigment|albin|leucis|melanis|trade|stress|handling|metabolic bone|calcium|vitamin|obesity|dystocia|ranavirus|chytrid|\mprey|forag|\mtail|predat)'
      then 'lab'
    else 'keep'
  end
  from t
$$;

revoke all on function private.research_relevance(text, text) from public, anon, authenticated;

-- Harvested papers that fail the filter are skipped (the insert returns no row,
-- so harvest-research makes no passages for them).
create or replace function private.research_documents_relevance_gate()
 returns trigger language plpgsql set search_path = '' as $$
begin
    if new.external_source = 'europepmc' and private.research_relevance(new.title, new.content) <> 'keep' then
        return null;
    end if;
    return new;
end;
$$;

create trigger research_documents_relevance_gate
  before insert on public.research_documents
  for each row execute function private.research_documents_relevance_gate();

-- Species searches use scientific synonyms only; hobbyist nicknames ("Leo",
-- "Retic", "BCI") match unrelated literature.
create or replace function public.fn46_next_harvest_species()
 returns table(id uuid, scientific_name text, common_name text, synonyms text[])
 language sql stable security definer set search_path to ''
as $$
    select s.id, s.scientific_name, s.common_name,
           coalesce(array_agg(ss.synonym_name) filter (where ss.synonym_name ~ '^[A-Z][a-z]+ [a-z]+'), '{}')
    from public.species s
    left join public.research_harvest_state h on h.species_id = s.id
    left join public.species_synonyms ss on ss.species_id = s.id
    where s.active
      and (h.last_harvested_at is null or h.last_harvested_at < now() - interval '30 days')
    group by s.id, h.last_harvested_at
    order by h.last_harvested_at nulls first, s.common_name
    limit 1;
$$;
