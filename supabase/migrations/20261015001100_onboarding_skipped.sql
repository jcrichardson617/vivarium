-- Getting-started steps the keeper chose to skip ('animal', 'enclosure',
-- 'reminder'); 'all' hides the checklist for good.
alter table public.profiles add column onboarding_skipped text[] not null default '{}';
grant update (onboarding_skipped) on public.profiles to authenticated;
