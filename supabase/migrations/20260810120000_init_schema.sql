-- ============================================================================
-- YMGM Enterprises — Phase 1 initial schema
--
-- Scope: full table/enum/index/constraint DDL for the saree e-commerce
-- platform described in docs/original-spec.md. This migration does NOT
-- define RLS policies (auth architecture lands in Phase 2) — RLS is enabled
-- on every table now as a safe default-deny, with policies to follow.
--
-- Conventions:
--   - All primary keys are uuid, defaulting to gen_random_uuid().
--   - Every mutable table has updated_at, kept current by set_updated_at().
--   - Fixed-vocabulary columns use Postgres enums, not free text.
--   - Money columns are numeric(10,2); INR is the only currency in scope.
--   - FK on-delete: cascade for owned child rows, restrict where a parent
--     must never disappear out from under historical records (e.g. a
--     product that has been ordered is archived, never hard-deleted).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Shared trigger: keep updated_at current on every row update.
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type product_status as enum (
  'DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'
);

create type order_status as enum (
  'PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'ORDER_CONFIRMED', 'PROCESSING',
  'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
  'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_PICKUP', 'RETURNED',
  'REFUND_INITIATED', 'REFUND_COMPLETED', 'EXCHANGE_REQUESTED'
);

create type payment_status as enum (
  'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'
);

create type return_status as enum (
  'REQUESTED', 'APPROVED', 'REJECTED', 'INFO_REQUESTED',
  'PICKUP_SCHEDULED', 'RETURNED'
);

create type refund_status as enum (
  'REQUESTED', 'APPROVED', 'INITIATED', 'PROCESSING', 'COMPLETED'
);

create type review_status as enum ('PENDING', 'APPROVED', 'REJECTED');

create type coupon_type as enum ('PERCENTAGE', 'FIXED');

create type address_type as enum ('SHIPPING', 'BILLING', 'BOTH');

create type inventory_change_type as enum (
  'RESTOCK', 'SALE', 'ADJUSTMENT', 'RETURN', 'RESERVATION', 'RELEASE'
);

-- ============================================================================
-- Identity & RBAC
-- ============================================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  mobile text unique,
  full_name text,
  profile_image_url text,
  is_email_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on users
  for each row execute function set_updated_at();

create table profiles (
  user_id uuid primary key references users(id) on delete cascade,
  date_of_birth date,
  gender text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();

create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type address_type not null default 'SHIPPING',
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_addresses_user_id on addresses(user_id);
create trigger set_updated_at before update on addresses
  for each row execute function set_updated_at();

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  full_name text not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_admin_users_role_id on admin_users(role_id);
create trigger set_updated_at before update on admin_users
  for each row execute function set_updated_at();

-- seed the 6 admin roles from plan.md §41 (permissions themselves are
-- assigned in Phase 2 alongside the auth/authorization implementation)
insert into roles (name, description) values
  ('SUPER_ADMIN', 'Full access to all admin functionality'),
  ('ADMIN', 'General admin access'),
  ('ORDER_MANAGER', 'Manages orders, shipments, returns, and refunds'),
  ('PRODUCT_MANAGER', 'Manages product catalog and content'),
  ('INVENTORY_MANAGER', 'Manages stock levels and inventory transactions'),
  ('CUSTOMER_SUPPORT', 'Views customers and orders to assist with support');

-- ============================================================================
-- Catalog
-- ============================================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id) on delete set null,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_parent_id on categories(parent_id);
create trigger set_updated_at before update on categories
  for each row execute function set_updated_at();

create table materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table fabrics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex_code text,
  created_at timestamptz not null default now()
);

-- Not in plan.md's literal table list, but Occasion (§18) is a fixed,
-- multi-select filter exactly like Fabric/Pattern/Color, which already get
-- dedicated lookup tables — added here for consistency with that pattern.
create table occasions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  category_id uuid references categories(id) on delete restrict,
  fabric_id uuid references fabrics(id) on delete restrict,
  material_id uuid references materials(id) on delete restrict,
  brand text not null default 'YMGM Enterprises',
  description text,
  short_description text,

  original_price numeric(10, 2) not null check (original_price >= 0),
  selling_price numeric(10, 2) not null check (selling_price >= 0),
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),

  saree_length_meters numeric(5, 2),
  blouse_piece_included boolean not null default false,
  blouse_length_meters numeric(5, 2),
  primary_color_id uuid references colors(id) on delete restrict,
  secondary_color_id uuid references colors(id) on delete restrict,
  pattern_id uuid references patterns(id) on delete restrict,
  design text,
  border_type text,
  border_color text,
  pallu_type text,
  work_type text,
  weave_type text,
  wash_care text,
  country_of_origin text not null default 'India',
  weight_grams numeric(6, 2),

  return_eligible boolean not null default true,
  return_period_days integer not null default 7,

  status product_status not null default 'DRAFT',
  avg_rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_products_selling_price_le_original
    check (selling_price <= original_price)
);
create index idx_products_category_id on products(category_id);
create index idx_products_fabric_id on products(fabric_id);
create index idx_products_pattern_id on products(pattern_id);
create index idx_products_status on products(status);
create trigger set_updated_at before update on products
  for each row execute function set_updated_at();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_images_product_id on product_images(product_id);

create table product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_videos_product_id on product_videos(product_id);

-- Join table backing the multi-select Occasion filter (see `occasions`
-- table note above).
create table product_occasions (
  product_id uuid not null references products(id) on delete cascade,
  occasion_id uuid not null references occasions(id) on delete cascade,
  primary key (product_id, occasion_id)
);

-- ============================================================================
-- Inventory
-- ============================================================================

create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold integer not null default 5,
  is_available boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint chk_inventory_reserved_le_quantity
    check (reserved_quantity <= quantity)
);
create trigger set_updated_at before update on inventory
  for each row execute function set_updated_at();

