-- ============================================================================
-- MMGM Enterprises — Phase 7: guest checkout support
--
-- Spec §27 step 1 is "Login / Guest Checkout", and Phase 6 already built
-- guest cart support anticipating this — but the Phase 1 schema made
-- orders.user_id and addresses.user_id NOT NULL, which blocks a real guest
-- order. This migration makes both nullable and adds guest contact columns
-- to orders, so a guest's order/address rows simply have no user_id
-- (never surfaced in a logged-in "my addresses"/"my orders" list, which
-- already query by user_id).
--
-- coupon_usage.user_id is made nullable too, so guest orders can still
-- count against a coupon's global usage_limit — per-user-limit just isn't
-- enforceable for guests without an account, which the application layer
-- already treats as "skip that one check for guests", not a schema
-- concern.
-- ============================================================================

alter table orders alter column user_id drop not null;
alter table orders add column guest_email text;
alter table orders add column guest_phone text;
alter table orders add constraint chk_orders_user_or_guest
  check (user_id is not null or guest_email is not null);

alter table addresses alter column user_id drop not null;

alter table coupon_usage alter column user_id drop not null;
