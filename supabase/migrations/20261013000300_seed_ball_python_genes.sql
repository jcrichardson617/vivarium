-- Starter gene list for ball pythons (Python regius).
-- Drafted from general hobby knowledge; every row is verified = false until a human checks it.
-- "incomplete_dominant" is what the hobby calls "co-dominant".

insert into public.genes (species_id, name, inheritance, allelic_group, super_name, aliases, notes)
select s.id, v.name, v.inheritance, v.allelic_group, v.super_name, v.aliases, v.notes
from public.species s
cross join (values
    -- Recessive
    ('Albino',          'recessive', 'albino', null, '{}', null),
    ('Candy',           'recessive', 'albino', null, '{}', 'Allelic to Albino; Candy x Albino gives "Candino".'),
    ('Ultramel',        'recessive', 'albino', null, '{}', 'Reported allelic to Albino.'),
    ('Lavender Albino', 'recessive', null, null, '{}', null),
    ('Caramel Albino',  'recessive', null, null, '{}', 'Known for kinking in some lines.'),
    ('Clown',           'recessive', null, null, '{}', null),
    ('Piebald',         'recessive', null, null, array['Pied']::text[], null),
    ('Hypo',            'recessive', null, null, array['Ghost', 'Orange Ghost']::text[], null),
    ('Desert Ghost',    'recessive', null, null, '{}', null),
    ('Genetic Stripe',  'recessive', null, null, '{}', null),
    ('Monsoon',         'recessive', null, null, '{}', null),
    ('Sunset',          'recessive', null, null, '{}', null),
    ('Axanthic (VPI)',  'recessive', null, null, array['VPI Axanthic']::text[], 'Axanthic lines are not compatible with each other.'),
    ('Axanthic (TSK)',  'recessive', null, null, array['TSK Axanthic']::text[], 'Axanthic lines are not compatible with each other.'),
    ('Axanthic (Jolliff)', 'recessive', null, null, array['Jolliff Axanthic']::text[], 'Axanthic lines are not compatible with each other.'),

    -- Incomplete dominant (co-dominant)
    ('Pastel',          'incomplete_dominant', null, 'Super Pastel', '{}', null),
    ('Enchi',           'incomplete_dominant', null, 'Super Enchi', '{}', null),
    ('Fire',            'incomplete_dominant', null, 'Black Eyed Lucy', '{}', null),
    ('Vanilla',         'incomplete_dominant', null, 'Super Vanilla', '{}', null),
    ('Orange Dream',    'incomplete_dominant', null, 'Super Orange Dream', '{}', null),
    ('Mahogany',        'incomplete_dominant', null, 'Super Mahogany', '{}', null),
    ('Black Pastel',    'incomplete_dominant', 'cinnamon', 'Super Black Pastel', '{}', 'Commonly treated as allelic with Cinnamon.'),
    ('Cinnamon',        'incomplete_dominant', 'cinnamon', 'Super Cinnamon', '{}', 'Commonly treated as allelic with Black Pastel.'),
    ('Mojave',          'incomplete_dominant', 'bel', 'Super Mojave', '{}', 'BEL complex.'),
    ('Lesser',          'incomplete_dominant', 'bel', 'Super Lesser', '{}', 'BEL complex.'),
    ('Butter',          'incomplete_dominant', 'bel', 'Super Butter', '{}', 'BEL complex.'),
    ('Russo',           'incomplete_dominant', 'bel', 'Super Russo', '{}', 'BEL complex.'),
    ('Phantom',         'incomplete_dominant', 'bel', 'Super Phantom', '{}', 'Phantom x Mojave gives "Purple Passion". Verify allelic grouping.'),
    ('Mystic',          'incomplete_dominant', 'bel', 'Super Mystic', '{}', 'Mystic x Mojave gives "Mystic Potion". Verify allelic grouping.'),
    ('Yellow Belly',    'incomplete_dominant', 'yellow_belly', 'Ivory', array['YB']::text[], null),
    ('Gravel',          'incomplete_dominant', 'yellow_belly', 'Highway', '{}', 'Allelic to Yellow Belly.'),
    ('Specter',         'incomplete_dominant', 'yellow_belly', 'Super Specter', '{}', 'Allelic to Yellow Belly.'),
    ('Spotnose',        'incomplete_dominant', null, 'Powerball', '{}', null),
    ('Leopard',         'incomplete_dominant', null, 'Super Leopard', '{}', null),
    ('GHI',             'incomplete_dominant', null, 'Super GHI', '{}', null),
    ('Banana',          'incomplete_dominant', null, 'Super Banana', array['Coral Glow']::text[], 'Sex-linked effects; "male maker" / "female maker" lines.'),
    ('Asphalt',         'incomplete_dominant', null, 'Super Asphalt', '{}', null),
    ('Huffman',         'incomplete_dominant', null, 'Super Huffman', '{}', null),
    ('Woma',            'incomplete_dominant', null, 'Super Woma', '{}', 'Super form reported non-viable; neurological issues reported.'),
    ('Hidden Gene Woma','incomplete_dominant', null, 'Super HGW', array['HGW']::text[], null),
    ('Fader',           'incomplete_dominant', null, 'Super Fader', '{}', null),
    ('Chocolate',       'incomplete_dominant', null, 'Super Chocolate', '{}', null),
    ('Bamboo',          'incomplete_dominant', null, 'Super Bamboo', '{}', null),
    ('Het Red Axanthic','incomplete_dominant', null, 'Super Het Red Axanthic', '{}', 'Despite the name, not recessive.'),
    ('Sable',           'incomplete_dominant', null, 'Super Sable', '{}', null),

    -- Dominant (no distinct super form recognised)
    ('Spider',          'dominant', null, null, '{}', 'Associated with a neurological wobble.'),
    ('Champagne',       'dominant', null, null, '{}', 'Associated with a neurological wobble.'),
    ('Pinstripe',       'dominant', null, null, array['Pin']::text[], null),
    ('Calico',          'dominant', null, null, '{}', null)
) as v(name, inheritance, allelic_group, super_name, aliases, notes)
where s.scientific_name = 'Python regius';
