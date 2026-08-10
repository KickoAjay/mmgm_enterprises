-- ============================================================================
-- MMGM Enterprises — Phase 2: identity mirror + Row Level Security policies
--
-- Part A mirrors Supabase Auth's `auth.users` into this app's own
-- `public.users` / `public.profiles` tables (defined in the Phase 1
-- migration), keeping `public.users.id = auth.users.id`.
--
-- Part B replaces the Phase 1 default-deny RLS stance with real policies.
--
-- Design decisions (see docs/architecture.md §7/§8 for the full writeup):
--   - `public.is_admin()` is a broad "any active admin_users row" check,
--     used as a defense-in-depth backstop on top of application-level RBAC.
--     Fine-grained per-role policies (SUPER_ADMIN vs PRODUCT_MANAGER, etc.)
--     are refined in Phase 11 when the admin dashboard is actually built —
--     spec §41 requires permissions to be enforced server-side in the admin
--     UI/actions regardless, RLS is the backstop, not the primary gate.
--   - Money-affecting tables (orders, order_items, payments, refunds, ...)
--     have no client-side insert/update policy for regular users: all
--     writes happen through Server Actions using a service-role client, so
--     totals/discounts/tax are always server-computed (spec §56). Customers
--     only get read access to their own rows.
--   - Guest (unauthenticated) carts — identified by `carts.session_id`
--     rather than `user_id` — are not covered by client-side RLS policies,
--     since there is no `auth.uid()` to check against. Guest cart mutations
--     go through a Server Action using the service-role client (Phase 6).
--   - `inventory` (exact stock counts) and `coupons` (redeemable codes) are
--     admin-only tables; customer-facing availability/coupon-validation
--     reads happen server-side via the service-role client, not direct
--     client queries, so exact quantities and unredeemed codes are never
--     exposed to the browser.
-- ============================================================================

-- ============================================================================
-- Part A — mirror auth.users into public.users / public.profiles
-- ============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, is_email_verified)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;

  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_email_verified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.users
    set is_email_verified = true
    where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row execute function public.handle_auth_user_email_verified();

-- ============================================================================
-- Part B — Row Level Security policies
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid() and au.is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Identity & RBAC
-- ---------------------------------------------------------------------------

create policy "Users view own record" on users
  for select using (id = auth.uid() or public.is_admin());
create policy "Users update own record" on users
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins update any user" on users
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Users view own profile" on profiles
  for select using (user_id = auth.uid() or public.is_admin());
create policy "Users update own profile" on profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins update any profile" on profiles
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Users manage own addresses" on addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Admins view roles" on roles
  for select using (public.is_admin());
create policy "Admins view permissions" on permissions
  for select using (public.is_admin());
create policy "Admins view role_permissions" on role_permissions
  for select using (public.is_admin());
create policy "Admins view admin_users" on admin_users
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Catalog — public read for shoppable data, admin-only writes
-- ---------------------------------------------------------------------------

create policy "Public can view categories" on categories
  for select using (true);
create policy "Admins manage categories" on categories
  for insert with check (public.is_admin());
create policy "Admins update categories" on categories
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete categories" on categories
  for delete using (public.is_admin());

create policy "Public can view materials" on materials for select using (true);
create policy "Admins manage materials" on materials for insert with check (public.is_admin());
create policy "Admins update materials" on materials for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete materials" on materials for delete using (public.is_admin());

create policy "Public can view fabrics" on fabrics for select using (true);
create policy "Admins manage fabrics" on fabrics for insert with check (public.is_admin());
create policy "Admins update fabrics" on fabrics for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete fabrics" on fabrics for delete using (public.is_admin());

create policy "Public can view patterns" on patterns for select using (true);
create policy "Admins manage patterns" on patterns for insert with check (public.is_admin());
create policy "Admins update patterns" on patterns for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete patterns" on patterns for delete using (public.is_admin());

create policy "Public can view colors" on colors for select using (true);
create policy "Admins manage colors" on colors for insert with check (public.is_admin());
create policy "Admins update colors" on colors for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete colors" on colors for delete using (public.is_admin());

create policy "Public can view occasions" on occasions for select using (true);
create policy "Admins manage occasions" on occasions for insert with check (public.is_admin());
create policy "Admins update occasions" on occasions for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete occasions" on occasions for delete using (public.is_admin());

create policy "Public can view active products" on products
  for select using (status = 'ACTIVE' or public.is_admin());
create policy "Admins manage products" on products
  for insert with check (public.is_admin());
create policy "Admins update products" on products
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products" on products
  for delete using (public.is_admin());

