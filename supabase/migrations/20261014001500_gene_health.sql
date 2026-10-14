-- Health information shown as warnings in the genetics calculator.
--   health_note        applies to any animal carrying the gene
--   super_health_note  applies to the super (homozygous) form only
--   super_lethal       the super form is not expected to survive
alter table public.genes
  add column health_note text,
  add column super_health_note text,
  add column super_lethal boolean not null default false;

with v(scientific_name, name, health_note, super_health_note, super_lethal) as (values
  ('Python regius', 'Spider', 'Neurological wobble (head-tracking problems) in Spiders, varying from mild to severe.', null, false),
  ('Python regius', 'Champagne', 'Neurological wobble reported.', null, false),
  ('Python regius', 'Woma', 'Neurological issues reported.', 'Super Woma is reported non-viable.', true),
  ('Python regius', 'Caramel Albino', 'Spinal kinking reported in some lines.', null, false),
  ('Python regius', 'Cinnamon', null, 'Supers are prone to kinks and a "duckbill" head shape.', false),
  ('Python regius', 'Black Pastel', null, 'Supers are prone to kinks and a "duckbill" head shape.', false),
  ('Eublepharis macularius', 'Enigma', 'Enigma syndrome: circling, stargazing and poor coordination, often worsening with stress.', null, false),
  ('Eublepharis macularius', 'White and Yellow', 'Neurological issues reported in some animals.', null, false),
  ('Eublepharis macularius', 'Lemon Frost', 'Prone to iridophoroma (skin tumours).', 'Super Lemon Frosts have an especially high tumour rate.', false),
  ('Correlophus ciliatus', 'Lilly White', null, 'Super Lilly White is lethal.', true),
  ('Correlophus ciliatus', 'Cappuccino', null, 'Frappuccinos (super) commonly have nostril and jaw deformities.', false),
  ('Pogona vitticeps', 'Leatherback', null, 'Silkbacks have almost no scales: prone to skin injury, dehydration and UV sensitivity.', false),
  ('Hemitheconyx caudicinctus', 'Whiteout', null, 'Super Whiteout is reported lethal.', true),
  ('Morelia spilota', 'Jaguar', 'Neurological issues (wobble, poor coordination) are common.', 'The super (Leucistic Jaguar) rarely survives.', true)
)
update public.genes g
set health_note = v.health_note, super_health_note = v.super_health_note, super_lethal = v.super_lethal
from v
join public.species s on s.scientific_name = v.scientific_name
where g.species_id = s.id and g.name = v.name;
