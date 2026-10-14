-- Admins and moderators can remove feature requests.
create policy feature_requests_admin_remove on public.feature_requests for delete to authenticated
  using (private.is_moderator());
