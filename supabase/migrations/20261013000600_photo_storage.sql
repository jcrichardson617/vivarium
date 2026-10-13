-- Storage bucket for animal photos. Files live at "<animal_id>/<file name>".
-- The bucket is private; access follows the animal's visibility and ownership.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('animal-photos', 'animal-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- True if the caller currently owns the animal whose id is the object's folder,
-- and that animal is still under its owner's photo limit.
create or replace function private.can_upload_animal_photo(p_object_name text)
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select exists (
        select 1
        from public.animal_ownership ao
        where ao.animal_id::text = split_part(p_object_name, '/', 1)
          and ao.user_id = (select auth.uid())
          and ao.is_current_owner
          and (
              select count(*) from storage.objects o
              where o.bucket_id = 'animal-photos'
                and split_part(o.name, '/', 1) = split_part(p_object_name, '/', 1)
          ) < private.photo_limit(ao.user_id)
    );
$$;

create or replace function private.owns_animal_folder(p_object_name text)
 returns boolean
 language sql
 stable
 security definer
 set search_path = ''
as $$
    select exists (
        select 1 from public.animal_ownership
        where animal_id::text = split_part(p_object_name, '/', 1)
          and user_id = (select auth.uid())
          and is_current_owner
    );
$$;

grant execute on function private.can_upload_animal_photo(text) to anon, authenticated;
grant execute on function private.owns_animal_folder(text) to anon, authenticated;

-- Read: anyone who can see the animal (runs the caller's RLS on animals).
create policy "animal photos readable with animal" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'animal-photos'
    and exists (select 1 from public.animals a where a.id::text = split_part(name, '/', 1))
  );

create policy "animal photos uploadable by owner" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'animal-photos' and private.can_upload_animal_photo(name));

create policy "animal photos updatable by owner" on storage.objects
  for update to authenticated
  using (bucket_id = 'animal-photos' and private.owns_animal_folder(name))
  with check (bucket_id = 'animal-photos' and private.owns_animal_folder(name));

create policy "animal photos deletable by owner" on storage.objects
  for delete to authenticated
  using (bucket_id = 'animal-photos' and private.owns_animal_folder(name));
