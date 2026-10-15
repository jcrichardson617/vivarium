-- "Care at a glance" facts for popular species, shown on species pages.
-- Typical values from common keeping practice; seeded unverified like genes.
-- Metric storage: cm, g, °C. hot = basking spot / warm side, cool = cool side
-- (water temperature for aquatic species).
create table public.species_care (
  species_id uuid primary key references public.species(id) on delete cascade,
  length_cm_min numeric, length_cm_max numeric,
  weight_g_min numeric, weight_g_max numeric,
  lifespan_min integer, lifespan_max integer,
  hot_c_min numeric, hot_c_max numeric,
  cool_c_min numeric, cool_c_max numeric,
  night_c_min numeric,
  humidity_min integer, humidity_max integer,
  diet text,
  activity text check (activity in ('diurnal', 'nocturnal', 'crepuscular')),
  habitat text,
  uvb text check (uvb in ('essential', 'recommended', 'optional', 'none')),
  notes text,
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.species_care enable row level security;
create policy species_care_select on public.species_care for select to anon, authenticated using (true);
create policy species_care_write on public.species_care for all to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

with v(sci, lmin, lmax, wmin, wmax, lfmin, lfmax, hmin, hmax, cmin, cmax, nmin, humin, humax, diet, activity, habitat, uvb, notes) as (values
  ('Python regius', 90, 150, 1000, 2500, 20, 30, 31, 33, 24, 27, 22, 55, 75, 'Appropriately sized rodents, usually frozen-thawed', 'nocturnal', 'terrestrial', 'optional', 'Prone to obesity; adults often eat every 2–3 weeks.'),
  ('Pantherophis guttatus', 90, 150, 400, 900, 15, 20, 29, 31, 22, 26, 20, 40, 60, 'Rodents', 'crepuscular', 'terrestrial', 'optional', null),
  ('Eublepharis macularius', 18, 25, 45, 90, 15, 20, 32, 35, 24, 27, 18, 30, 40, 'Insects, gut-loaded and dusted with calcium', 'crepuscular', 'terrestrial', 'recommended', 'Provide a humid hide for shedding. Temperatures are warm-side floor temperatures.'),
  ('Correlophus ciliatus', 18, 22, 35, 55, 15, 20, 24, 27, 21, 24, 18, 50, 80, 'Complete powdered diet plus insects', 'nocturnal', 'arboreal', 'recommended', 'Avoid temperatures above 28 °C (82 °F).'),
  ('Pogona vitticeps', 40, 60, 350, 600, 10, 15, 40, 43, 24, 29, 18, 30, 40, 'Insects and leafy greens; adults eat mostly plants', 'diurnal', 'terrestrial', 'essential', 'Needs strong UVB (e.g. T5 HO) across much of the enclosure.'),
  ('Heterodon nasicus', 40, 90, 60, 800, 15, 20, 32, 34, 24, 27, 20, 30, 50, 'Rodents', 'diurnal', 'terrestrial (burrower)', 'optional', 'Females grow far larger than males.'),
  ('Lampropeltis californiae', 90, 120, 400, 1000, 15, 20, 29, 32, 22, 26, 20, 40, 60, 'Rodents', 'crepuscular', 'terrestrial', 'optional', 'Eats other snakes: always house alone.'),
  ('Boa imperator', 120, 240, 3000, 15000, 20, 30, 31, 33, 24, 27, 22, 55, 70, 'Rodents; rabbits for large adults', 'nocturnal', 'semi-arboreal', 'optional', null),
  ('Morelia spilota', 180, 270, 2000, 5000, 15, 20, 31, 33, 24, 27, 20, 50, 60, 'Rodents', 'nocturnal', 'semi-arboreal', 'optional', null),
  ('Malayopython reticulatus', 300, 600, 15000, 75000, 20, 25, 32, 34, 26, 28, 24, 60, 80, 'Rodents and rabbits; larger prey for big adults', 'nocturnal', 'terrestrial', 'optional', 'Size varies hugely by locality; dwarf locales stay much smaller.'),
  ('Hemitheconyx caudicinctus', 18, 25, 45, 75, 15, 20, 32, 34, 24, 27, 20, 50, 70, 'Insects', 'nocturnal', 'terrestrial', 'recommended', null),
  ('Rhacodactylus auriculatus', 18, 23, 50, 70, 15, 20, 24, 27, 21, 24, 18, 50, 80, 'Complete powdered diet plus insects', 'nocturnal', 'arboreal', 'recommended', null),
  ('Tiliqua scincoides', 45, 60, 300, 600, 15, 20, 38, 41, 24, 27, 20, 40, 60, 'Omnivore: greens, vegetables and protein', 'diurnal', 'terrestrial', 'recommended', null),
  ('Tiliqua gigas', 40, 55, 300, 600, 15, 20, 35, 38, 24, 27, 22, 60, 80, 'Omnivore: greens, vegetables and protein', 'diurnal', 'terrestrial', 'recommended', 'Needs higher humidity than Australian blue tongues.'),
  ('Salvator merianae', 90, 140, 2000, 7000, 15, 20, 43, 49, 24, 27, 21, 60, 80, 'Omnivore: whole prey, eggs, fish and some fruit', 'diurnal', 'terrestrial', 'essential', 'Brumates for several months each winter.'),
  ('Varanus exanthematicus', 75, 120, 2000, 5000, 10, 15, 49, 60, 26, 29, 22, 50, 70, 'Insects, snails and whole prey', 'diurnal', 'terrestrial', 'recommended', 'Basking figures are surface temperatures. Needs deep, diggable substrate.'),
  ('Varanus acanthurus', 60, 70, 200, 450, 15, 20, 60, 65, 26, 29, 21, 40, 60, 'Insects', 'diurnal', 'terrestrial', 'essential', 'Basking figures are surface temperatures. Needs deep substrate for burrowing.'),
  ('Chamaeleo calyptratus', 35, 60, 90, 180, 5, 8, 29, 32, 21, 24, 15, 40, 60, 'Insects', 'diurnal', 'arboreal', 'essential', 'Screen enclosure and daily misting; drinks droplets, not standing water.'),
  ('Furcifer pardalis', 30, 50, 120, 180, 5, 7, 30, 32, 24, 27, 16, 50, 70, 'Insects', 'diurnal', 'arboreal', 'essential', 'Screen enclosure and daily misting; drinks droplets, not standing water.'),
  ('Iguana iguana', 120, 180, 4000, 8000, 15, 20, 35, 40, 26, 29, 24, 60, 80, 'Herbivore: leafy greens and vegetables', 'diurnal', 'arboreal', 'essential', 'Adults need room-sized enclosures.'),
  ('Testudo horsfieldii', 13, 25, 500, 1500, 40, 60, 35, 38, 21, 24, 15, 30, 50, 'Herbivore: weeds and leafy greens, high in fibre', 'diurnal', 'terrestrial', 'essential', 'Length is carapace length.'),
  ('Centrochelys sulcata', 60, 90, 30000, 70000, 50, 80, 35, 38, 26, 29, 21, 40, 60, 'Herbivore: grasses and hay, high in fibre', 'diurnal', 'terrestrial', 'essential', 'Length is carapace length. Adults need a large outdoor space.'),
  ('Trachemys scripta', 15, 30, 300, 1500, 20, 40, 32, 35, 24, 27, null, null, null, 'Omnivore: aquatic pellets, greens, occasional fish and insects', 'diurnal', 'aquatic', 'essential', 'Cool side is water temperature. Length is carapace length.'),
  ('Lampropeltis triangulum', 60, 120, 150, 600, 15, 20, 29, 31, 22, 26, 20, 40, 60, 'Rodents', 'nocturnal', 'terrestrial', 'optional', null),
  ('Lichanura trivirgata', 60, 110, 150, 600, 25, 30, 30, 32, 22, 26, 18, 20, 40, 'Rodents', 'nocturnal', 'terrestrial', 'optional', null),
  ('Ambystoma mexicanum', 20, 30, 60, 200, 10, 15, null, null, 16, 18, null, null, null, 'Worms and sinking pellets', 'nocturnal', 'aquatic', 'none', 'Cool side is water temperature. Water above 21 °C (70 °F) is stressful.'),
  ('Litoria caerulea', 10, 12, 40, 90, 15, 20, 27, 29, 24, 27, 18, 50, 70, 'Insects', 'nocturnal', 'arboreal', 'recommended', null),
  ('Ceratophrys cranwelli', 10, 15, 100, 450, 10, 15, 26, 28, 24, 26, 20, 60, 80, 'Insects; occasional rodents for adults', 'nocturnal', 'terrestrial (burrower)', 'optional', 'Prone to obesity; feed adults sparingly.'),
  ('Gekko gecko', 25, 35, 150, 300, 15, 20, 30, 32, 24, 27, 21, 60, 80, 'Insects', 'nocturnal', 'arboreal', 'recommended', 'Known for a hard, defensive bite.')
)
insert into public.species_care (species_id, length_cm_min, length_cm_max, weight_g_min, weight_g_max, lifespan_min, lifespan_max,
  hot_c_min, hot_c_max, cool_c_min, cool_c_max, night_c_min, humidity_min, humidity_max, diet, activity, habitat, uvb, notes)
select s.id, v.lmin, v.lmax, v.wmin, v.wmax, v.lfmin, v.lfmax, v.hmin, v.hmax, v.cmin, v.cmax, v.nmin, v.humin, v.humax, v.diet, v.activity, v.habitat, v.uvb, v.notes
from v join public.species s on s.scientific_name = v.sci
on conflict (species_id) do nothing;