create policy "Public can view images of visible products" on product_images
  for select using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and (p.status = 'ACTIVE' or public.is_admin())
    )
  );
create policy "Admins manage product_images" on product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can view videos of visible products" on product_videos
  for select using (
    exists (
      select 1 from products p
      where p.id = product_videos.product_id
        and (p.status = 'ACTIVE' or public.is_admin())
    )
  );
create policy "Admins manage product_videos" on product_videos
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can view occasion tags of visible products" on product_occasions
  for select using (
    exists (
      select 1 from products p
      where p.id = product_occasions.product_id
        and (p.status = 'ACTIVE' or public.is_admin())
    )
  );
create policy "Admins manage product_occasions" on product_occasions
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Inventory — admin-only; customer-facing availability reads happen
-- server-side via the service-role client (see header note above).
-- ---------------------------------------------------------------------------

create policy "Admins manage inventory" on inventory
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins view inventory_transactions" on inventory_transactions
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Cart & Wishlist — owner-only
-- ---------------------------------------------------------------------------

create policy "Users manage own cart" on carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage own cart items" on cart_items
  for all using (
    exists (select 1 from carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

create policy "Users manage own wishlist" on wishlists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage own wishlist items" on wishlist_items
  for all using (
    exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid())
  )
  with check (
    exists (select 1 from wishlists w where w.id = wishlist_items.wishlist_id and w.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Orders & Payments — read-only for customers; all writes are server-side
-- (Server Actions using the service-role client), never direct client writes.
-- ---------------------------------------------------------------------------

create policy "Users view own orders" on orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins update orders" on orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Users view own order items" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_items.order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );

create policy "Users view own order status history" on order_status_history
  for select using (
    exists (select 1 from orders o where o.id = order_status_history.order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "Admins insert order status history" on order_status_history
  for insert with check (public.is_admin());

create policy "Users view own payments" on payments
  for select using (
    exists (select 1 from orders o where o.id = payments.order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );

create policy "Admins view payment_transactions" on payment_transactions
  for select using (public.is_admin());

create policy "Users view own shipments" on shipments
  for select using (
    exists (select 1 from orders o where o.id = shipments.order_id
            and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "Admins manage shipments" on shipments
  for insert with check (public.is_admin());
create policy "Admins update shipments" on shipments
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Returns & Refunds
-- ---------------------------------------------------------------------------

create policy "Users view own returns" on returns
  for select using (user_id = auth.uid() or public.is_admin());
create policy "Users create own return requests" on returns
  for insert with check (user_id = auth.uid());
create policy "Admins update returns" on returns
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Users view own return items" on return_items
  for select using (
    exists (select 1 from returns r where r.id = return_items.return_id
            and (r.user_id = auth.uid() or public.is_admin()))
  );
create policy "Users create own return items" on return_items
  for insert with check (
    exists (select 1 from returns r where r.id = return_items.return_id and r.user_id = auth.uid())
  );

create policy "Users view own refunds" on refunds
  for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage refunds" on refunds
  for insert with check (public.is_admin());
create policy "Admins update refunds" on refunds
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reviews — public can see approved reviews; verified-purchase-only insert
-- ---------------------------------------------------------------------------

create policy "Reviews are visible when approved or own or admin" on reviews
  for select using (status = 'APPROVED' or user_id = auth.uid() or public.is_admin());

create policy "Users create own verified-purchase reviews" on reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from order_items oi
      join orders o on o.id = oi.order_id
      where oi.id = reviews.order_item_id and o.user_id = auth.uid()
    )
  );

create policy "Users update own pending reviews" on reviews
  for update using (user_id = auth.uid() and status = 'PENDING')
  with check (user_id = auth.uid());
create policy "Admins moderate reviews" on reviews
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Users delete own reviews" on reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Coupons — admin-only; validation/application happens server-side
-- (Phase 7 checkout) via the service-role client, so unredeemed codes are
-- never enumerable from the browser.
-- ---------------------------------------------------------------------------

create policy "Admins manage coupons" on coupons
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage coupon_products" on coupon_products
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage coupon_categories" on coupon_categories
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Users view own coupon_usage" on coupon_usage
  for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Notifications, Audit, Settings
-- ---------------------------------------------------------------------------

create policy "Users view own notifications" on notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy "Users mark own notifications read" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Admins view notification_logs" on notification_logs
  for select using (public.is_admin());

create policy "Admins view audit_logs" on audit_logs
  for select using (public.is_admin());

create policy "Admins manage settings" on settings
  for all using (public.is_admin()) with check (public.is_admin());
