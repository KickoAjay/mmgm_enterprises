-- ============================================================================
-- MMGM Enterprises — Phase 11: Admin Dashboard
--
-- Almost every RLS policy an admin needs already exists from Phase 2
-- (products/categories/images/inventory/orders/shipments/returns/refunds/
-- reviews/coupons/settings all already have "for all"/update using
-- public.is_admin()). Two genuinely new things:
--
-- 1. admin_users itself had SELECT only (Phase 2's own comment deferred
--    write policies to "Phase 11" by name). Writing an admin_users row
--    requires already being an admin — a bootstrap problem for the very
--    first admin account, since is_admin() is false for everyone until
--    one exists. Solved the standard way: a self-limiting policy that
--    allows exactly one self-insert, and only while the table is
--    completely empty. After the first row exists, that branch is
--    permanently false for everyone; every admin after that is created
--    by an existing admin instead.
-- 2. A public storage bucket for product photography/video — public
--    because these are marketing assets meant to be served to every
--    storefront visitor (unlike Phase 10's private return-evidence
--    bucket), but writes are still admin-only.
-- ============================================================================

create policy "Admins create admin_users" on admin_users
  for insert to authenticated
  with check (public.is_admin());

create policy "First admin can self-bootstrap" on admin_users
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and not exists (select 1 from admin_users)
  );

create policy "Admins update admin_users" on admin_users
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

create policy "Anyone can view product media" on storage.objects
  for select using (bucket_id = 'product-media');

create policy "Admins upload product media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-media' and public.is_admin());

create policy "Admins update product media" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-media' and public.is_admin())
  with check (bucket_id = 'product-media' and public.is_admin());

create policy "Admins delete product media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-media' and public.is_admin());
