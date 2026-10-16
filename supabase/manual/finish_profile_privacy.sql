-- Stage 2 of migrations/20261016000600_profile_privacy.sql.
-- Run AFTER the app version that reads settings through fn72_my_profile is
-- deployed (older app code reads role, plan, units etc. straight from profiles
-- and would stop seeing them). Stage 1, already applied, hid email_token and
-- the email timestamps. Paste into Supabase Dashboard -> SQL Editor -> Run.

revoke select on public.profiles from anon, authenticated;
grant select (id, username, display_name, created_at) on public.profiles to anon, authenticated;

-- Check: only these four columns should come back true.
select a.attname, has_column_privilege('anon', 'public.profiles', a.attname, 'SELECT') as public_can_read
from pg_attribute a
where a.attrelid = 'public.profiles'::regclass and a.attnum > 0 and not a.attisdropped
order by a.attnum;
