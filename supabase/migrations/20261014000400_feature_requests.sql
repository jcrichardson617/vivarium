-- Feature requests from signed-in users, reviewed by admins.

create table public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 120),
  details text check (length(details) <= 4000),
  status text not null default 'new' check (status in ('new', 'planned', 'in_progress', 'done', 'declined')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feature_requests_created_idx on public.feature_requests (created_at desc);

alter table public.feature_requests enable row level security;

create policy feature_requests_insert on public.feature_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'new' and admin_notes is null);
create policy feature_requests_select on public.feature_requests for select to authenticated
  using (user_id = (select auth.uid()) or private.is_moderator());
create policy feature_requests_update on public.feature_requests for update to authenticated
  using (private.is_moderator()) with check (private.is_moderator());

-- Admin list: who asked, their email, and a summary of what they keep.
create or replace function public.fn36_feature_requests_admin()
 returns table(
   id uuid, title text, details text, status text, admin_notes text, created_at timestamptz,
   username text, email text, animal_count bigint, species_kept text
 )
 language sql
 stable
 security definer
 set search_path = public
as $$
    select fr.id, fr.title, fr.details, fr.status, fr.admin_notes, fr.created_at,
           p.username, u.email::text,
           (select count(*) from animal_ownership ao where ao.user_id = fr.user_id and ao.is_current_owner),
           (select string_agg(x.label, ', ' order by x.n desc, x.label)
              from (select coalesce(s.common_name, s.scientific_name) || ' (' || count(*) || ')' as label, count(*) as n
                      from animal_ownership ao
                      join animals a on a.id = ao.animal_id
                      join species s on s.id = a.species_id
                     where ao.user_id = fr.user_id and ao.is_current_owner
                     group by s.common_name, s.scientific_name) x)
    from feature_requests fr
    join profiles p on p.id = fr.user_id
    join auth.users u on u.id = fr.user_id
    where private.is_moderator()
    order by fr.created_at desc;
$$;

revoke execute on function public.fn36_feature_requests_admin() from public, anon;
