-- Store every measurement in metric, with the unit in the column name.
-- Apps convert for display using the user's unit_system. All affected tables
-- were empty when this ran, so no values needed converting.

-- ============================================================================
-- User preferences
-- ============================================================================

alter table public.profiles
  -- ISO 3166-1 alpha-2, e.g. 'US', 'CA', 'GB'.
  add column country text check (country ~ '^[A-Z]{2}$'),
  -- Null means "derive from country": imperial for US, metric otherwise.
  add column unit_system text check (unit_system in ('metric', 'imperial'));

grant update (country, unit_system) on public.profiles to authenticated;

-- ============================================================================
-- Rename columns to metric names
-- ============================================================================

alter table public.enclosures rename column length_inches to length_cm;
alter table public.enclosures rename column width_inches to width_cm;
alter table public.enclosures rename column height_inches to height_cm;
alter table public.enclosures rename column target_hot_temp to target_hot_temp_c;
alter table public.enclosures rename column target_cool_temp to target_cool_temp_c;
alter table public.enclosures rename column target_humidity to target_humidity_pct;

alter table public.environment_logs rename column temperature_hot to temperature_hot_c;
alter table public.environment_logs rename column temperature_cool to temperature_cool_c;
alter table public.environment_logs rename column humidity to humidity_pct;

alter table public.incubation_logs rename column temperature to temperature_c;
alter table public.incubation_logs rename column humidity to humidity_pct;

alter table public.hatchlings rename column hatch_weight to hatch_weight_g;

-- Views keep their old output names after a column rename; update those too.
alter view public.enclosure_detail_view rename column length_inches to length_cm;
alter view public.enclosure_detail_view rename column width_inches to width_cm;
alter view public.enclosure_detail_view rename column height_inches to height_cm;
alter view public.enclosure_detail_view rename column target_hot_temp to target_hot_temp_c;
alter view public.enclosure_detail_view rename column target_cool_temp to target_cool_temp_c;
alter view public.enclosure_detail_view rename column target_humidity to target_humidity_pct;

alter view public.breeding_metrics_view rename column avg_incubation_temp to avg_incubation_temp_c;
alter view public.breeding_metrics_view rename column avg_incubation_humidity to avg_incubation_humidity_pct;

-- ============================================================================
-- Sanity ranges (metric)
-- ============================================================================

alter table public.enclosures
  add constraint enclosures_dimensions_positive
    check (coalesce(length_cm, 1) > 0 and coalesce(width_cm, 1) > 0 and coalesce(height_cm, 1) > 0),
  add constraint enclosures_temps_plausible
    check (coalesce(target_hot_temp_c, 25) between 0 and 70 and coalesce(target_cool_temp_c, 25) between 0 and 70),
  add constraint enclosures_humidity_pct
    check (target_humidity_pct is null or target_humidity_pct between 0 and 100);

alter table public.environment_logs
  add constraint environment_logs_temps_plausible
    check (coalesce(temperature_hot_c, 25) between -10 and 80 and coalesce(temperature_cool_c, 25) between -10 and 80),
  add constraint environment_logs_humidity_pct
    check (humidity_pct is null or humidity_pct between 0 and 100);

alter table public.incubation_logs
  add constraint incubation_logs_temp_plausible check (temperature_c is null or temperature_c between 10 and 45),
  add constraint incubation_logs_humidity_pct check (humidity_pct is null or humidity_pct between 0 and 100);

alter table public.weight_logs
  add constraint weight_logs_positive check (weight_grams is null or weight_grams > 0) not valid;
alter table public.length_logs
  add constraint length_logs_positive check (length_cm > 0) not valid;
