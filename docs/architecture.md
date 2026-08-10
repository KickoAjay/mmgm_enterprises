# MMGM Enterprises — Architecture & Design System (Phase 1)

Source spec: [`docs/original-spec.md`](./original-spec.md). This document is
the Phase 1 deliverable required by that spec's §62 — architecture and
design system, produced before any feature implementation. Companion
reference: [`docs/database-schema.md`](./database-schema.md).

## 1. System Architecture

```mermaid
flowchart LR
  Browser["Browser\n(Customer / Admin)"]
  Vercel["Next.js on Vercel\n(App Router, Server Actions, API Routes)"]
  Supa["Supabase\nPostgreSQL"]
  Storage["Supabase Storage\n(product images/video)"]
  Cashfree["Cashfree Payments\n(sandbox / live)"]
  Email["Email Provider\n(transactional)"]

  Browser -->|HTTPS| Vercel
  Vercel -->|SQL via server-side client| Supa
  Vercel -->|upload/serve| Storage
  Vercel -->|create order/session,\nverify payment| Cashfree
  Cashfree -->|webhook| Vercel
  Vercel -->|order/refund/tracking emails| Email
```

All business logic, price/discount/tax calculation, and payment
verification happens server-side (Server Actions / API Routes). The browser
never computes final amounts or marks payments successful — see spec §23,
§28, §56.

## 2. Technology Stack

| Layer           | Choice                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------- |
| Frontend        | Next.js 16 (App Router), TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Framer Motion |
| Backend         | Next.js Server Actions / API Routes                                                      |
| Database        | PostgreSQL via Supabase                                                                  |
| Payments        | Cashfree Payments (sandbox now, live credentials later)                                  |
| Storage         | Supabase Storage                                                                         |
| Hosting         | Vercel                                                                                   |
| Package manager | pnpm                                                                                     |

## 3. Folder Structure

```
src/
  app/
    layout.tsx, globals.css
    (store)/                  # route group — shared storefront layout, no URL prefix
      layout.tsx, page.tsx
    admin/                    # real /admin URL prefix — Phase 11
    api/                      # Cashfree webhook etc. — Phase 8/9
  components/
    ui/                       # shadcn components
    store/, admin/
  features/
    products/ cart/ wishlist/ checkout/ orders/
    payments/ returns/ refunds/ inventory/ customers/
  lib/
    auth/ db/ cashfree/ email/ storage/
  services/ validations/ types/ hooks/ utils/
supabase/
  migrations/                 # SQL schema migrations
docs/
  architecture.md (this file), database-schema.md, original-spec.md
```

Every `features/*` and `lib/*` module currently contains only a `README.md`
stub naming its target implementation phase (per spec §62's "work
module-by-module" instruction) — see each file for scope.

## 4. Database Architecture

- UUID primary keys (`gen_random_uuid()`), FKs, indexes on all FKs, unique
  constraints on natural keys (slugs, SKUs, emails, order numbers, coupon
  codes).
- Fixed vocabularies (order/payment/return/refund/product/review status,
  coupon type, address type, inventory change type) are Postgres enums, not
  free text.
- Every mutable table has `updated_at`, kept current via a shared
  `set_updated_at()` trigger.
- Row Level Security is **enabled on every table now** as a safe
  default-deny; policies are written in Phase 2 alongside authentication.
- FK delete semantics: `cascade` for owned child rows (e.g.
  `product_images` ← `products`), `restrict` where history must survive a
  parent's removal (e.g. `order_items.product_id` — a sold product is
  archived via `products.status = 'ARCHIVED'`, never hard-deleted).
- Duplicate-prevention business rules are enforced at the database level
  where possible: unique `(wishlist_id, product_id)` (spec §56.10), unique
  `cashfree_event_id` on `payment_transactions` for idempotent webhooks
  (spec §56.9), unique `(user_id, order_item_id)` on `reviews` (verified
  purchase only, spec §56.16).

Full details: [`docs/database-schema.md`](./database-schema.md) and
[`supabase/migrations/20260810120000_init_schema.sql`](../supabase/migrations/20260810120000_init_schema.sql).

## 5. Database ERD

Split into readable clusters rather than one 41-entity diagram.

### 5a. Identity & RBAC

```mermaid
erDiagram
  USERS ||--o| PROFILES : has
  USERS ||--o{ ADDRESSES : has
  USERS ||--o| ADMIN_USERS : "may be"
  ROLES ||--o{ ADMIN_USERS : assigned
  ROLES ||--o{ ROLE_PERMISSIONS : has
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : granted_via
```

