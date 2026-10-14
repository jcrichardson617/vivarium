-- Morph genes for ten more commonly bred species. Seeded unverified, like the
-- ball python list: review before marking verified. Line-bred (polygenic)
-- traits are left out because the calculator cannot predict them.
-- Genes sharing an allelic_group are alleles of one locus; separate albino
-- strains that are NOT compatible are deliberately left ungrouped.

with v(scientific_name, name, inheritance, allelic_group, super_name, notes) as (values
  -- Leopard gecko
  ('Eublepharis macularius', 'Tremper Albino', 'recessive', null, null, 'Not compatible with Bell or Rainwater albino (crosses produce normals).'),
  ('Eublepharis macularius', 'Bell Albino', 'recessive', null, null, 'Not compatible with Tremper or Rainwater albino.'),
  ('Eublepharis macularius', 'Rainwater Albino', 'recessive', null, null, 'Also sold as Las Vegas albino. Not compatible with Tremper or Bell.'),
  ('Eublepharis macularius', 'Murphy Patternless', 'recessive', null, null, null),
  ('Eublepharis macularius', 'Blizzard', 'recessive', null, null, null),
  ('Eublepharis macularius', 'Eclipse', 'recessive', null, null, 'Visuals have solid or partly black eyes ("snake eyes").'),
  ('Eublepharis macularius', 'Marble Eye', 'recessive', null, null, null),
  ('Eublepharis macularius', 'Noir Desir Black Eye', 'recessive', null, null, null),
  ('Eublepharis macularius', 'Mack Snow', 'incomplete_dominant', null, 'Super Snow', null),
  ('Eublepharis macularius', 'TUG Snow', 'incomplete_dominant', null, 'Super TUG Snow', null),
  ('Eublepharis macularius', 'GEM Snow', 'incomplete_dominant', null, 'Super GEM Snow', null),
  ('Eublepharis macularius', 'Giant', 'incomplete_dominant', null, 'Super Giant', null),
  ('Eublepharis macularius', 'Lemon Frost', 'incomplete_dominant', null, 'Super Lemon Frost', 'Associated with iridophoroma (skin tumours).'),
  ('Eublepharis macularius', 'Enigma', 'dominant', null, null, 'Associated with Enigma syndrome (neurological).'),
  ('Eublepharis macularius', 'White and Yellow', 'dominant', null, null, 'Some reports of neurological issues.'),
  -- Corn snake
  ('Pantherophis guttatus', 'Amelanistic', 'recessive', 'amel', null, 'Amel.'),
  ('Pantherophis guttatus', 'Ultra', 'recessive', 'amel', null, 'Allelic to Amelanistic; Ultra x Amel gives Ultramel.'),
  ('Pantherophis guttatus', 'Anerythristic', 'recessive', null, null, 'Anery (type A).'),
  ('Pantherophis guttatus', 'Charcoal', 'recessive', null, null, 'Anery type B.'),
  ('Pantherophis guttatus', 'Caramel', 'recessive', null, null, null),
  ('Pantherophis guttatus', 'Hypomelanistic', 'recessive', null, null, 'Hypo (type A).'),
  ('Pantherophis guttatus', 'Lavender', 'recessive', null, null, null),
  ('Pantherophis guttatus', 'Diffused', 'recessive', null, null, 'Also called Bloodred.'),
  ('Pantherophis guttatus', 'Motley', 'recessive', 'motley_stripe', null, 'Allelic to Stripe.'),
  ('Pantherophis guttatus', 'Stripe', 'recessive', 'motley_stripe', null, 'Allelic to Motley.'),
  ('Pantherophis guttatus', 'Lava', 'recessive', null, null, null),
  ('Pantherophis guttatus', 'Kastanie', 'recessive', null, null, null),
  ('Pantherophis guttatus', 'Cinder', 'recessive', null, null, null),
  ('Pantherophis guttatus', 'Palmetto', 'recessive', null, null, null),
  ('Pantherophis guttatus', 'Sunkissed', 'recessive', null, null, null),
  ('Pantherophis guttatus', 'Tessera', 'dominant', null, null, null),
  -- Crested gecko
  ('Correlophus ciliatus', 'Lilly White', 'incomplete_dominant', null, 'Super Lilly White', 'Super form is lethal; avoid Lilly White x Lilly White.'),
  ('Correlophus ciliatus', 'Cappuccino', 'incomplete_dominant', null, 'Frappuccino', 'Super form (Frappuccino) linked to health issues.'),
  ('Correlophus ciliatus', 'Sable', 'incomplete_dominant', null, 'Super Sable', null),
  ('Correlophus ciliatus', 'Soft Scale', 'incomplete_dominant', null, 'Super Soft Scale', null),
  ('Correlophus ciliatus', 'Axanthic', 'recessive', null, null, null),
  -- Bearded dragon
  ('Pogona vitticeps', 'Hypomelanistic', 'recessive', null, null, 'Hypo; clear nails.'),
  ('Pogona vitticeps', 'Translucent', 'recessive', null, null, null),
  ('Pogona vitticeps', 'Leatherback', 'incomplete_dominant', null, 'Silkback', 'Silkbacks need extra skin care and UV caution.'),
  ('Pogona vitticeps', 'Witblits', 'recessive', null, null, null),
  ('Pogona vitticeps', 'Zero', 'recessive', null, null, null),
  ('Pogona vitticeps', 'Dunner', 'dominant', null, null, null),
  -- Common boa
  ('Boa imperator', 'Kahl Albino', 'recessive', null, null, 'Not compatible with Sharp Albino.'),
  ('Boa imperator', 'Sharp Albino', 'recessive', null, null, 'Not compatible with Kahl Albino.'),
  ('Boa imperator', 'Anerythristic', 'recessive', null, null, 'Anery type A. Albino + Anery = Snow.'),
  ('Boa imperator', 'Hypo', 'incomplete_dominant', null, 'Super Hypo', 'Also sold as Salmon.'),
  ('Boa imperator', 'Motley', 'incomplete_dominant', null, 'Super Motley', null),
  ('Boa imperator', 'Jungle', 'incomplete_dominant', null, 'Super Jungle', null),
  ('Boa imperator', 'IMG', 'incomplete_dominant', null, 'Super IMG', 'Increasing Melanin Gene.'),
  -- Western hognose
  ('Heterodon nasicus', 'Albino', 'recessive', null, null, null),
  ('Heterodon nasicus', 'Axanthic', 'recessive', null, null, null),
  ('Heterodon nasicus', 'Toffeebelly', 'recessive', null, null, null),
  ('Heterodon nasicus', 'Lavender', 'recessive', null, null, null),
  ('Heterodon nasicus', 'Evans Hypo', 'recessive', null, null, null),
  ('Heterodon nasicus', 'Anaconda', 'incomplete_dominant', null, 'Superconda', null),
  ('Heterodon nasicus', 'Arctic', 'incomplete_dominant', null, 'Super Arctic', null),
  -- California kingsnake
  ('Lampropeltis californiae', 'Albino', 'recessive', null, null, null),
  ('Lampropeltis californiae', 'Hypomelanistic', 'recessive', null, null, null),
  ('Lampropeltis californiae', 'Lavender', 'recessive', null, null, null),
  -- African fat-tailed gecko
  ('Hemitheconyx caudicinctus', 'Amel Albino', 'recessive', null, null, 'Not compatible with Caramel Albino.'),
  ('Hemitheconyx caudicinctus', 'Caramel Albino', 'recessive', null, null, 'Not compatible with Amel Albino.'),
  ('Hemitheconyx caudicinctus', 'Oreo', 'recessive', null, null, null),
  ('Hemitheconyx caudicinctus', 'Patternless', 'recessive', null, null, null),
  ('Hemitheconyx caudicinctus', 'Ghost', 'recessive', null, null, null),
  ('Hemitheconyx caudicinctus', 'Whiteout', 'incomplete_dominant', null, 'Super Whiteout', 'Super form reported lethal.'),
  -- Reticulated python
  ('Malayopython reticulatus', 'Albino', 'recessive', null, null, null),
  ('Malayopython reticulatus', 'Anerythristic', 'recessive', null, null, null),
  ('Malayopython reticulatus', 'Genetic Stripe', 'recessive', null, null, null),
  ('Malayopython reticulatus', 'Tiger', 'incomplete_dominant', null, 'Super Tiger', null),
  ('Malayopython reticulatus', 'Motley', 'incomplete_dominant', null, 'Super Motley', null),
  ('Malayopython reticulatus', 'Platinum', 'incomplete_dominant', null, 'Super Platinum', null),
  ('Malayopython reticulatus', 'Sunfire', 'incomplete_dominant', null, 'Super Sunfire', null),
  -- Carpet python
  ('Morelia spilota', 'Jaguar', 'incomplete_dominant', null, 'Leucistic Jaguar', 'Jaguar is linked to neurological issues; the super form is usually not viable.'),
  ('Morelia spilota', 'Zebra', 'incomplete_dominant', null, 'Super Zebra', null),
  ('Morelia spilota', 'Albino', 'recessive', null, null, null),
  ('Morelia spilota', 'Axanthic', 'recessive', null, null, null),
  ('Morelia spilota', 'Caramel', 'recessive', null, null, null)
)
insert into public.genes (species_id, name, inheritance, allelic_group, super_name, notes, verified)
select s.id, v.name, v.inheritance, v.allelic_group, v.super_name, v.notes, false
from v
join public.species s on s.scientific_name = v.scientific_name
where not exists (select 1 from public.genes g where g.species_id = s.id and lower(g.name) = lower(v.name));
