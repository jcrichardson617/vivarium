-- Topic sweeps: literature that is not about one named species (general care,
-- diseases that span species, veterinary methods). These papers are left
-- untagged, so species-filtered searches always include them. harvest-research
-- alternates between species and topics, oldest first. Add a topic by
-- inserting a row with a Europe PMC query.

create table public.research_harvest_topics (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  query text not null,
  active boolean not null default true,
  last_harvested_at timestamptz,
  last_status text check (last_status in ('ok', 'error')),
  last_error text,
  hit_count integer,
  docs_added integer not null default 0
);

alter table public.research_harvest_topics enable row level security;
create policy research_harvest_topics_select on public.research_harvest_topics for select to authenticated
  using (private.is_moderator());

insert into public.research_harvest_topics (label, query) values
  ('Reptile husbandry & welfare', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian) AND TITLE_ABS:(husbandry OR "captive care" OR captivity OR "animal welfare" OR welfare OR enrichment OR terrarium OR vivarium OR enclosure) AND LANG:"eng"'),
  ('Lighting, UVB & vitamin D', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian OR amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:(ultraviolet OR UVB OR "UV-B" OR "vitamin D" OR "vitamin D3" OR photoperiod OR basking) AND LANG:"eng"'),
  ('Thermal biology', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian OR amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:(thermoregulation OR "preferred body temperature" OR "thermal preference" OR "thermal gradient" OR "critical thermal") AND LANG:"eng"'),
  ('Nutrition & diet', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian) AND TITLE_ABS:(nutrition OR diet OR feeding OR "feeder insects" OR calcium OR supplementation OR obesity OR prey) AND LANG:"eng"'),
  ('Metabolic bone disease', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian OR amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:("metabolic bone disease" OR "nutritional secondary hyperparathyroidism" OR hypocalcemia OR hypocalcaemia) AND LANG:"eng"'),
  ('Reproduction & incubation', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian) AND TITLE_ABS:(incubation OR "egg incubation" OR oviposition OR "temperature-dependent sex determination" OR "captive breeding" OR dystocia OR "egg binding" OR parthenogenesis OR "follicular stasis") AND LANG:"eng"'),
  ('Reptile infectious disease', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian) AND TITLE_ABS:("snake fungal disease" OR Ophidiomyces OR Nannizziopsis OR Cryptosporidium OR cryptosporidiosis OR "inclusion body disease" OR arenavirus OR ferlavirus OR paramyxovirus OR nidovirus OR serpentovirus OR ranavirus OR adenovirus OR Salmonella OR Ophionyssus OR mites) AND LANG:"eng"'),
  ('Reptile veterinary medicine', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian) AND TITLE_ABS:(anesthesia OR anaesthesia OR analgesia OR sedation OR "reference intervals" OR hematology OR haematology OR "blood chemistry" OR radiography OR ultrasonography OR surgery OR pharmacokinetics) AND LANG:"eng"'),
  ('Shedding & skin', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian) AND TITLE_ABS:(ecdysis OR dysecdysis OR shedding OR dermatitis OR "skin disease") AND LANG:"eng"'),
  ('Behavior, stress & handling', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian OR amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:(behavior OR behaviour OR cognition OR learning OR stress OR corticosterone OR handling) AND LANG:"eng"'),
  ('Humidity & hydration', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian OR amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:(humidity OR hydration OR dehydration OR "evaporative water loss") AND LANG:"eng"'),
  ('Color morphs & genetics', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian) AND TITLE_ABS:("color morph" OR "colour morph" OR coloration OR colouration OR pigmentation OR "pattern mutation" OR leucism OR albinism) AND LANG:"eng"'),
  ('Amphibian husbandry', 'TITLE_ABS:(amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:(husbandry OR "captive care" OR captivity OR "animal welfare" OR enrichment OR vivarium OR "captive breeding") AND LANG:"eng"'),
  ('Amphibian disease', 'TITLE_ABS:(amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:(chytrid OR Batrachochytrium OR chytridiomycosis OR ranavirus OR "red leg" OR Bsal) AND LANG:"eng"'),
  ('Amphibian nutrition', 'TITLE_ABS:(amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:(nutrition OR diet OR "vitamin A" OR hypovitaminosis OR calcium OR supplementation) AND LANG:"eng"'),
  ('Exotic pet trade & zoonoses', 'TITLE_ABS:(reptile OR reptiles OR snake OR snakes OR lizard OR lizards OR squamate OR squamates OR chelonian OR chelonians OR tortoise OR tortoises OR turtle OR turtles OR gecko OR geckos OR chameleon OR chameleons OR iguana OR iguanas OR skink OR skinks OR "monitor lizard" OR "bearded dragon" OR tegu OR crocodilian OR amphibian OR amphibians OR frog OR frogs OR toad OR toads OR salamander OR salamanders OR newt OR newts OR caecilian OR axolotl) AND TITLE_ABS:("pet trade" OR "exotic pets" OR "exotic pet" OR zoonosis OR zoonotic) AND LANG:"eng"');

create or replace function public.fn47_next_harvest_topic()
 returns table(id uuid, label text, query text, last_harvested_at timestamptz)
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select t.id, t.label, t.query, t.last_harvested_at
    from public.research_harvest_topics t
    where t.active
      and (t.last_harvested_at is null or t.last_harvested_at < now() - interval '30 days')
    order by t.last_harvested_at nulls first, t.label
    limit 1;
$$;

revoke execute on function public.fn47_next_harvest_topic() from public, anon, authenticated;
grant execute on function public.fn47_next_harvest_topic() to service_role;

-- The job log grows every 20 seconds; keep three days of it.
select cron.schedule('herpatlas-cron-log-cleanup', '17 3 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '3 days'$$);