### 5b. Catalog

```mermaid
erDiagram
  CATEGORIES ||--o{ CATEGORIES : "parent of"
  CATEGORIES ||--o{ PRODUCTS : contains
  FABRICS ||--o{ PRODUCTS : "made of"
  MATERIALS ||--o{ PRODUCTS : "made of"
  PATTERNS ||--o{ PRODUCTS : has
  COLORS ||--o{ PRODUCTS : "primary/secondary color of"
  PRODUCTS ||--o{ PRODUCT_IMAGES : has
  PRODUCTS ||--o{ PRODUCT_VIDEOS : has
  PRODUCTS ||--o{ PRODUCT_OCCASIONS : tagged
  OCCASIONS ||--o{ PRODUCT_OCCASIONS : tags
```

### 5c. Inventory

```mermaid
erDiagram
  PRODUCTS ||--|| INVENTORY : "stock level"
  PRODUCTS ||--o{ INVENTORY_TRANSACTIONS : "history"
  ORDERS ||--o{ INVENTORY_TRANSACTIONS : "may reference"
```

### 5d. Cart & Wishlist

```mermaid
erDiagram
  USERS ||--o| CARTS : owns
  CARTS ||--o{ CART_ITEMS : contains
  PRODUCTS ||--o{ CART_ITEMS : "referenced by"
  USERS ||--|| WISHLISTS : owns
  WISHLISTS ||--o{ WISHLIST_ITEMS : contains
  PRODUCTS ||--o{ WISHLIST_ITEMS : "referenced by"
```

### 5e. Orders & Payments

```mermaid
erDiagram
  USERS ||--o{ ORDERS : places
  ADDRESSES ||--o{ ORDERS : "ships/bills to"
  COUPONS ||--o{ ORDERS : "applied to"
  ORDERS ||--o{ ORDER_ITEMS : contains
  PRODUCTS ||--o{ ORDER_ITEMS : "referenced by"
  ORDERS ||--o{ ORDER_STATUS_HISTORY : logs
  ORDERS ||--|| PAYMENTS : "paid via"
  PAYMENTS ||--o{ PAYMENT_TRANSACTIONS : "webhook events"
```

### 5f. Returns, Refunds, Reviews, Coupons, Notifications, Settings

```mermaid
erDiagram
  ORDERS ||--o{ RETURNS : "may have"
  RETURNS ||--o{ RETURN_ITEMS : contains
  ORDER_ITEMS ||--o{ RETURN_ITEMS : "referenced by"
  RETURNS ||--o{ REFUNDS : "may trigger"
  PAYMENTS ||--o{ REFUNDS : "refunded from"
  ORDERS ||--o| SHIPMENTS : "tracked via"
  PRODUCTS ||--o{ REVIEWS : receives
  ORDER_ITEMS ||--o{ REVIEWS : "proves purchase"
  COUPONS ||--o{ COUPON_PRODUCTS : "applies to"
  COUPONS ||--o{ COUPON_CATEGORIES : "applies to"
  COUPONS ||--o{ COUPON_USAGE : redeemed
  USERS ||--o{ NOTIFICATIONS : receives
  NOTIFICATIONS ||--o{ NOTIFICATION_LOGS : "delivery log"
```

## 6. Saree Product Schema

| Field                           | SQL column                                            | Type                                                          |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| Product Name                    | `name`                                                | text                                                          |
| SKU                             | `sku`                                                 | text, unique                                                  |
| Category                        | `category_id`                                         | uuid FK                                                       |
| Fabric                          | `fabric_id`                                           | uuid FK                                                       |
| Material                        | `material_id`                                         | uuid FK                                                       |
| Brand                           | `brand`                                               | text                                                          |
| Description / Short Description | `description`, `short_description`                    | text                                                          |
| Original / Selling Price        | `original_price`, `selling_price`                     | numeric(10,2)                                                 |
| Discount Amount                 | `discount_amount`                                     | numeric(10,2) — discount % computed at write time, not stored |
| Stock / Min Stock               | `inventory.quantity`, `inventory.low_stock_threshold` | separate `inventory` table                                    |
| Saree Length                    | `saree_length_meters`                                 | numeric(5,2)                                                  |
| Blouse Piece Included / Length  | `blouse_piece_included`, `blouse_length_meters`       | boolean, numeric(5,2)                                         |
| Primary / Secondary Color       | `primary_color_id`, `secondary_color_id`              | uuid FK                                                       |
| Pattern / Design                | `pattern_id`, `design`                                | uuid FK, text                                                 |
| Border Type / Color             | `border_type`, `border_color`                         | text                                                          |
| Pallu Type                      | `pallu_type`                                          | text                                                          |
| Occasion                        | via `product_occasions` join                          | many-to-many                                                  |
| Work / Weave Type               | `work_type`, `weave_type`                             | text                                                          |
| Wash Care                       | `wash_care`                                           | text                                                          |
| Country of Origin               | `country_of_origin`                                   | text                                                          |
| Weight                          | `weight_grams`                                        | numeric(6,2)                                                  |
| Images / Video                  | `product_images`, `product_videos`                    | separate tables                                               |
| Return Eligibility / Period     | `return_eligible`, `return_period_days`               | boolean, integer                                              |
| Product Status                  | `status`                                              | enum: DRAFT/ACTIVE/OUT_OF_STOCK/ARCHIVED                      |

