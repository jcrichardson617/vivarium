-- Fix: inside the subquery, the bare "name" resolved to animals.name instead of
-- the storage object's path, so no photo was ever readable. Qualify it.
-- (Animals RLS still decides which animals, and therefore photos, are visible.)
alter policy "animal photos readable with animal" on storage.objects
  using (
    bucket_id = 'animal-photos'
    and exists (select 1 from public.animals a where a.id::text = split_part(objects.name, '/', 1))
  );
