-- Corrections from a source check of the seeded genes and care facts
-- (MorphMarket Morphpedia, ReptiFiles, PetMD, Guo et al. 2021), then
-- marking the entries that sources confirm as verified. Entries that could
-- not be confirmed stay unverified.

-- Ball python
update public.genes g set health_note = 'Neurological wobble, light to severe.', super_lethal = true,
  super_health_note = 'Super form reported lethal.', notes = 'A separate mutation from Woma.'
from public.species s where s.id = g.species_id and s.common_name = 'Ball python' and g.name = 'Hidden Gene Woma';

update public.genes g set inheritance = 'incomplete_dominant', super_name = 'Super Champagne', super_lethal = true,
  super_health_note = 'Super Champagnes rarely hatch and die soon after.',
  notes = 'Associated with a neurological wobble. Champagne x Spider combinations are widely reported as lethal.'
from public.species s where s.id = g.species_id and s.common_name = 'Ball python' and g.name = 'Champagne';

update public.genes g set super_health_note = 'Powerballs (super) commonly show a neurological wobble.'
from public.species s where s.id = g.species_id and s.common_name = 'Ball python' and g.name = 'Spotnose';

update public.genes g set super_health_note = 'Super Sables are reported to wobble.'
from public.species s where s.id = g.species_id and s.common_name = 'Ball python' and g.name = 'Sable';

update public.genes g set allelic_group = 'yellow_belly', notes = 'Part of the Yellow Belly complex.'
from public.species s where s.id = g.species_id and s.common_name = 'Ball python' and g.name = 'Asphalt';

update public.genes g set super_name = 'Super Fire (Black-Eyed Leucistic)'
from public.species s where s.id = g.species_id and s.common_name = 'Ball python' and g.name = 'Fire';

-- Common boa
update public.genes g set super_health_note = 'Super Motleys are reported as weak and short-lived; IHS bans their sale at its shows.'
from public.species s where s.id = g.species_id and s.common_name = 'Common Boa' and g.name = 'Motley';

-- Crested gecko: Frappuccino is Cappuccino + Lilly White, not the super.
update public.genes g set super_name = 'Super Cappuccino',
  super_health_note = 'Super Cappuccinos often have reduced or missing nostrils, fluid behind the eye spectacle and kinked spines.',
  notes = 'Cappuccino combined with Lilly White is sold as Frappuccino.'
from public.species s where s.id = g.species_id and s.common_name = 'Crested Gecko' and g.name = 'Cappuccino';

-- Leopard gecko: Mack and TUG Snow are alleles (Mack x TUG gives Super Snow).
update public.genes g set allelic_group = 'snow'
from public.species s where s.id = g.species_id and s.common_name = 'Leopard Gecko' and g.name in ('Mack Snow', 'TUG Snow');
update public.genes g set super_name = 'Super Snow', notes = 'Allelic to Mack Snow; Mack x TUG gives Super Snow.'
from public.species s where s.id = g.species_id and s.common_name = 'Leopard Gecko' and g.name = 'TUG Snow';
update public.genes g set notes = 'Genetics unproven; often considered a line of Mack Snow.'
from public.species s where s.id = g.species_id and s.common_name = 'Leopard Gecko' and g.name = 'GEM Snow';

-- Green iguana basking surface.
update public.species_care c set hot_c_min = 38, hot_c_max = 49
from public.species s where s.id = c.species_id and s.common_name = 'Green Iguana';

-- Verified genes.
with fc_gene(species, name) as (values
  ('Ball python', 'Hidden Gene Woma'), ('Ball python', 'Champagne'), ('Ball python', 'Spotnose'), ('Ball python', 'Sable'),
  ('Ball python', 'Fire'), ('Ball python', 'Spider'), ('Ball python', 'Woma'), ('Ball python', 'Cinnamon'),
  ('Ball python', 'Black Pastel'), ('Ball python', 'Caramel Albino'), ('Ball python', 'Desert Ghost'),
  ('Leopard Gecko', 'Tremper Albino'), ('Leopard Gecko', 'Bell Albino'), ('Leopard Gecko', 'Rainwater Albino'),
  ('Leopard Gecko', 'Mack Snow'), ('Leopard Gecko', 'TUG Snow'), ('Leopard Gecko', 'Lemon Frost'),
  ('Leopard Gecko', 'Enigma'), ('Leopard Gecko', 'White and Yellow'),
  ('Crested Gecko', 'Lilly White'), ('Crested Gecko', 'Cappuccino'),
  ('African Fat-tailed Gecko', 'Whiteout'),
  ('Carpet Python', 'Jaguar'), ('Carpet Python', 'Zebra'),
  ('Reticulated Python', 'Motley'),
  ('Common Boa', 'Motley'),
  ('Corn Snake', 'Tessera'), ('Corn Snake', 'Ultra'), ('Corn Snake', 'Amelanistic'), ('Corn Snake', 'Motley'), ('Corn Snake', 'Stripe'),
  ('Bearded Dragon', 'Dunner'), ('Bearded Dragon', 'Zero'), ('Bearded Dragon', 'Witblits'), ('Bearded Dragon', 'Leatherback'))
update public.genes g set verified = true
from public.species s
where s.id = g.species_id
  and (exists (select 1 from fc_gene f where lower(f.species) = lower(s.common_name) and lower(f.name) = lower(g.name))
       -- Ball python albino, BEL and Yellow Belly complexes (Asphalt excepted: moderate confidence).
       or (s.common_name = 'Ball python' and g.allelic_group in ('albino', 'bel', 'yellow_belly') and g.name <> 'Asphalt'));

-- Verified care facts.
update public.species_care c set verified = true
from public.species s
where s.id = c.species_id
  and (s.common_name in ('Bearded Dragon', 'Leopard Gecko', 'Ball python', 'Ackie Monitor', 'Savannah Monitor', 'Green Iguana')
       or s.scientific_name = 'Centrochelys sulcata');
