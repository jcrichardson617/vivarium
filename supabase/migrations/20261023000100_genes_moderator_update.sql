-- Let moderators edit and verify genes from Admin → Genes.
create policy genes_update on public.genes for update to authenticated
  using (private.is_moderator()) with check (private.is_moderator());