## 7. Authentication Architecture (implemented in Phase 2)

```mermaid
flowchart LR
  A[Customer submits\nlogin/register form] --> B[Supabase Auth]
  B -->|session cookie| C[src/proxy.ts\nrefreshes session every request]
  B -->|AFTER INSERT trigger| D[public.users / public.profiles\nmirror auth identity]
  E[Server Component /\nServer Action] -->|getCurrentUser / requireUser| B
  E --> F{admin_users row\nlinked to this user?}
  F -->|yes| G[requireAdmin — broad check now,\nfine-grained roles in Phase 11]
  F -->|no| H[Treat as customer]
```

Implementation:

- `src/lib/db/client.ts` / `server.ts` — anon-key Supabase clients (browser /
  Server Component & Action), subject to RLS.
- `src/lib/db/service.ts` — service-role client that bypasses RLS; used only
  for server-computed writes (orders, payments, webhooks, guest carts) —
  never imported into a Client Component.
- `src/proxy.ts` (Next.js 16's `middleware` → `proxy` convention) calls
  `updateSession()` on every request to keep the session cookie fresh —
  required because Server Components can't write cookies themselves.
- `supabase/migrations/20260810130000_phase2_auth_and_rls.sql` — an
  `AFTER INSERT ON auth.users` trigger mirrors new signups into
  `public.users`/`public.profiles`, and an `AFTER UPDATE` trigger flips
  `users.is_email_verified` once Supabase confirms the email.
- Pages: `/register`, `/login`, `/forgot-password`, `/reset-password`,
  `/verify-email`, plus `/auth/callback` (exchanges the PKCE code from
  Supabase's email links for a session). Forms use React's
  `useActionState` bound directly to Server Actions in
  `src/lib/auth/actions.ts`. Validation: `src/validations/auth.ts` (Zod).
- `src/lib/auth/session.ts` — `getCurrentUser()`, `requireUser()`,
  `getAdminMembership()`, `requireAdmin()`.
- Google OAuth (spec §25, optional) is deferred — email/password only for
  now.

RBAC role resolution happens server-side on every admin request — never
trust a client-supplied role. Google OAuth is deferred (spec §25 lists it
as optional); email/password is the only method wired up in Phase 2.

## 8. Admin RBAC

Six roles (seeded in the Phase 1 migration): `SUPER_ADMIN`, `ADMIN`,
`ORDER_MANAGER`, `PRODUCT_MANAGER`, `INVENTORY_MANAGER`,
`CUSTOMER_SUPPORT`. Phase 2 wires up a broad `public.is_admin()` /
`requireAdmin()` check (any active `admin_users` row); per-role permission
enforcement (`role_permissions`) is refined in Phase 11 when the admin
dashboard is built.

| Role              | Primary scope                                       |
| ----------------- | --------------------------------------------------- |
| SUPER_ADMIN       | Everything, including managing other admin accounts |
| ADMIN             | General admin access                                |
| ORDER_MANAGER     | Orders, shipments, returns, refunds                 |
| PRODUCT_MANAGER   | Product catalog, images, categories                 |
| INVENTORY_MANAGER | Stock levels, inventory transactions                |
| CUSTOMER_SUPPORT  | Read-only customers/orders for support              |

Permissions must be enforced server-side on every admin Server
Action/API Route — never rely on frontend role checks alone (spec §41).

## 9. Cashfree Payment Architecture

```mermaid
sequenceDiagram
  participant C as Customer
  participant S as Server (Next.js)
  participant CF as Cashfree
  C->>S: Submit checkout
  S->>S: Create order (server-side, PENDING_PAYMENT)
  S->>CF: Create payment session
  CF-->>S: Session details
  S-->>C: Redirect/render Cashfree checkout
  C->>CF: Complete payment
  CF-->>C: Payment result
  CF->>S: Webhook (payment event)
  S->>S: Verify signature, verify payment server-side
  S->>S: Update payment status
  S->>S: Confirm order, update inventory
  S->>C: Send confirmation (email)
```

Never mark a payment successful from the frontend alone — the webhook +
server-side verification is authoritative (spec §28, §56.7). Duplicate
webhook deliveries are made idempotent via the unique `cashfree_event_id`
constraint on `payment_transactions` (spec §56.9).

Environment variables (placeholders only until credentials are available):
`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_API_URL`,
`CASHFREE_WEBHOOK_SECRET` — never exposed to the browser.

## 10. Order Lifecycle

```mermaid
stateDiagram-v2
  [*] --> PENDING_PAYMENT
  PENDING_PAYMENT --> PAYMENT_CONFIRMED
  PAYMENT_CONFIRMED --> ORDER_CONFIRMED
  ORDER_CONFIRMED --> PROCESSING
  PROCESSING --> PACKED
  PACKED --> SHIPPED
  SHIPPED --> OUT_FOR_DELIVERY
  OUT_FOR_DELIVERY --> DELIVERED
  PENDING_PAYMENT --> CANCELLED
  ORDER_CONFIRMED --> CANCELLED
  DELIVERED --> RETURN_REQUESTED
  RETURN_REQUESTED --> RETURN_APPROVED
  RETURN_APPROVED --> RETURN_PICKUP
  RETURN_PICKUP --> RETURNED
  RETURNED --> REFUND_INITIATED
  REFUND_INITIATED --> REFUND_COMPLETED
  DELIVERED --> EXCHANGE_REQUESTED
```

Every transition is recorded in `order_status_history` (spec §56.12).

## 11. Return / Refund Lifecycle

```mermaid
stateDiagram-v2
  [*] --> REQUESTED
  REQUESTED --> APPROVED
  REQUESTED --> REJECTED
  REQUESTED --> INFO_REQUESTED
  INFO_REQUESTED --> APPROVED
  INFO_REQUESTED --> REJECTED
  APPROVED --> PICKUP_SCHEDULED
  PICKUP_SCHEDULED --> RETURNED
```

```mermaid
stateDiagram-v2
  [*] --> REQUESTED
  REQUESTED --> APPROVED
  APPROVED --> INITIATED
  INITIATED --> PROCESSING
  PROCESSING --> COMPLETED
```

Refund amount can never exceed the eligible amount (spec §56.14) — enforced
at the service layer in a later phase, since it depends on order-item-level
proration, not a simple column check.

## 12. Tracking Lifecycle

Customer-facing `/track-order` (Phase 9) looks up an order by order number

- registered mobile/email and renders the same status timeline as the order
  lifecycle above (Order Placed → Payment Confirmed → Order Confirmed →
  Processing → Packed → Shipped → Out for Delivery → Delivered), sourced from
  `order_status_history` plus `shipments.courier_name` /
  `shipments.tracking_number`.

## 13. Vercel Deployment Architecture

```mermaid
flowchart LR
  Git[Git push] --> Vercel[Vercel build\npnpm install && pnpm build]
  Vercel --> Edge[Edge/Serverless\nFunctions]
  Edge --> Supa[(Supabase)]
  Edge --> CF[Cashfree]
  EnvVars[Environment Variables\nSupabase + Cashfree secrets] -.-> Vercel
```

The project must build cleanly with `pnpm build` and have no local-only
dependencies (spec §54). Secrets live in Vercel environment variables, never
committed — see `.env.example`.

## 14. UI Design System

Design tokens are implemented as real Tailwind v4 `@theme` values in
[`src/app/globals.css`](../src/app/globals.css) — not just documentation.
shadcn/ui's semantic tokens (`background`, `foreground`, `primary`, etc.)
are overridden with the palette below; additional `--color-brand-*` tokens
expose the secondary fashion accents as Tailwind utilities (e.g.
`bg-brand-emerald`). Radius is kept modest (`0.375rem`) per spec §57's
warning against "excessive rounded" UI.

## 15. Color System

| Token                   | Hex       | Usage                                   |
| ----------------------- | --------- | --------------------------------------- |
| Background              | `#FFFFFF` | Page background                         |
| Primary Text            | `#171717` | Body/heading text                       |
| Secondary Text          | `#666666` | Metadata, muted text                    |
| Border                  | `#EAEAEA` | Dividers, card borders                  |
| Soft Background         | `#F7F7F5` | Section backgrounds, secondary surfaces |
| Brand Accent (Burgundy) | `#7A1830` | Primary CTA, links, focus ring          |

Secondary fashion accents (curated defaults — not specified as exact hex
values in the spec, adjust once real brand assets exist), used **sparingly**
on banners/badges/promo sections only:

| Name           | Hex       |
| -------------- | --------- |
| Rose           | `#B76E79` |
| Dusty Pink     | `#D8A7B1` |
| Emerald        | `#0B6E4F` |
| Mustard        | `#C9A227` |
| Terracotta     | `#B5502D` |
| Plum           | `#5B2A5E` |
| Champagne Gold | `#C9A66B` |

## 16. Typography System

- **Manrope** — UI/body text (`font-sans`), via `next/font/google`.
- **Fraunces** — sparing elegant serif for editorial headings (`font-serif`
  / `font-heading`), used on hero and section headings only.
- Two families max, per spec §5.
- Editorial scale: `--text-hero` (clamps 2.25rem → 3.75rem),
  `--text-section` (clamps 1.5rem → 2.25rem), plus `--text-price` and
  `--text-meta` for consistent product-card typography in later phases.

## 17. Responsive Strategy

- Mobile-first Tailwind breakpoints.
- Product grids: 4 columns desktop, 3 tablet, 2 mobile (spec §10).
- Mobile header: hamburger + logo + search + wishlist + cart (spec §6).
- Mobile shop page: sticky filter/sort controls, filter drawer instead of a
  sidebar (spec §17, §46).
- Mobile experiences are designed intentionally per breakpoint in later
  phases, not simply shrunk from desktop (spec §46).

## 18. Homepage + Navigation (implemented in Phase 3)

- `src/components/store/header.tsx` — announcement bar (rotating messages,
  `announcement-bar.tsx`) that scrolls away, then a `sticky top-0` main row
  (logo, desktop nav from `nav-links.ts`, search/wishlist/account/cart
  icons). Account icon is auth-aware via `getCurrentUser()`. Mobile uses a
  full-screen drawer (`mobile-nav.tsx`) behind a hamburger button.
- `src/components/store/footer.tsx` — multi-column footer (Shop, Customer
  Care, Policies, Follow Us, contact, payment methods) per spec §51.
- Both are wired into `src/app/(store)/layout.tsx`, so every route in that
  group (home, auth pages, and future shop/cart/account pages) shares them.
- Homepage sections (`src/app/(store)/page.tsx` composing
  `src/components/store/home/*`): hero banner, Shop by Category, Trending
  Now (horizontal scroll), 5 editorial banners (Silk/Wedding/Festive/
  Handloom/Everyday Elegance edits), New Arrivals + Best Sellers grids, and
  an Offers section — matching spec §7–§13.
- **No real product/category photography exists yet.** Every image slot
  (`MediaPlaceholder`, `src/components/store/media-placeholder.tsx`) renders
  a deterministic brand-colored gradient tile instead of a photo or a
  mismatched stock image — the same seed (e.g. a product slug) always gets
  the same gradient. Swap in real photography via `product_images.url` /
  `categories.image_url` once available; no code changes needed beyond
  replacing the placeholder with an `<Image>`.
- Product data comes from `src/features/products/queries.ts`
  (`getNewArrivals`, `getBestSellers`, `getTrendingNow`,
  `getShopByCategoryTiles`) — public, RLS-governed reads via the anon
  client, not the service-role client. "Best Sellers"/"Trending" fall back
  to rating/recency ordering since there's no real order history yet.
- Demo catalog data (spec §55) is seeded via
  [`supabase/seed.sql`](../supabase/seed.sql) — 8 categories, 9 fabrics, 6
  materials, 13 patterns, 16 colors, 6 occasions, and 12 realistic demo
  sarees (no lorem ipsum, no images). Re-run it (or the equivalent
  service-role inserts) against any fresh project.
- Wishlist/cart buttons on product cards are visual-only until Phase 6;
  nav links to not-yet-built routes (`/shop`, `/sarees`, `/cart`, etc.) 404
  until their respective phases — expected during phased development.
