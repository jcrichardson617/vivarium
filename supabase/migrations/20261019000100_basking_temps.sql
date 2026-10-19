-- Basking site temperature alongside hot (warm side) and cool (cool side).
-- Basking is the surface under the heat source, often well above the warm-side air temperature.
alter table public.enclosures add column target_basking_temp_c numeric
  check (target_basking_temp_c is null or target_basking_temp_c between 0 and 80);
alter table public.environment_logs add column temperature_basking_c numeric
  check (temperature_basking_c is null or temperature_basking_c between -10 and 90);
