-- Keep engineering and computing papers out of the research library. OpenAlex
-- species searches matched optimisation algorithms named after herps ("Frilled
-- Lizard Optimization", "Mexican Axolotl Algorithm", "Snake Optimizer") used in
-- breast cancer, power-grid and IoT papers; their abstracts describe the
-- animal's hunting behaviour, so the plain "mentions a herp" test passed them.
-- Also tightens a few word roots that matched look-alikes (Newton, integument,
-- herpetic, leapfrog, Lizard Island).

create or replace function private.research_relevance(p_title text, p_abstract text)
 returns text language sql stable set search_path = '' as $$
  with t as (
    select p_title as ti,
           -- Algorithms and robots named after animals ("Frilled Lizard Optimization",
           -- "Mexican Axolotl Algorithm", "Snake Optimizer", "shuffled frog-leaping",
           -- "snake robot") and other look-alikes say nothing about the animal.
           regexp_replace(p_title, '((\m[[:alpha:]]+)[ -]+){0,3}(optimi[sz](ation|er|ing)s?|algorithms?|metaheuristics?|swarms?|leaping|robots?|robotic)\M|\m[[:alpha:]]*leapfrog|lizard island', ' ', 'gi') as named,
           regexp_replace(p_title || ' ' || coalesce(p_abstract, ''), '((\m[[:alpha:]]+)[ -]+){0,3}(optimi[sz](ation|er|ing)s?|algorithms?|metaheuristics?|swarms?|leaping|robots?|robotic)\M|\m[[:alpha:]]*leapfrog|lizard island', ' ', 'gi') as txt
  ), h as (
    select t.*,
           '(reptil|snake|serpent|lizard|squamat|chelon|tortois|turtle|terrapin|gecko|chamele|iguana|skink|varan|tegus?\M|crocodil|alligator|caiman|pythons|pythonid|(ball|burmese|reticulated|carpet|green tree|blood|african rock) python|\mboas\M|boidae|viper|colubr|elapid|anole|amphibi|frog|toad|salamand|newts?\M|caecilian|axolotl|anura|urodel|herpeto|cobra|rattlesnake|agamid|lacert|testudin|emydid|gila monster|heloderma|uromastyx)' as herp,
           array(select '\m' || split_part(s.scientific_name, ' ', 1) || '\M' from public.species s
                 where split_part(s.scientific_name, ' ', 1) not in ('Python', 'Boa')) as genera
    from t
  )
  select case
    -- Not about reptiles or amphibians at all (ambiguous search terms).
    when not (txt ~* herp or txt ~ any (genera))
      then 'off_topic'
    -- Engineering and computing papers whose method is named after or "inspired
    -- by" a herp; the abstract describes the animal, but the title never does.
    when txt ~* '(metaheuristic|optimi[sz]er|optimi[sz]ation algorithm|(bio|nature)[- ]?inspired|swarm intelligence|hyperparameter|\mrobot)'
     and not (named ~* herp or named ~ any (genera))
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
  from h
$$;

-- OpenAlex species searches use scientific synonyms only, like Europe PMC's
-- (fn46): nicknames such as "Leo", "ADF" and "Uro" matched astronomy and urology.
create or replace function public.fn74_next_openalex_species()
 returns table(id uuid, scientific_name text, common_name text, synonyms text[])
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select s.id, s.scientific_name, s.common_name,
           coalesce(array_agg(ss.synonym_name) filter (where ss.synonym_name ~ '^[A-Z][a-z]+ [a-z]+'), '{}')
    from public.species s
    left join public.research_harvest_openalex h on h.species_id = s.id
    left join public.species_synonyms ss on ss.species_id = s.id
    where s.active
      and (h.last_harvested_at is null or h.last_harvested_at < now() - interval '30 days')
    group by s.id, h.last_harvested_at
    order by h.last_harvested_at nulls first, s.common_name
    limit 1;
$$;
