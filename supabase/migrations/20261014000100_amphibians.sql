-- Reptilytics covers amphibians as well as reptiles.
-- Adds a taxonomic class to species and seeds commonly kept amphibians.

alter table public.species
  add column taxon_class text check (taxon_class in ('Reptilia', 'Amphibia'));

-- Every species seeded so far is a reptile.
update public.species set taxon_class = 'Reptilia' where taxon_class is null;

alter table public.species alter column taxon_class set not null;

insert into public.species (scientific_name, common_name, genus, family, taxon_class)
values
  ('Ambystoma mexicanum', 'Axolotl', 'Ambystoma', 'Ambystomatidae', 'Amphibia'),
  ('Ceratophrys cranwelli', 'Cranwell''s Horned Frog', 'Ceratophrys', 'Ceratophryidae', 'Amphibia'),
  ('Litoria caerulea', 'White''s Tree Frog', 'Litoria', 'Pelodryadidae', 'Amphibia'),
  ('Agalychnis callidryas', 'Red-eyed Tree Frog', 'Agalychnis', 'Phyllomedusidae', 'Amphibia'),
  ('Dendrobates tinctorius', 'Dyeing Poison Frog', 'Dendrobates', 'Dendrobatidae', 'Amphibia'),
  ('Dendrobates auratus', 'Green and Black Poison Frog', 'Dendrobates', 'Dendrobatidae', 'Amphibia'),
  ('Pyxicephalus adspersus', 'African Bullfrog', 'Pyxicephalus', 'Pyxicephalidae', 'Amphibia'),
  ('Bombina orientalis', 'Oriental Fire-bellied Toad', 'Bombina', 'Bombinatoridae', 'Amphibia'),
  ('Cynops orientalis', 'Chinese Fire-bellied Newt', 'Cynops', 'Salamandridae', 'Amphibia'),
  ('Theloderma corticale', 'Vietnamese Mossy Frog', 'Theloderma', 'Rhacophoridae', 'Amphibia')
on conflict (scientific_name) do nothing;

-- Common aliases keepers search by.
insert into public.species_synonyms (species_id, synonym_name, source)
select s.id, v.synonym, 'common name'
from (values
  ('Ceratophrys cranwelli', 'Pacman frog'),
  ('Litoria caerulea', 'Ranoidea caerulea'),
  ('Litoria caerulea', 'Dumpy tree frog')
) as v(scientific_name, synonym)
join public.species s on s.scientific_name = v.scientific_name
on conflict do nothing;