create table inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  change_type inventory_change_type not null,
  quantity_delta integer not null,
  reason text,
  reference_order_id uuid, -- FK added after `orders` is defined below
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_inventory_transactions_product_id
  on inventory_transactions(product_id);

-- ============================================================================
-- Cart & Wishlist
-- ============================================================================

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- one active cart per signed-in user; guest carts (user_id null) are
-- identified by session_id instead, so no uniqueness constraint there.
create unique index uq_carts_user_id on carts(user_id) where user_id is not null;
create trigger set_updated_at before update on carts
  for each row execute function set_updated_at();

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price_snapshot numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);
create index idx_cart_items_cart_id on cart_items(cart_id);
create trigger set_updated_at before update on cart_items
  for each row execute function set_updated_at();

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- enforces business rule plan.md §56.10: no duplicate wishlist items
  unique (wishlist_id, product_id)
);
create index idx_wishlist_items_wishlist_id on wishlist_items(wishlist_id);

-- ============================================================================
-- Coupons
-- ============================================================================

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type coupon_type not null,
  value numeric(10, 2) not null check (value >= 0),
  min_order_amount numeric(10, 2) not null default 0,
  max_discount_amount numeric(10, 2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  per_user_limit integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on coupons
  for each row execute function set_updated_at();

-- Join tables backing plan.md §35 "Applicable products" / "Applicable
-- categories" per coupon (a many-to-many relationship, not expressible as
-- plain columns on `coupons`).
create table coupon_products (
  coupon_id uuid not null references coupons(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table coupon_categories (
  coupon_id uuid not null references coupons(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (coupon_id, category_id)
);

-- ============================================================================
-- Orders & Payments
-- ============================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references users(id) on delete restrict,
  status order_status not null default 'PENDING_PAYMENT',

  subtotal numeric(10, 2) not null,
  product_discount numeric(10, 2) not null default 0,
  coupon_id uuid references coupons(id) on delete set null,
  coupon_discount numeric(10, 2) not null default 0,
  shipping_fee numeric(10, 2) not null default 0,
  tax_amount numeric(10, 2) not null default 0,
  grand_total numeric(10, 2) not null,

  shipping_address_id uuid references addresses(id) on delete restrict,
  billing_address_id uuid references addresses(id) on delete restrict,

  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user_id on orders(user_id);
create index idx_orders_status on orders(status);
create trigger set_updated_at before update on orders
  for each row execute function set_updated_at();

alter table inventory_transactions
  add constraint fk_inventory_transactions_order
  foreign key (reference_order_id) references orders(id) on delete set null;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  -- restrict, not cascade: a product that has been ordered must never be
  -- hard-deleted — admin "delete" is a soft delete via products.status
  product_id uuid not null references products(id) on delete restrict,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  discount_amount numeric(10, 2) not null default 0,
  line_total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);
create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_product_id on order_items(product_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  note text,
  changed_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_order_status_history_order_id on order_status_history(order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete restrict,
  cashfree_order_id text,
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  status payment_status not null default 'PENDING',
  method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on payments
  for each row execute function set_updated_at();

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  -- unique per Cashfree event so a duplicate webhook delivery cannot be
  -- processed twice, satisfying business rule plan.md §56.9
  cashfree_event_id text not null unique,
  event_type text not null,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);
create index idx_payment_transactions_payment_id
  on payment_transactions(payment_id);

-- ============================================================================
-- Returns, Refunds, Reviews
-- ============================================================================

create table returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete restrict,
  user_id uuid not null references users(id) on delete restrict,
  reason text not null,
  status return_status not null default 'REQUESTED',
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_returns_order_id on returns(order_id);
create trigger set_updated_at before update on returns
  for each row execute function set_updated_at();

create table return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references returns(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_return_items_return_id on return_items(return_id);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  return_id uuid references returns(id) on delete set null,
  order_id uuid not null references orders(id) on delete restrict,
  payment_id uuid not null references payments(id) on delete restrict,
  user_id uuid not null references users(id) on delete restrict,
  amount numeric(10, 2) not null check (amount >= 0),
  status refund_status not null default 'REQUESTED',
  cashfree_refund_id text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_refunds_order_id on refunds(order_id);
create trigger set_updated_at before update on refunds
  for each row execute function set_updated_at();

create table shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  courier_name text,
  tracking_number text,
  estimated_delivery date,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_shipments_order_id on shipments(order_id);
create trigger set_updated_at before update on shipments
  for each row execute function set_updated_at();

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  -- proves verified purchase per plan.md §38/§56.16
  order_item_id uuid not null references order_items(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  image_urls jsonb not null default '[]'::jsonb,
  is_verified_purchase boolean not null default true,
  is_featured boolean not null default false,
  status review_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, order_item_id)
);
create index idx_reviews_product_id on reviews(product_id);
create trigger set_updated_at before update on reviews
  for each row execute function set_updated_at();

create table coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);
create index idx_coupon_usage_coupon_id on coupon_usage(coupon_id);
create index idx_coupon_usage_user_id on coupon_usage(user_id);

-- ============================================================================
-- Notifications, Audit, Settings
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_id on notifications(user_id);

create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references notifications(id) on delete cascade,
  channel text not null,
  status text not null,
  provider_response jsonb,
  created_at timestamptz not null default now()
);
create index idx_notification_logs_notification_id
  on notification_logs(notification_id);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references admin_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_admin_user_id on audit_logs(admin_user_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

create table settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on settings
  for each row execute function set_updated_at();

-- ============================================================================
-- Row Level Security — enabled everywhere now (default-deny); policies are
-- defined in Phase 2 alongside the auth implementation.
-- ============================================================================

do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;
