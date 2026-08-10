# Database Schema — Human-Readable Reference

This is a companion reference to the authoritative DDL in
[`supabase/migrations/20260810120000_init_schema.sql`](../supabase/migrations/20260810120000_init_schema.sql).
If the two ever disagree, the migration file is correct — update this doc to match.

41 tables total: the 37 named explicitly in `docs/original-spec.md` §40, plus
4 additions (`occasions`, `product_occasions`, `coupon_products`,
`coupon_categories`) added for consistency with the spec's own
normalization pattern — Fabric/Pattern/Color already get dedicated lookup
tables, and Occasion/coupon-applicability need the same treatment.

All tables use `uuid` primary keys (`gen_random_uuid()`), `timestamptz`
timestamps, and Row Level Security is enabled on every table (policies land
in Phase 2). See the migration file's header comment for full conventions.

## Identity & RBAC

| Table              | Purpose                    | Key columns                                                           |
| ------------------ | -------------------------- | --------------------------------------------------------------------- |
| `users`            | Customer accounts          | `email` (unique), `mobile` (unique), `is_email_verified`, `is_active` |
| `profiles`         | 1:1 extension of `users`   | `user_id` (PK/FK), `date_of_birth`, `gender`                          |
| `addresses`        | Shipping/billing addresses | `user_id`, `type`, `pincode`, `is_default`                            |
| `roles`            | Admin roles                | `name` (unique) — seeded with the 6 roles from spec §41               |
| `permissions`      | Permission codes           | `code` (unique)                                                       |
| `role_permissions` | Role → permission join     | composite PK `(role_id, permission_id)`                               |
| `admin_users`      | Staff accounts             | `user_id` (unique FK), `role_id`, `is_active`                         |

## Catalog

| Table                                                     | Purpose                                              | Key columns                                                |
| --------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `categories`                                              | Saree categories, self-referencing for subcategories | `slug` (unique), `parent_id`                               |
| `materials`, `fabrics`, `patterns`, `colors`, `occasions` | Filter/attribute lookup tables                       | `name` (unique each)                                       |
| `products`                                                | The saree catalog — full schema from spec §16        | `sku`/`slug` (unique), pricing, saree attributes, `status` |
| `product_images`                                          | Product photos                                       | `product_id`, `is_primary`, `sort_order`                   |
| `product_videos`                                          | Product videos                                       | `product_id`, `sort_order`                                 |
| `product_occasions`                                       | Multi-select Occasion tagging (join)                 | composite PK `(product_id, occasion_id)`                   |

`products` columns map directly to spec §16: `sku`, `category_id`,
`fabric_id`, `material_id`, `brand`, `description`, `short_description`,
`original_price`, `selling_price`, `discount_amount` (percentage computed at
write time, not stored redundantly), `saree_length_meters`,
`blouse_piece_included`, `blouse_length_meters`, `primary_color_id`,
`secondary_color_id`, `pattern_id`, `design`, `border_type`, `border_color`,
`pallu_type`, `work_type`, `weave_type`, `wash_care`, `country_of_origin`,
`weight_grams`, `return_eligible`, `return_period_days`, `status`.

## Inventory

| Table                    | Purpose                   | Key columns                                                                      |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------- |
| `inventory`              | Current stock per product | `product_id` (unique FK), `quantity`, `reserved_quantity`, `low_stock_threshold` |
| `inventory_transactions` | Stock change audit trail  | `change_type` enum, `quantity_delta`, `reference_order_id`                       |

## Cart & Wishlist

| Table            | Purpose                                                        | Key columns                                           |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `carts`          | One per signed-in user (partial unique index) or guest session | `user_id` (nullable), `session_id`                    |
| `cart_items`     | Line items                                                     | unique `(cart_id, product_id)`, `unit_price_snapshot` |
| `wishlists`      | One per user                                                   | `user_id` (unique FK)                                 |
| `wishlist_items` | DB-enforced no-duplicates (spec §56.10)                        | unique `(wishlist_id, product_id)`                    |

## Orders & Payments

| Table                  | Purpose                                                                          | Key columns                                           |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `orders`               | `order_status` enum, all 16 values from spec §29                                 | `order_number` (unique), `status`, totals breakdown   |
| `order_items`          | Line items, `product_id` FK is `restrict` (never hard-delete an ordered product) | snapshot fields for name/SKU                          |
| `order_status_history` | Every status transition (spec §56.12)                                            | `order_id`, `status`, `changed_by`                    |
| `payments`             | One per order                                                                    | `order_id` (unique FK), `cashfree_order_id`, `status` |
| `payment_transactions` | Raw webhook payloads, unique `cashfree_event_id` for idempotency (spec §56.9)    | `payment_id`, `raw_payload`                           |

## Returns, Refunds, Reviews, Coupons

| Table                                  | Purpose                                       | Key columns                                                                  |
| -------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| `returns`                              | Return request lifecycle                      | `order_id`, `status`, `reason`                                               |
| `return_items`                         | Which order items, with photos                | `return_id`, `order_item_id`, `image_urls`                                   |
| `refunds`                              | Linked to order/payment/customer per spec §37 | `amount`, `status`                                                           |
| `shipments`                            | Courier/tracking info                         | `order_id`, `tracking_number`, `estimated_delivery`                          |
| `reviews`                              | Verified-purchase only (spec §38/§56.16)      | unique `(user_id, order_item_id)`, `order_item_id` proves purchase           |
| `coupons`                              | Discount rules                                | `code` (unique), `type`, `min_order_amount`, `usage_limit`, `per_user_limit` |
| `coupon_products`, `coupon_categories` | Per-coupon applicability (join tables)        | composite PKs                                                                |
| `coupon_usage`                         | Redemption tracking                           | unique `(coupon_id, order_id)`                                               |

## Notifications, Audit, Settings

| Table               | Purpose                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `notifications`     | In-app/user-facing notifications                                      |
| `notification_logs` | Delivery log per channel (email/SMS/push)                             |
| `audit_logs`        | Admin action trail — `action`, `entity_type`, `entity_id`, `metadata` |
| `settings`          | Key/value app settings (`key` unique, `value` jsonb)                  |
