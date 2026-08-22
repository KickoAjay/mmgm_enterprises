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
  nav links to not-yet-built routes (`/cart`, `/account/wishlist`, product
  detail pages, etc.) 404 until their respective phases — expected during
  phased development. `/shop` and `/sarees` are real as of Phase 4 (§19).

## 19. Saree Catalog + Search + Filters (implemented in Phase 4)

- `/sarees` (`src/app/(store)/sarees/page.tsx`) is the single canonical
  catalog implementation; `/shop` is a thin redirect that preserves query
  params (spec §17 requires both routes to exist, without further
  distinguishing them). All nav/footer links to either route work.
- Filter/sort/search state lives entirely in the URL — `q`, `category`,
  `fabric`, `color`, `pattern`, `occasion` (comma-separated multi-select),
  `price`, `discount`, `availability`, `sort`, `page`. Every filter renders
  as a plain `<Link>` (`src/components/store/catalog/filter-sidebar.tsx`)
  built by `src/features/products/catalog-url.ts` — shareable/bookmarkable
  URLs, and filtering works without client JS except the Sort `<select>`
  (`catalog-sort.tsx`, the one genuinely interactive control) and the
  mobile filter drawer (`mobile-filter-drawer.tsx`, a client wrapper around
  the same server-rendered `FilterSidebar`).
- Query building (`src/features/products/catalog.ts`, `getCatalogPage`):
  - Fabric/pattern are plain `.in()` filters; Color matches primary OR
    secondary color via `.or()`; Occasion is a many-to-many join
    (`product_occasions`) resolved to product IDs first.
  - Search (`q`) matches spec §20's own "red silk" example: free-text
    ilike against name/description/SKU, **plus** resolving each word
    against fabric/color/pattern/category names and matching products by
    those IDs. Autocomplete, recent searches, and trending searches are
    explicitly deferred — out of scope for this phase.
  - Discount filter and "Biggest Discount" sort use a new
    `products.discount_percent` **generated column** (Phase 4 migration)
    rather than computing percentages per row in application code.
  - Availability filter/badges route through a new SECURITY DEFINER RPC,
    `get_product_availability(uuid[])`, rather than selecting from
    `inventory` directly (still admin-only per Phase 2's RLS). Because
    availability isn't a filterable column on `products`, that filter uses
    a capped candidate-fetch-then-JS-filter approach instead of DB-level
    pagination — documented as a scale caveat in the code, fine at this
    catalog's size.
- `docs/database-schema.md` and the Phase 1 migration file predate
  `discount_percent` and `get_product_availability` — see
  `supabase/migrations/20260810140000_phase4_catalog.sql` for both.

## 20. Cart + Wishlist (implemented in Phase 6, ahead of Phase 5)

Built directly on the `ProductCard`s already live on the homepage/catalog
(Quick Add, wishlist heart) — Phase 5's product detail pages don't exist
yet, but cart/wishlist don't depend on them.

- **Guest carts are real carts**, not deferred to login. `carts` has both
  `user_id` (unique, logged-in) and `session_id` (guest) — Phase 2's RLS
  only covers `user_id = auth.uid()`, so guest cart reads/writes go
  through the service-role client instead, keyed by an httpOnly
  `mmgm_cart_session` cookie
  (`src/features/cart/cart-session.ts`). Splits into
  `getCartContext()` (read-only, Server Component safe, never writes a
  cookie — Next.js forbids that outside a Server Action) and
  `getOrCreateCartContext()` (Server Action only, creates the cart/cookie
  on first add).
  - Known gap: no guest→user cart merge on login yet — a guest who adds
    items then logs in gets a fresh, empty user cart. Worth fixing before
    Phase 7 (Checkout) if guest checkout is expected to convert accounts
    mid-flow.
- **Cart totals are always computed from the live `products` row**, never
  `cart_items.unit_price_snapshot` (spec §56.3) — the snapshot exists only
  as a future "price changed since you added this" reference, unused so
  far. Discount/shipping/tax are Phase 7's concern; the cart page shows
  subtotal only.
- **Stock enforcement** (spec §56.1/§56.2): `addToCartAction` /
  `updateCartItemQuantityAction` read `inventory` through the service-role
  client (still admin-only for direct browser reads) and clamp the
  requested quantity to what's actually available, returning a message
  rather than silently failing.
- **Cross-cart-item ownership check**: because guest mutations use the
  service-role client (bypasses RLS), `updateCartItemQuantityAction` /
  `removeCartItemAction` verify the target `cart_items` row actually
  belongs to the caller's own resolved `cartId` before touching it —
  otherwise nothing would stop one guest session from mutating another's
  cart item by guessing/observing an ID. Redundant-but-harmless for
  logged-in carts, where RLS already enforces the same thing.
- **Wishlist requires an account** (spec §24 lives under
  `/account/wishlist`) — `toggleWishlistAction` returns
  `{ requiresLogin: true }` for signed-out callers, and the client-side
  `WishlistButton` redirects to `/login` on that response. No-duplicates
  (spec §56.10) is enforced by the DB's unique `(wishlist_id, product_id)`
  constraint, not just application logic.
- **Wishlist heart state on listing pages is not prefetched** — checking
  per-product membership on every card across the homepage/catalog would
  mean an extra query per card, everywhere. `WishlistButton` starts
  unfilled and reflects the real state once toggled; `/account/wishlist`
  itself is always accurate since it's the source of truth.
- Server Actions call `revalidatePath("/", "layout")` after any
  cart/wishlist mutation so the Header's cart-count badge
  (`getCartItemCount()`) and the /cart, /account/wishlist pages themselves
  stay in sync — no client-side refetching needed.

## 21. Product Details (implemented in Phase 5, after Phase 6)

`/sarees/[slug]` (`src/app/(store)/sarees/[slug]/page.tsx`), built after
cart/wishlist since neither depends on it, and product cards already
linked here throughout Phases 3/4/6.

- `src/features/products/detail.ts` — `getProductDetail(slug)` resolves
  every FK (category, fabric, material, primary/secondary color, pattern,
  occasions) to display names via the same lookup-query pattern as
  elsewhere (no embedded selects); `getSimilarProducts` (same category,
  falling back to same fabric); `getProductReviews` (approved only).
- **Gallery**: no real photography exists yet, so `ProductGallery` falls
  back to a single `MediaPlaceholder` with no thumbnail strip — showing
  several identical placeholder "photos" would be dishonest. The real
  multi-image/thumbnail/hover-swap experience (spec §15) activates
  automatically once `product_images` rows exist; `next.config.ts` now
  pre-allows `**.supabase.co` in `images.remotePatterns` so that doesn't
  silently break when it happens.
- **Reviews show no reviewer name** — RLS only lets a customer read their
  own `users` row, not other reviewers', and there's no public-safe
  display name to join against. Shows a "Verified Buyer" badge instead
  (every review is a verified purchase by definition, spec §56.16). No
  review submission form yet either — that needs a real `order_item_id`
  from a completed order, which doesn't exist until Phase 7+9.
- **Delivery pincode check** (`delivery-actions.ts`) validates format and
  returns a generic estimate — there's no courier/serviceability
  integration anywhere in this project's phases. Not a stand-in for real
  order tracking (spec §30), which comes from admin-entered shipment data.
- **Recently Viewed** is pure client-side (`localStorage`, no
  `recently_viewed` table in the schema) — reads/writes a capped list on
  mount, no server round trip. Prices shown are a snapshot from when each
  product was last viewed, not live.
- `ProductCarousel` (used for New Arrivals's sibling "Trending Now" on the
  homepage) moved from `components/store/home/` to `components/store/`
  now that Similar Sarees reuses it too.
- Buy Now adds to cart then redirects straight to `/checkout` (updated once
  Phase 7 shipped it).

## 22. Checkout (implemented in Phase 7)

`/checkout` (`src/app/(store)/checkout/page.tsx`) → `placeOrderAction`
creates a real `PENDING_PAYMENT` order and redirects into the Phase 8
payment flow at `/checkout/pay/[orderId]`.

- **Guest checkout required a schema fix.** Phase 1 made `orders.user_id`
  and `addresses.user_id` `NOT NULL`, which silently blocks the guest
  checkout spec §27 step 1 explicitly calls for — and Phase 6 already
  built guest cart support anticipating it. Migration
  `20260810150000_phase7_guest_checkout.sql` (**must be run in the
  Supabase SQL Editor**, same as every prior DDL change) makes both
  nullable, adds `orders.guest_email`/`guest_phone` with a
  `chk_orders_user_or_guest` check, and makes `coupon_usage.user_id`
  nullable so a guest order still counts against a coupon's global
  `usage_limit` (just not `per_user_limit`, which is skipped for guests —
  there's no account to track it against).
- **All writes go through the service-role client**
  (`src/features/checkout/actions.ts`), consistent with the RLS design
  from Phase 2: `orders`/`order_items`/`payments`/`coupon_usage` have no
  client-insert policy at all, by design — every total is server-computed,
  never trusted from the client (spec §56.3).
- **Order confirmation is read via an unguessable order ID, not RLS.** A
  guest order has no `auth.uid()` for the existing "Users view own
  orders" policy to match, so `getOrderConfirmation` reads with the
  service-role client, and the order's UUID in the URL is the access
  token — the same pattern most checkout confirmation pages use
  (generated once, never listed, effectively unguessable). Logged-in
  users' own order history is a `/account` page for a later phase, scoped
  by RLS as normal.
- **Pricing** (`src/features/checkout/pricing.ts`): free shipping ≥ ₹999
  (matches the sitewide announcement-bar copy from Phase 3), else a flat
  ₹99 shipping fee; GST modelled as a flat 5% rather than India's real
  HSN-slab textile schedule (5%/12% by unit price) — an intentional
  simplification, not an attempt at a tax engine.
- **Coupons** (`src/features/checkout/coupon.ts`): validates code, active
  flag, date window, `min_order_amount`, `usage_limit`, and
  `per_user_limit` server-side, re-checked again at final order placement
  (never trusts the client-side "Apply" preview). Per-product/category
  coupon scoping (`coupon_products`/`coupon_categories`, tables exist but
  unused) and the admin coupon management UI are Phase 12's job — every
  coupon here applies storewide. One demo coupon is seeded: `WELCOME10`
  (10% off, min ₹999, capped at ₹500).
- **Inventory is not touched at order creation.** `getCartSummary`'s
  availability check (boolean, from the Phase 4 RPC) blocks checkout if
  any line is out of stock, but `inventory.quantity`/`reserved_quantity`
  aren't decremented or reserved here — that happens on payment
  confirmation (Phase 8's `confirm_order_payment` SQL function). Reserving
  stock on every `PENDING_PAYMENT` order with no expiry/release mechanism
  would lock inventory indefinitely for orders that never pay; deferring
  to payment success is the standard pattern.
- Address forms don't yet offer a saved-address picker (`/account`
  addresses book UI doesn't exist) — every checkout collects a fresh
  address, saved as an orphaned `addresses` row (`user_id` set for
  logged-in users, but not linked into any "my addresses" list yet).

## 23. Cashfree Integration (implemented in Phase 8)

Built with **no live Cashfree credentials in this environment** —
`.env.local` only had the sandbox API URL placeholder, `CASHFREE_APP_ID`/
`CASHFREE_SECRET_KEY`/`CASHFREE_WEBHOOK_SECRET` were empty. The user chose
to have this written and typechecked against Cashfree's documented API
shape now, untested against a live sandbox, rather than pause the build.
**Re-verify every field/header name against the current Cashfree
dashboard/docs the first time real credentials are added** (spec §28
explicitly calls for using current official docs) — treat this
integration as reviewed-not-verified until that pass happens.

Flow (matches the spec §28 diagram exactly):

```
placeOrderAction (Phase 7)          → orders row PENDING_PAYMENT,
                                       payments row PENDING with
                                       cashfree_order_id = order_number
  ↓ redirect
/checkout/pay/[orderId]              → createCashfreeOrder() or reuse an
                                        existing ACTIVE session
  ↓ renders
CashfreeCheckout (client)            → loads Cashfree's hosted checkout
                                        JS SDK, redirects to Cashfree
  ↓ customer pays, Cashfree redirects back
/checkout/pay/[orderId]/return       → server-to-server status check,
                                        confirmPayment() if PAID
  ↓ (also, independently, whenever Cashfree sends it)
/api/webhooks/cashfree                → verifies signature, confirmPayment()
  ↓
/checkout/confirmation/[orderId]      → shows the confirmed order
```

- **`confirmPayment()` is the single source of truth**
  (`src/features/payments/confirm.ts`), and both the return page and the
  webhook call it with the same arguments. It's a thin wrapper around
  `confirm_order_payment(p_cashfree_order_id, p_cashfree_payment_id)`, a
  `SECURITY DEFINER` SQL function (migration
  `20260810160000_phase8_payments.sql`, **must be run in the Supabase SQL
  Editor**) that does everything — mark the payment `SUCCESS`, move the
  order to `ORDER_CONFIRMED`, write both `order_status_history` rows, and
  decrement `inventory.quantity` + write `inventory_transactions` — inside
  one transaction with `select ... for update` on the order row. That's
  what makes it safe for the return page and the webhook to race each
  other (spec §56.9 "duplicate webhooks must not create duplicate
  orders", §56.8 "inventory must update safely"): whichever call arrives
  first does the work, the second sees `status <> 'PENDING_PAYMENT'` and
  exits as a no-op. Only `service_role` can execute the function — revoked
  from `PUBLIC`, since it marks payments as paid.
- **Webhook idempotency has a second layer**: `payment_transactions.
cashfree_event_id` is unique, and the webhook route
  (`src/app/api/webhooks/cashfree/route.ts`) derives that id as a SHA-256
  hash of the raw request body — a retried delivery resends identical
  bytes, hashes to the same id, and the insert fails before any side
  effect runs. (Cashfree may also send a dedicated event-id header; using
  a content hash instead avoids depending on a header name that couldn't
  be confirmed without live traffic to inspect.)
- **Signature verification** (`src/lib/cashfree/webhook.ts`) reads the
  _raw_ request body via `request.text()` before any JSON parsing —
  computing the HMAC over a re-serialized `JSON.parse` result can silently
  produce different bytes than what Cashfree signed, which would make
  verification flaky in a way that's hard to notice locally.
- **Order creation is resumable, not re-triggered blindly.**
  `/checkout/pay/[orderId]` first does a `GET` on the Cashfree order for
  `order_number`; if it's already `ACTIVE` with a `payment_session_id`,
  that session is reused (page refresh, back button) instead of calling
  `POST /orders` again.
- **Graceful degradation with no credentials configured**:
  `isCashfreeConfigured()` gates the payment page — right now it always
  renders the "online payment isn't connected yet" fallback instead of
  attempting a Cashfree API call that would just fail. This is what makes
  Phase 7's checkout flow still fully clickable end-to-end today.
- Cashfree's checkout UI is loaded from `sdk.cashfree.com` via
  `next/script` — this is Cashfree's actual PCI-compliant hosted payment
  page, not something reproducible via an npm package, and is what their
  own integration docs direct you to load.

## 24. Resend Email Integration

"SEND CONFIRMATION", the last step of the spec §28 flow diagram, initially
shipped with Phase 8 as a no-op (no email provider was configured). The
user connected a real Resend account and asked for the full transactional
email set, pulling several notification types forward from their
originally-planned Phase 13.

**Live-verified against the real Resend account** (not just typechecked):
a direct API call confirmed the API key works and that
`mmgmenterprises.com` is **not yet verified** in Resend — sending from
`orders@mmgmenterprises.com` returns a 403 (`domain not verified`).
`EMAIL_FROM` is set back to the sandbox address
(`onboarding@resend.dev`) accordingly; a live test send through it
succeeded. Sandbox mode only delivers to the Resend account's own
registered email address — a different address than the one the sends
were tested to reach — until a domain is verified (§24d).

### 24a. Shared building blocks

- `src/lib/email/client.ts` — `sendEmail()`, the only place that calls the
  Resend SDK. `isEmailConfigured()` gates every caller. `from` is never a
  parameter — always the fixed `EMAIL_FROM`, never chosen by a caller.
  Validates `to` with `zod`'s `z.email()` before attempting a send.
  Never throws; returns `{ success, error? }`.
- `src/lib/email/log.ts` — `logEmailDelivery()`, shared by every email
  caller. Every send attempt gets a `notifications` row (parent) and a
  `notification_logs` row (`channel: "email"`, `status: "SENT" | "FAILED"`)
  regardless of outcome — nothing is silently lost.
- `src/lib/email/templates/shared.ts` — `emailShell()`, `summaryRow()`,
  `ctaButton()`, `escapeHtml()`, `formatEmailDate()` (IST-formatted). One
  wrapper so five templates read as one consistent brand, not five one-off
  designs — inline styles only, since email clients strip `<style>`
  blocks unpredictably.

### 24b. Templates and what triggers them

| Template                            | Sent from                                       | Trigger                                                                        |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `templates/test-email.ts`           | `POST /api/send-email`                          | Manual, dev-only (§24c)                                                        |
| `templates/welcome.ts`              | `src/lib/auth/notify.ts`                        | `signUpAction` (`src/lib/auth/actions.ts`), right after `auth.signUp` succeeds |
| `templates/order-confirmation.ts`   | `src/features/payments/notify.ts`               | `confirmPayment()` "confirmed" transition                                      |
| `templates/payment-confirmation.ts` | `src/features/payments/notify.ts`               | same, alongside order confirmation                                             |
| `templates/admin-new-order.ts`      | `src/features/payments/notify.ts`               | same, only if `ADMIN_NOTIFICATION_EMAIL` is set                                |
| `templates/order-status-update.ts`  | `sendOrderStatusUpdateNotification()` (unwired) | **nothing yet** — see §24e                                                     |

`sendOrderConfirmedNotifications(orderId, cashfreePaymentId)`
(`src/features/payments/notify.ts`) is the single entry point for the
three payment-time emails: one `getOrderConfirmation` fetch, fanned out
to customer-order-confirmation, customer-payment-confirmation, and
admin-alert via `Promise.all` (each independently try/caught so one
failing send doesn't cancel the others). `confirmPayment()`
(`src/features/payments/confirm.ts`) calls it exactly once, only on the
`"confirmed"` return value from `confirm_order_payment()` — never on
`"already_confirmed"`. That's what stops the payment-return-page/webhook
race (§23) from double-sending, and it's inherited automatically by all
three emails since they share that one call site. Awaited, not
fire-and-forget — a detached promise can get killed once a serverless
function's response is sent (this deploys to Vercel, §13).

Payment confirmation emails never include card numbers, CVV, or other raw
payment-instrument data — this app never touches card data at all,
Cashfree's hosted checkout does; only amount/status/ids are shown.

### 24c. Test route

`POST /api/send-email` (`src/app/api/send-email/route.ts`) — body
`{ "to": "you@example.com" }`, sends the fixed test-email template.
Not a general-purpose "send any email" endpoint: subject/body are fixed,
`to` is the only caller-supplied field (zod-validated), and `from` still
always comes from `EMAIL_FROM` inside `sendEmail()`. Gated by
`NODE_ENV !== "production"` rather than admin auth — there's no admin
panel/`admin_users` row set up in this environment yet to gate it behind
(that's a later phase), so the environment check is what keeps this from
becoming an open relay once deployed. Returns 404 outright in production.

### 24d. Connecting a real domain (when ready)

1. In the Resend dashboard → Domains → Add Domain, enter
   `mmgmenterprises.com` (or whichever domain will send this mail).
2. Resend generates the exact DNS records to add (SPF/DKIM as TXT/CNAME,
   typically) — **specific to that domain and that Resend account**, so
   they can't be hard-coded here; use exactly what the dashboard shows.
3. Add those records at the DNS provider that hosts `mmgmenterprises.com`
   (registrar or DNS host — wherever its other DNS records currently
   live).
4. Back in Resend, click Verify — propagation can take anywhere from
   minutes to ~48 hours depending on the DNS host.
5. Once verified, change `EMAIL_FROM` in `.env.local` (and in Vercel's
   project environment variables for production) to
   `MMGM Enterprises <orders@mmgmenterprises.com>` — no code change
   needed, every template already reads `EMAIL_FROM` at send time.

### 24e. Not built: order-status-change emails

Shipped/Delivered/Cancelled emails have templates and a ready-to-call
function (`sendOrderStatusUpdateNotification(orderId, data)`), but
**nothing calls it** — there is no admin order-status-management feature
anywhere in this codebase (no `/admin` routes exist at all yet; that's
Phase 11). Building a fake "admin changes status" action just to have a
trigger would be its own kind of faking it. Wiring these in is a one-line
call once that admin feature exists. Cancellation-reason capture has the
same gap: no customer- or admin-facing cancellation flow exists yet
either.

Password reset intentionally has no Resend equivalent — Supabase Auth
already sends that email itself (`resetPasswordForEmail`/`updateUser` in
`src/lib/auth/actions.ts`, unchanged), and duplicating it would mean two
different reset links/flows for the same action.

## 25. Orders + Tracking (implemented in Phase 9)

Scoped to exactly what spec §63 names for this phase — order history/
detail for logged-in customers and the guest-accessible `/track-order`
lookup (spec §29/§30). Everything else `/account` (§26) eventually needs —
`/account/profile`, `/account/addresses`, `/account/returns`,
`/account/refunds`, `/account/reviews` — stays out of scope; Returns +
Refunds is explicitly Phase 10, Admin (which is what would ever populate
`shipments` or move an order past `ORDER_CONFIRMED`) is Phase 11, and
profile/addresses have no dedicated phase in §63 at all, so they get built
whenever something else first needs them rather than speculatively now.

- `src/features/orders/status.ts` — the single source of truth for order
  status labels and the 8-step happy-path timeline
  (`TIMELINE_STATUSES`/`TIMELINE_STEP_LABELS`), shared by
  `/account/orders`, `/account/orders/[orderId]`, `/track-order`, and the
  Phase 7 confirmation page (which had its own duplicate `STATUS_LABELS`
  map — now imports this instead).
- `src/components/store/orders/order-status-timeline.tsx` —
  `OrderStatusTimeline`, deliberately has no server-only imports and no
  hooks so the same component renders inside both a Server Component
  (`/account/orders/[orderId]`) and a Client Component rendering a Server
  Action's result (`/track-order`). For `CANCELLED` and the
  `RETURN_*`/`REFUND_*`/`EXCHANGE_REQUESTED` statuses, it shows a banner
  instead of forcing them onto the linear 8-step line — those aren't points
  on the happy path.
- **`/account/orders` and `/account/orders/[orderId]`**
  (`src/features/orders/queries.ts`) read with the normal session-scoped
  client, not service-role — RLS ("Users view own orders", Phase 2)
  already restricts these to `auth.uid()`, the same way cart/wishlist
  queries work. This only works for logged-in users; there is no
  guest-order-history equivalent by design (that's what `/track-order`
  is for).
- **`/track-order`** (`src/features/orders/tracking.ts`,
  `trackOrderAction`) has no session to scope against, so it proves
  identity at request time instead: order number + the email or mobile
  registered against that order (guest or account) must both match, via
  the service-role client. Returns the same generic error whether the
  order number or the contact was wrong, so it can't be used to enumerate
  valid order numbers. **No rate limiting exists anywhere in this
  project** (spec §42 is Phase 14) — this endpoint doesn't add one either;
  a known, project-wide gap, not something specific to this route.
  Deliberately shows less than the account order-detail view — status,
  timeline, and shipment info only, no items/prices/addresses — since
  order-number-plus-contact is weaker proof of identity than an
  authenticated session or the unguessable-order-ID link the checkout
  confirmation page uses.
- **Courier/tracking number/estimated delivery** (spec §30) read from the
  `shipments` table, which exists in the schema (Phase 1) but nothing
  writes to yet — there's no admin panel (Phase 11) to enter shipment
  info. Both the order-detail page and `/track-order` simply omit that
  section when no `shipments` row exists, rather than showing empty
  fields or fabricating placeholder tracking data.
- `/account` is upgraded from Phase 2's placeholder into a real dashboard
  showing the 3 most recent orders + a link to Wishlist — still leaves
  off the sections of spec §26's dashboard (Saved Addresses, Returns,
  Refunds, Notifications) that have nothing behind them yet, rather than
  linking to routes that would 404.

## 26. Returns + Refunds (implemented in Phase 10)

Scoped to the customer-facing half of spec §36/§37 — request a return
with photo evidence, view return/refund status. "Admin can: Approve /
Reject / Request Information / Mark Pickup / Mark Returned / Initiate
Refund" is explicitly an admin action (also matches the RLS: `refunds`
and `returns.status`/`admin_note` updates have no customer-facing insert/
update policy at all, only `public.is_admin()`), so none of that exists
yet — Phase 11.

- **Return requests insert through the normal session-scoped client, not
  service-role** — unlike checkout's guest-order problem, `returns` and
  `return_items` already had customer-insert RLS policies from Phase 2
  (`user_id = auth.uid()`), since a return can only be requested from an
  account that can see the order via `/account/orders` in the first
  place. No new RLS needed here, unlike Phase 7.
- **Eligibility (`src/features/returns/eligibility.ts`) is enforced
  server-side, both when rendering the request form and again inside
  `requestReturnAction`** (spec §56.15 "only eligible orders can be
  returned") — never trusted from what the form last displayed. Three
  checks: `order.status === 'DELIVERED'`; within the purchased product's
  `return_period_days` of delivery; and remaining returnable quantity
  (ordered − already requested across any non-`REJECTED` existing return
  for that line item — a rejected return frees the quantity back up).
  "Delivered" is read from `order_status_history`'s `DELIVERED` row
  rather than `shipments.delivered_at`, since a status transition is
  guaranteed to write a history row (every status change always has,
  starting with Phase 7) while nothing guarantees `shipments` gets
  populated at the same time.
- **This is currently unreachable in practice**, same as Phase 9's
  shipped/delivered/cancelled gap: no order can reach `DELIVERED` through
  any code path in this app yet (no admin panel to advance order status
  past `ORDER_CONFIRMED`). The logic is correct and was verified by
  seeding a `DELIVERED` test order directly, not by relaxing the gate to
  something reachable — returning an item you haven't received yet would
  be wrong regardless of what's convenient to demo.
- **Return-evidence photos** (`return-evidence` storage bucket, migration
  `20260810170000_phase10_returns_storage.sql`, **must be run in the
  Supabase SQL Editor**) are private, not public like product photography
  — these can show personal items/addresses in the background. Uploaded
  directly from the browser (`src/components/store/returns/return-image-upload.tsx`,
  using the existing `src/lib/db/client.ts` browser client) to a path
  prefixed with the uploader's own `auth.uid()`, which the bucket's RLS
  policies enforce; read back via short-lived signed URLs generated
  server-side (`getMyReturnDetail`), never a public bucket URL. Path
  convention doubles as the access-control key: `storage.foldername(name))[1]
= auth.uid()::text`.
- **One item per return request**, not a multi-item cart-like form — the
  schema's `returns.reason` is a single text field per return (not
  per-item), and real return flows are almost always "return this one
  thing" anyway; a customer with multiple items to return submits
  multiple return requests. `reason` is stored as `"<category>: <notes>"`
  when notes are provided, since the schema has no separate notes column.
- **`/account/refunds` is read-only and shows nothing until an admin
  initiates one** — `refunds` has no customer-insert policy at all
  (admin-only, matching spec's "Initiate Refund" being an admin action),
  so this phase only builds the list/detail view. Phase 11 is what
  finally creates refund rows.

## 27. Admin Dashboard (implemented in Phase 11)

By far the largest single phase — covers spec §31–33 (Admin Panel,
Product Management, Image Management), §39 (Customer Management), and
§41 (RBAC), plus the admin-side halves of order management (§29) and
returns/refunds (§36/§37) that earlier phases built the customer-facing
half of and left waiting. Two things named in spec §63's phase breakdown
are deliberately **not** here even though related spec sections mention
them: Inventory (§34) and Coupons (§35) are explicitly Phase 12; the
chart section of §31's dashboard (Daily/Monthly Sales, Revenue Trends,
Top Selling Sarees, Category Performance) is Phase 13 "Reports +
Notifications" — this phase's dashboard is the card row only.

### 27a. Bootstrapping the first admin

Phase 2 gave `admin_users` a SELECT policy only, with its own comment
deferring writes to "Phase 11" by name. Writing an `admin_users` row
requires `public.is_admin()`, which is false for everyone until one
exists — a chicken-and-egg problem for the very first admin account.
Solved the standard way, in migration `20260810180000_phase11_admin.sql`
(**must be run in the Supabase SQL Editor**): a self-limiting RLS policy
that allows exactly one self-insert, and only while `admin_users` is
completely empty —

```sql
create policy "First admin can self-bootstrap" on admin_users
  for insert to authenticated
  with check (user_id = auth.uid() and not exists (select 1 from admin_users));
```

— after the first row exists, that branch is permanently false for
everyone; every admin after that is created by an existing SUPER_ADMIN
via `/admin/team` (`createAdminAction`, which promotes an existing
_registered customer account_ rather than minting new credentials).

`requireAdmin()` (`src/lib/auth/session.ts`) checks whether `admin_users`
is genuinely empty (via service-role, since a non-admin can't even see
that it's empty under its own SELECT policy) and routes a fresh install
to `/admin/setup` instead of `/admin/login`, which would otherwise
dead-end. `/admin/setup` itself requires an ordinary logged-in customer
session (`requireUser()`) — sign up on the storefront first, then visit
`/admin/setup` to become SUPER_ADMIN.

**Live-verified, not just read from the RLS policy SQL**: created a real
Supabase auth user via the admin API, inserted an `admin_users` row for
them via service-role (simulating what the bootstrap policy lets the
_real_ first admin do), signed in to get a real access token, and
confirmed via direct REST calls that this admin token can update any
order's status and insert `order_status_history`, while the same request
with only the anon key returns an empty result set (RLS-filtered, not a
403 — PostgREST's default behavior for an UPDATE that matches zero rows
under RLS) and leaves the order state unchanged. Cleaned up afterward.

### 27b. RBAC — role-based, not the granular permissions table

`admin_users.role_id` → `roles.name` (`SUPER_ADMIN`, `ADMIN`,
`ORDER_MANAGER`, `PRODUCT_MANAGER`, `INVENTORY_MANAGER`,
`CUSTOMER_SUPPORT`, seeded since Phase 1) is what every admin Server
Action checks via `requireRole([...])` (`src/lib/auth/session.ts`).
The `permissions`/`role_permissions` tables exist in the schema but were
never seeded with any permission codes — spec §41 requires roles and
server-side enforcement, not that specific table being populated, so
this phase enforces access by role name directly rather than inventing a
permission taxonomy nobody specified. `/admin/team` (admin account
management) is SUPER_ADMIN-only; everything else is scoped per-domain
(e.g. products need `PRODUCT_MANAGER`+, orders need `ORDER_MANAGER`+).

**A build-time lesson worth recording**: a `"use server"` file may only
export async functions — Next.js's compiler rejects any other export
from one. The pure transition-table helpers (`getAllowedNextStatuses`,
`getAllowedReturnTransitions`, `getNextRefundStatus`) originally lived in
the same file as their related Server Actions and needed to be called
from Client Components to render dropdown options; `tsc --noEmit` didn't
catch this (it's a Next.js compiler rule, not a TypeScript one) — only
`next build` did. Fixed by moving each helper into its domain's
`status.ts` (no `"use server"`), imported by both the action file and the
client component.

### 27c. Disabling an account is real, not cosmetic

`users.is_active` existed in the schema since Phase 1 but nothing ever
read it. `signInAction` (`src/lib/auth/actions.ts`) now checks it right
after a successful password check and signs the session back out if
false — spec §39's "Enable/Disable Account" actually blocks login, not
just a flag with no effect elsewhere in the app.

### 27d. Products, images, and video

- `src/features/products/admin-queries.ts` / `admin-actions.ts` — full
  CRUD. **Never a hard DELETE** — `order_items.product_id` is `ON DELETE
RESTRICT` by design (a sold product's history must survive), so
  "Archive" (`products.status = 'ARCHIVED'`) is the only removal path,
  consistent with how the storefront has treated "deleted" products since
  Phase 4.
- `discount_amount` is computed automatically as
  `max(0, originalPrice - sellingPrice)` rather than exposed as its own
  form field — it's a real column but nothing in the app has ever read it
  independently of `discount_percent` (a _generated_ column computed
  directly from the two prices, Phase 4), so a separate admin-entered
  value for it would just be a second, driftable source of truth.
- **`product-media` is a public storage bucket** (migration
  `20260810180000_phase11_admin.sql`), unlike Phase 10's private
  `return-evidence` bucket — product photography and video are marketing
  assets meant to be served to every storefront visitor. Writes
  (insert/update/delete) are still admin-only; next.config.ts already
  allowed `**.supabase.co` in `images.remotePatterns` since Phase 5, so
  no further config was needed for `next/image` to serve these.
  "Optimize images before serving" (spec §33) is satisfied by
  `next/image`'s request-time optimization rather than a separate
  processing step at upload time.
- Reorder is up/down buttons rewriting `sort_order` sequentially, not a
  drag-and-drop library — avoids a new dependency for a rarely-used
  admin-only interaction with a handful of images per product.
- One video per product (`setProductVideoAction` replaces any existing
  one rather than managing a list) — matches how saree listings
  realistically use video (one drape/turntable demo, not a gallery).

### 27e. Orders — the keystone that unblocks Phase 9 and 10

`src/features/orders/admin-actions.ts`'s `updateOrderAction` is the
first and only code path in this entire project that can move an order
past `ORDER_CONFIRMED`. Every "this doesn't have a trigger yet" gap
flagged since Phase 8 traces back to this:

- Phase 8's `sendOrderStatusUpdateNotification` (SHIPPED/DELIVERED/
  CANCELLED emails) — now called here, on an actual transition, not a
  shipment-info-only edit.
- Phase 9's courier/tracking-number/estimated-delivery display — now
  populated via the same form (`shipments` upsert alongside the status
  change).
- Phase 10's return eligibility gate (`order.status === 'DELIVERED'`) —
  now actually reachable, for the first time, through this admin action.

`ALLOWED_TRANSITIONS` (`src/features/orders/status.ts`, not
`admin-actions.ts` — see §27b) intentionally excludes
`RETURN_*`/`REFUND_*`/`EXCHANGE_REQUESTED` from the admin status
dropdown entirely: those order-level enum values predate Phase 10's
separate `returns`/`refunds` tables and would be a second, competing way
to represent the same state if exposed here. An order's `status` stays on
the linear fulfillment path; return/refund state lives only in the
dedicated tables.

### 27f. Returns and refunds — the admin half

`src/features/returns/admin-actions.ts`: `updateReturnStatusAction`
walks a return through `REQUESTED → APPROVED/REJECTED/INFO_REQUESTED →
PICKUP_SCHEDULED → RETURNED`. Once `RETURNED`, `initiateRefundAction`
creates the `refunds` row — this is the **first code in the project that
writes to `refunds` at all**, closing the gap Phase 10 flagged
("`/account/refunds` will show nothing until an admin exists"). Refund
amount is capped server-side at the sum of `order_items.unit_price ×
returned_quantity` for the items on that return (business rule §56.14
"never allow refund amount greater than eligible amount") — re-checked on
submission, never trusted from what the form displayed.

`src/features/refunds/admin-actions.ts`'s `advanceRefundStatusAction`
moves a refund through spec §37's `REQUESTED → APPROVED → INITIATED →
PROCESSING → COMPLETED` one stage at a time. **This is bookkeeping only —
no Cashfree Refunds API call happens at any stage.** Marking a refund
`COMPLETED` here records that it was completed; it does not cause money
to move. Spec §37 asks for a refund "linked to Order, Payment, Customer,
Product, Amount" and a lifecycle to track, but doesn't name a gateway
integration the way §28 explicitly does for payment collection — actually
calling Cashfree's Refunds API was judged out of scope for this phase and
is flagged here rather than silently skipped. `cashfree_refund_id` stays
`null` throughout.

### 27g. Customers

`src/features/customers/queries.ts` never selects anything
payment-credential-shaped (spec §39) — there's nothing of that shape
anywhere in this schema to leak in the first place (Cashfree's hosted
checkout means this app never touches card data). Total spending is
computed the same way the admin dashboard computes revenue: sum of
`grand_total` across orders that aren't `PENDING_PAYMENT` or `CANCELLED`.

## 28. Real Photography (Pexels-sourced, product-only)

Not one of the original 15 phases — a follow-up requested once the site
was otherwise feature-complete, to replace `MediaPlaceholder`'s gradient
tiles with real saree photography everywhere a product/category appears.
Sourced from Pexels (free license, no attribution required) via `WebFetch`
against live search-result pages — every URL was verified to actually
resolve (`curl` HTTP 200) before being written into `seed.sql`, not
guessed from a photo ID pattern.

**Revised mid-implementation**: the first pass used lifestyle/model
photography (women wearing sarees) — the far more plentiful category on
free stock sites for this subject. Replaced immediately on request with
pure product photography instead: every image is now a folded/draped
saree stack, a fabric close-up, or a textile-store display — verified
per-photo (not just by search term) to contain no person, hand, face, or
mannequin anywhere in frame. Genuinely saree-specific stock shots without
a person in them are scarce (most searches return exclusively
lifestyle/model results), so the final set leans on silk/satin fabric
close-ups and folded-saree/textile-store shots for color coverage across
all 12 products' named colors, reserving the handful of shots explicitly
labeled as sarees/saris (a folded Kanchipuram stack, a sari draped over a
chair, a saree fabric macro shot) for the highest-visibility placements —
hero banner and category tiles — where a saree's identity as a garment
matters most.

- **`src/features/products/images.ts`** — `getPrimaryImageMap()`, the
  shared helper every product-list query now calls, mirroring
  `getAvailabilityMap`'s shape (`availability.ts`): batched by
  `product_id`, preferring `product_images.is_primary` when set, else the
  lowest `sort_order`. Before this, only the Phase 5 product-detail
  gallery ever queried `product_images` at all — `getNewArrivals`,
  `getBestSellers`, `getTrendingNow`, `getCatalogPage`, and
  `getSimilarProducts` only selected from `products`, so `ProductCard`
  (used by every one of them) had no image data to render regardless of
  what existed in the database.
- **Every `MediaPlaceholder` call site that had real image data available
  now branches on it** (`imageUrl ? <Image> : <MediaPlaceholder>`):
  `ProductCard`, `ShopByCategory`, cart/wishlist line items, and Recently
  Viewed. `MediaPlaceholder` itself is untouched and still renders
  wherever a product/category genuinely has no image — it's a fallback,
  not something being removed.
- **Hero banner, editorial banners (5 on the homepage), and the Offers
  section** had no backing DB column and no image plumbing at all before
  this — these are hardcoded `imageUrl` props/constants at the call site,
  same as their existing hardcoded headline copy. Not data-driven because
  there's no product/category they're "about"; an editorial choice, like
  the text next to them.
- **`next.config.ts`** gained `images.pexels.com` in `remotePatterns`
  alongside the existing `**.supabase.co` entry.
- **Cart/wishlist/Recently-Viewed types gained an `imageUrl` field**
  (`CartLine`, `WishlistLine`, `RecentProduct`) — none of them carried one
  before, so the thumbnails in those flows were `MediaPlaceholder` no
  matter what. Recently Viewed still stores its snapshot in `localStorage`
  (Phase 5 decision, unchanged) — `imageUrl` is just one more field in
  that snapshot now.
- **Seed data**: `supabase/seed.sql` now inserts 2 images for 8 products
  and 1 for the other 4 (21 rows total, `product_images`), plus
  `categories.image_url` for all 8 categories — applied directly against
  the live DB (no pending migration; these are plain data rows, not
  schema). The `categories` insert changed from `on conflict do nothing`
  to `on conflict (slug) do update set image_url = excluded.image_url`
  specifically so re-running seed.sql backfills the photo onto
  already-existing category rows instead of leaving them null forever;
  `product_images` has no natural unique key to `on conflict` against, so
  its idempotency is a `where not exists` guard (only inserts for a
  product that currently has zero image rows) instead.
- **Not swapped out**: admin product image management (Phase 11's
  `product-media` Storage bucket, upload/reorder/set-primary UI) is
  unaffected — these Pexels URLs live in the same `product_images.url`
  column real uploads would, so an admin can delete/replace any of them
  through the existing admin UI exactly like a genuinely-uploaded photo.

## 29. Hero Slider

`HeroBanner` (`src/components/store/home/hero-banner.tsx`) went from one
static image to a 5-slide auto-advancing carousel, all 5 images product-
only (same standard as §28) and sourced the same way. All 5 `<Image>`s
are mounted simultaneously and crossfaded via `framer-motion`'s `animate`
prop (opacity `0`↔`1`, 1s ease) rather than mounted/unmounted per slide —
deliberately, so every image loads once upfront and repeat crossfades
never wait on a network fetch. A nested `motion.div` per slide runs a
slow continuous scale (1 → 1.06, ~4s linear) only while that slide is
current, restarting from 1 each time it becomes active again — this is
what reads as the "Ken Burns" pan/zoom rather than a static crossfade.
Auto-advance is a plain `setInterval` (3s), paused on `onMouseEnter` and
resumed on `onMouseLeave`; clickable dot indicators let a visitor jump to
any slide directly, which also works while paused.

**The nav bar was already sticky** (`src/components/store/header.tsx`,
`sticky top-0 z-40`, built in Phase 3) — the announcement bar above it is
a normal (non-sticky) block that scrolls away first, then the nav row
sticks to the very top and stays there. Confirmed still correct rather
than re-implemented from scratch.

## 30. Reports + Notifications (implemented in Phase 13)

Spec §31 splits the admin dashboard into a card row (Phase 11, done) and
a chart section — Daily Sales, Monthly Sales, Revenue, Orders, Top
Selling Sarees, Category Performance, Revenue Trends — deferred to this
phase (§27e / dashboard.ts's own comment). The "Notifications" half of
this phase's name was already closed out in Phase 11: `updateOrderAction`
(`src/features/orders/admin-actions.ts`) calls
`sendOrderStatusUpdateNotification` on every SHIPPED/DELIVERED/CANCELLED
transition, which was the one remaining gap flagged back in §24e. Nothing
left to wire there — this phase is charts only.

**Consolidating 7 named charts into 5 panels.** The spec lists Daily
Sales, Monthly Sales, Revenue, and Revenue Trends as four separate items,
but Revenue/Revenue Trends share the same underlying series as Daily/
Monthly Sales (order count) — just a second axis on the same time bucket.
Splitting them into four charts would mean two pairs of charts plotting
the same x-axis twice each. Instead, `/admin/reports`
(`src/app/admin/(dashboard)/reports/page.tsx`) renders:

- **Daily Sales & Revenue** (last 30 days) — combo chart, `SalesTrendChart`
- **Monthly Sales & Revenue Trends** (last 12 months) — same component,
  monthly buckets
- **Orders by Status** — donut, covers the spec's "Orders" chart as a
  status-distribution breakdown rather than a third count-over-time
  series (which would just be Daily/Monthly Sales again)
- **Category Performance** — revenue by category, bar chart
- **Top Selling Sarees** — top 10 products by revenue, horizontal bar

`SalesTrendChart` (`src/components/admin/reports/sales-trend-chart.tsx`)
is a `recharts` `ComposedChart`: bars for order count on a left axis,
a line for revenue on a right axis, same two-metric-one-timeline idea
used for both the daily and monthly panels (just different bucket
counts/labels).

**Data layer** (`src/features/admin/reports.ts`, `getReportsData()`)
fetches `orders` and `order_items` broad (same RLS-full-read pattern as
`getDashboardStats`) and aggregates in JS — there's no PostgREST
group-by, and the existing dashboard card query already established this
as the project's convention at this data volume. Category names are
resolved via two more flat queries (`products` then `categories`, joined
in JS via `Map`s) rather than PostgREST's embedded-resource select
syntax (`products(categories(name))`) — the hand-maintained `Database`
type in `src/types/supabase.ts` has no `Relationships` metadata for the
client to type-check an embedded select against, so every other admin
query in this codebase (`getAdminOrders`, `getAdminTeam`, etc.) already
uses flat queries + manual joins, and this follows the same pattern.
Orders in `PENDING_PAYMENT`/`CANCELLED` are excluded from every revenue
figure, matching `getDashboardStats`; the order-status donut is the one
exception and counts every status, since its entire purpose is to show
the distribution across all of them.

**Charting library**: `recharts` (direct `pnpm add`, not via
`shadcn add chart` — the `ui.shadcn.com` component registry wasn't
reachable from this environment, only the plain npm registry was, so the
chart panels are hand-written against `recharts` directly rather than
through shadcn's `ChartContainer` wrapper). All colors reference the
existing CSS custom properties (`var(--primary)`, `var(--brand-*)`) so
the charts stay in sync with the rest of the design system automatically.

Verified: `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass, the
`/admin/reports` route is registered, an unauthenticated request 307s to
`/admin/login` cleanly, and the actual `orders`/`order_items`/`products`/
`categories` queries were run end-to-end against the live database signed
in as the real admin account — all return successfully under RLS (0 rows,
since no real order has been placed in this environment yet; the charts
render their empty state rather than erroring).

## 31. Security + SEO + Performance (implemented in Phase 14)

Spec §42/§43/§44. Most of §42 (Security) was already satisfied by earlier
phases and just gets called out here rather than rebuilt: Supabase Auth
handles password hashing/session security, RBAC has been in place since
Phase 11, every write path validates with Zod, the Supabase client
parameterizes every query (no raw SQL string-building anywhere), React
escapes all rendered content (no `dangerouslySetInnerHTML` in the
codebase before this phase — the two exceptions this phase adds are
JSON-LD `<script>` tags, the standard safe pattern for structured data,
serialized through `jsonLdScript()` which escapes `<` so no field can
break out of the tag), Next.js Server Actions already reject cross-origin
POSTs (built-in Origin-header CSRF protection since Next 13.4, nothing to
add), audit logs have covered every admin mutation since Phase 11, and
the Cashfree webhook has verified its HMAC signature since Phase 8. No
`NEXT_PUBLIC_`-prefixed secret ever existed — the anon key is meant to be
public (RLS is what actually protects data), and the service-role/
Cashfree-secret/Resend-key env vars have never had that prefix.

What this phase actually adds:

**Storage upload validation** (migration `20260810190000_phase14_
security.sql`) — both `product-media` and `return-evidence` buckets took
direct-from-browser uploads with only client-side MIME/size checks
(`product-media-manager.tsx`, `return-image-upload.tsx`), which a direct
API call bypasses entirely. Added `file_size_limit`/`allowed_mime_types`
at the bucket level — the one server-side enforcement point available
for a direct-to-Storage upload pattern. `product-media`'s bucket-wide
limit has to cover its larger asset (50MB video ceiling, since Storage
has one size limit per bucket, not per-MIME-type) — the tighter 5MB
image cap stays client-side only, a known/accepted gap for an
authenticated-admin-only bucket.

**Rate limiting** (`src/lib/security/rate-limit.ts`) — an in-memory
fixed-window limiter wired into every auth action that's a classic abuse
target: `signInAction`/`adminSignInAction` (10/15min per IP), `signUpAction`
(5/hr), `requestPasswordResetAction` and `resendVerificationEmailAction`
(5/hr each). Explicitly documented as a single-instance, best-effort
defense (a fresh `Map` per cold start, no cross-instance sharing) rather
than pretending it's Redis-backed — real enough to blunt naive scripted
abuse, not a claim of bulletproof protection. Keyed by IP
(`x-forwarded-for`, trustworthy behind Vercel's edge) rather than email,
so it throttles brute-forcing many accounts from one source without
needing per-account state.

**Security headers** (`next.config.ts`) — `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-
when-cross-origin`, a restrictive `Permissions-Policy`, HSTS, and a CSP.
The CSP keeps `script-src`/`style-src` at `'unsafe-inline'` rather than a
nonce-based policy — Framer Motion animates via inline `style` attributes
across the storefront, and Cashfree's own checkout SDK
(`sdk.cashfree.com`, loaded via `next/script` in `cashfree-checkout.tsx`)
is a third `<script>` source outside this app's control. Tightening to
nonces would mean per-request nonce plumbing through every script tag
including Cashfree's, and there's no browser available in this
environment to verify that doesn't silently break checkout — the
highest-stakes flow in the app. Everything else in the policy
(`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`,
scoped `connect-src`/`img-src`) is a real restriction with no such
tradeoff. Verified live: all headers present on a production build
(`pnpm build && pnpm start`), including on `/`.

**SEO** — root layout (`src/app/layout.tsx`) gained `metadataBase`, a
title template (`%s | MMGM Enterprises`), and default Open Graph/Twitter
metadata; `src/app/admin/layout.tsx` got its own template (`%s | MMGM
Admin`) plus `robots: { index: false }` (already had the latter). Every
page's hardcoded `"X | MMGM Enterprises"` / `"X | MMGM Admin"` title
string was stripped to just `"X"` so the template supplies the suffix
once instead of doubling it. The product detail page
(`sarees/[slug]/page.tsx`) gained a canonical URL, Open Graph/Twitter
images from the product's own primary photo, and two JSON-LD blocks
(`src/lib/seo/structured-data.ts`) — `Product` (price, availability,
aggregate rating when reviews exist) and `BreadcrumbList` matching the
page's own visible breadcrumb. The `/sarees` listing canonicalizes every
filter/sort/page combination back to the bare `/sarees` URL, since
they're the same content in a different order and would otherwise look
like near-duplicate pages to a crawler. `src/app/sitemap.ts` lists the
canonical static routes plus every non-archived product's PDP (verified
live — 12 real products present); category browsing is deliberately
excluded since it lives at `/shop?category=slug`, a filtered view of
`/sarees` rather than a distinct canonical page. `src/app/robots.ts`
disallows `/admin`, `/account`, `/cart`, `/checkout`, `/api` and points
at the sitemap. Verified live: `curl /robots.txt` and `/sitemap.xml` both
render correctly as static routes (`○` in the build output), and a real
product page's rendered HTML was checked for the canonical link, both
JSON-LD blocks, and the OG title.

**Performance — what was done, and what wasn't.** `features/products/
catalog.ts` and `detail.ts` (the public catalog/PDP data layer) read
through a new `createPublicClient()` (`src/lib/db/public.ts`) — a plain
anon-key client with no cookie adapter — instead of the session-scoped
`createClient()` every other admin/account query uses. These two files
have no `auth.uid()`-dependent logic anywhere (every query already
carries an explicit `status = 'ACTIVE'` filter matching the RLS policy
itself), so an anonymous read and a logged-in customer's read return
identical rows; swapping the client removes an unnecessary cookie-store
read per query and fixes a real architectural mismatch (public catalog
data was coupled to request cookies for no reason).

The original goal was to go further and mark `/sarees` and `/sarees/
[slug]` as ISR (`export const revalidate = 60`) now that their own data
layer no longer touches `cookies()`. That was implemented, then reverted
after `pnpm build` showed both routes still rendering as `ƒ` (fully
dynamic) — `Header` (`src/components/store/header.tsx`, shared by every
storefront page via `(store)/layout.tsx`) calls `getCurrentUser()` and
`getCartItemCount()` on every render to show the login/account link and
cart-badge count, and without Partial Prerendering enabled, one dynamic
API call anywhere in a route's component tree forces the entire route
dynamic — there's no partial caching of "everything except the header."
Shipping `export const revalidate = 60` while the build output proved it
had no effect would have been a misleading comment, so it was pulled
back out rather than left in as decoration. Making these routes
genuinely cacheable would mean extracting the account-link and cart-badge
into small client components that fetch their own state after hydration
— a cross-cutting change to the single most shared component in the
storefront, with real risk of a logged-in-user flash-of-wrong-state, and
not verifiable without a browser in this environment. Flagged as the
concrete next step for a future performance pass rather than attempted
half-verified here.

Already satisfied without new work: pagination (`PAGE_SIZE`/`.range()` in
`catalog.ts`, Phase 4), Next.js Image optimization (`next/image`
everywhere images render, lazy-loading by default except explicit
`priority` on above-the-fold hero/first-product images), and a
server-component-first architecture (every interactive element on the
product/catalog pages — wishlist button, add-to-cart, delivery check,
recently-viewed — is already an isolated `"use client"` island reading
its own state, not the page itself; confirmed while investigating the
ISR question above).

## 32. Testing + Production Deployment (implemented in Phase 15)

**Testing.** No test framework existed anywhere in the project before
this phase. Added Vitest (`vitest.config.mts`, `pnpm test` / `pnpm
test:watch`) rather than Jest — no React-component rendering is being
tested (no jsdom needed), just pure business logic, and Vitest's Vite
-native TS/ESM handling needs zero Babel/ts-jest configuration for that.
`server-only` throws by design when imported outside Next's own bundler
(hit this in Phase 10 too) — `test/empty-module.ts` stubs it via a
`resolve.alias` in the Vitest config so files that import it defensively
(`src/lib/security/rate-limit.ts`) can still be unit tested.

Coverage is deliberately scoped to pure, side-effect-free logic — the
highest-risk-of-silent-breakage, easiest-to-verify-in-isolation code in
the project, not an attempt at integration/e2e coverage (which would
need a real Supabase project and a browser, neither reliable to drive
from this environment):

- Order/return/refund status transition maps (`getAllowedNextStatuses`,
  `getAllowedReturnTransitions`, `getNextRefundStatus`) — the state
  machines gating what an admin can do to an order/return/refund next;
  a wrong entry here is an admin silently able (or unable) to make a
  transition that spec §29/§36/§37 forbid/require.
- `formatINR`/`discountPercent` (`features/products/format.ts`) — every
  price on the site runs through these.
- `checkRateLimit` (Phase 14's rate limiter) — the sliding-window/reset
  logic itself, not `getClientIp` (a thin, untestable-in-isolation
  wrapper around `next/headers`).
- `jsonLdScript`/`productJsonLd`/`breadcrumbJsonLd` (Phase 14's
  structured data) — specifically the `<` escaping that keeps a product
  name from ever being able to break out of its `<script>` tag.
- `loginSchema`/`registerSchema` (Zod validation) — password length,
  email format, mobile regex, password-confirmation matching.

38 tests, all passing; wired into a new GitHub Actions workflow
(`.github/workflows/ci.yml`) alongside `typecheck`/`lint`/`build` on
every push/PR to `main`. The workflow needs no repository secrets —
`pnpm build` was verified to succeed with `.env.local` entirely absent
(see the `sitemap.ts` fix below), so CI stays meaningful even before
anyone configures deployment secrets in GitHub.

**Error/loading states (spec §49/§50).** None of `error.tsx`,
`not-found.tsx`, or `loading.tsx` existed anywhere before this phase —
any unhandled error rendered Next's bare default error UI, any missing
route or `notFound()` call rendered Next's bare default 404, and every
route transition had no interim UI beyond the odd inline
`useTransition`-driven button spinner already built per-component.
Added:

- `src/app/error.tsx` — root boundary, catches errors anywhere in the
  storefront tree (a same-segment `error.tsx` can't catch its own
  layout's errors, only a parent one can, so this has to sit above
  `(store)/layout.tsx`, not inside it). Never renders `error.message`/
  `.stack` — spec §49's "never show technical stack traces to
  customers," and the client-side half of what Next already does
  server-side (redacting real error messages from the client in
  production).
- `src/app/admin/error.tsx` — same rule, admin-branded, sits below the
  root one so admin errors get admin chrome instead of storefront chrome.
- `src/app/not-found.tsx` — root 404, branded, used both for unmatched
  routes and every explicit `notFound()` call.
- `src/app/(store)/sarees/loading.tsx`, `.../sarees/[slug]/loading.tsx`,
  `src/app/admin/(dashboard)/loading.tsx` — skeleton placeholders shaped
  to match each real page's layout (grid columns, gallery/info split,
  stat-card row) so there's no layout shift when real content swaps in.
  Covers spec §50's "skeleton loaders"/"admin table loading" — one
  shared skeleton at the `(dashboard)` segment level covers every admin
  table route (products/orders/customers/returns/refunds/reports/team)
  rather than a bespoke one per route. Button-loading/duplicate-click
  prevention was already handled per-component via `useTransition`
  since early phases, not new here.

**A real finding from testing this**: `notFound()` in this Next.js
version (16, running under its newer "Cache Components" streaming model
— see `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/
not-found.md`, "Calling notFound() after streaming has started") no
longer produces a genuine `404` HTTP status when called from inside a
Server Component's render path, which is how the product detail page
(`sarees/[slug]/page.tsx`) has called it since Phase 5. Every dynamic
route streams a static shell at `200` first under this model, so by the
time `notFound()` throws, the status is already committed — confirmed
live (`curl -D -`) against an unknown product slug: `200 OK`, not `404`,
serving the branded not-found UI. Next's own mitigation is a `<meta
name="robots" content="noindex">` tag injected automatically wherever
`notFound()` renders — confirmed present. The one gap this phase found
and fixed: the product page's own `generateMetadata` returned `{}` for a
missing product, so the root layout's site-wide `index: true` sat right
next to Next's injected `noindex` as a second, contradicting robots meta
tag. Fixed by returning `{ robots: { index: false, follow: false } }`
instead — both tags now agree (still two tags, not fully deduplicated,
since the injected one isn't something userland code controls, but no
longer in conflict). Getting a true `404` status code back would mean
moving the existence check into `proxy.ts` per the doc's own guidance,
which means a DB query on every request matching its matcher (currently
just session refresh) — a real architectural change, not a bug fix, and
out of scope for this pass; flagged here rather than attempted
half-verified.

**Production deployment (spec §54).** `.env.example` already listed
every variable with no real secrets committed (confirmed, unchanged).
Rewrote `README.md` (previously untouched `create-next-app` boilerplate
— still referenced the Geist font and had no mention of Supabase,
Cashfree, Resend, or this project at all) into a real setup guide: env
var reference table, the migration files in application order, the
`/admin/setup` first-admin bootstrap flow, all `package.json` scripts,
and a Vercel deployment checklist (env vars, `NEXT_PUBLIC_SITE_URL`,
Cashfree webhook URL, Resend domain verification, running migrations
before first deploy). `next build` was verified to succeed both with the
real `.env.local` and with it entirely absent (temporarily moved aside
and restored) — confirming spec §54's "no local-only dependencies" and
that a first-time clone with no env configured yet still builds cleanly
rather than crashing opaquely.

## 33. Site-Wide Polish Pass (broken links, contact, refurbished messaging)

A post-launch cleanup pass: the footer/nav had been linking to pages that
were never built (expected during phased development per nav-links.ts's
own comment — every phase up to now targeted a specific route, and
`/collections`, `/offers`, `/contact`, `/faq`, `/shipping`, `/privacy-
policy`, `/terms`, `/cookie-policy` were never one of them), the hero
headline had a typo, and the business's actual positioning — refurbished
sarees, not new stock — wasn't stated anywhere a customer would see it
before now.

**Eight new pages**, closing every remaining footer/nav 404:

- `/collections` and `/offers` reuse existing homepage components
  (`ShopByCategory`, now taking an optional `limit` prop so this page can
  show more than the homepage's 8-tile teaser; `OffersSection` as-is)
  rather than building new grids — same data, same images, zero design
  risk.
- `/contact` — company details plus a working form. `src/features/
  contact/actions.ts` validates with a new `contactSchema`
  (`src/validations/contact.ts`), rate-limits at 5/hour per IP (reusing
  Phase 14's `checkRateLimit`), and sends via the existing `sendEmail`
  (now supporting an optional `replyTo` — set to the customer's own
  address, so a reply from Gmail goes straight back to them) with a new
  `buildContactMessageEmail` template. Logged through the same
  `logEmailDelivery` every other transactional email uses. A new
  `Textarea` primitive (`src/components/ui/textarea.tsx`) was hand-
  written to match `Input`'s existing styling — shadcn's registry
  (`ui.shadcn.com`) isn't reachable from this environment (same issue
  hit adding the Phase 13 chart component), only plain npm is.
- `/faq`, `/shipping`, `/privacy-policy`, `/terms`, `/cookie-policy` —
  static content pages, real (non-lorem-ipsum) copy written for this
  business specifically. FAQ leads with "Are your sarees new?" —
  the most direct place for the refurbished disclosure to live in full.

**Contact details centralized**: `src/lib/constants.ts` now holds the
company email/phone/address once (`COMPANY_EMAIL`, `COMPANY_PHONE_*`,
`COMPANY_ADDRESS_LINES`) instead of the footer hardcoding them inline —
the footer already had the correct email/phone (apparently edited by
hand before this pass) but was missing the address entirely; added it,
and pointed both the footer and the new `/contact` page at the same
constants so they can never drift apart.

**Refurbished-saree messaging** added in five places total, deliberately
not more: the footer's existing tagline, the hero subtext ("Premium,
quality-checked refurbished sarees curated for every occasion"), the
homepage's New Arrivals section (new optional `subtitle` prop on
`ProductGrid`), the `/sarees` listing header, and a small badge next to
the in-stock/out-of-stock indicator on the product detail page. Wording
throughout says "refurbished"/"quality-checked" explicitly rather than
implying new condition, per spec's own instruction not to.

**Hero banner fixes**: the headline read "Elegance Women Into Every
Thread" — a typo for "Woven," present since the Phase-13-era slider
rewrite, now corrected. The overlay changed from a flat `bg-black/30` to
a gradient (`from-black/45 via-black/50 to-black/45`) plus a text-shadow
on the heading block — the flat 30%-opacity wash didn't reliably darken
every one of the 5 rotating slides enough for white text to stay
readable against lighter fabric photography. Images and the crossfade/
Ken-Burns mechanics from Phase 13 are unchanged.

**Sticky nav — re-verified, not changed.** Re-confirmed `sticky top-0
z-40` on the header's nav row (`src/components/store/header.tsx`,
correct since Phase 3), and checked for anything that silently breaks
`position: sticky` — an ancestor with `overflow: hidden`, `transform`,
or `contain` — in `globals.css` and both layout files; found none.
`curl`-verified the class is present in the shipped HTML. Left as
`sticky` rather than switching to `fixed` (which the request's wording
—"add padding so content starts below the fixed navbar"— would imply):
`fixed` removes the header from document flow entirely, which would
require hardcoding the announcement-bar-plus-nav height as a manual
content offset (fragile — breaks if the announcement bar ever wraps to
two lines) to reproduce the exact same "pins once you'd scroll past it"
behavior `sticky` already gives for free. If the nav still doesn't
appear fixed in practice, the likely cause is a stale deployment/cache
rather than this code — nothing else in the render path touches its
positioning.

**Known gap, not fixed here**: the `/contact` form is fully built and
wired correctly, but message delivery to `mmgmenterprises.office@
gmail.com` will fail until Resend's sending domain is verified — this
was flagged back in the original Resend integration work (§24d) and
confirmed still true here by directly testing the Resend API with the
real key: `403 validation_error — "You can only send testing emails to
your own email address"`. Resend's sandbox sender (`onboarding@
resend.dev`, still in use — `EMAIL_FROM` in `.env.local`) can only
deliver to the Resend account's own registered address, not to
`mmgmenterprises.office@gmail.com` or anyone else, until a domain is
verified at resend.com/domains and `EMAIL_FROM` is updated to use it (no
code change needed beyond that — every template already reads
`EMAIL_FROM` at send time). Until then, a real visitor's contact-form
submission returns "Something went wrong sending your message" — a
truthful failure, not a silent one, but not a working inbox either.

## 34. Nav Bar: `sticky` → `fixed` (explicit request)

§29/§33 explained why the header stayed `sticky` rather than `fixed` —
`sticky` already pins at top-of-viewport once scrolled past, without
needing a manual content offset. The user asked for `fixed` explicitly
and directly a second time, so this switches it for real rather than
re-litigating the tradeoff a third time.

`position: fixed` removes the header from document flow entirely, so
unlike `sticky` it does need a matching content offset or the page's own
content renders underneath it. To make that offset exact rather than an
estimate, both bars inside the header were changed from padding-driven
auto-height to explicit fixed heights: `AnnouncementBar` is `h-9` (2.25rem/
36px, flex-centered instead of `py-2`), the nav row is `h-16` (4rem/64px,
`py-4` replaced with `h-16 h-full` on the inner flex row). Total header
height is therefore an exact, known 6.25rem (100px) — not a guess — and
`(store)/layout.tsx` wraps `{children}` (not `Footer`, which should still
sit directly after content) in `pt-25` to match it exactly.

The one other spot that assumed the header's old height: `/sarees`'
mobile filter/sort bar was `sticky top-16` (64px — the nav row's height
alone, correct back when the announcement bar wasn't part of what it
needed to clear). With the header now fixed at a full 100px, that bar
would sit 36px too high (underneath the announcement bar) at `top-16`;
moved to `top-25` to sit flush beneath the fixed header instead. Grepped
for every other `sticky top-` in the codebase to confirm this was the
only other one depending on the old header height.

Verified via a local production build (`pnpm build && pnpm start` on
port 3001, since the user's own `pnpm dev` was occupying 3000 — never
touched that process) and `curl`: `<header class="fixed inset-x-0 top-0
z-40">`, both bars' `h-9`/`h-16` classes, `(store)/layout.tsx`'s `pt-25`
wrapper, and `/sarees`' `sticky top-25` are all present in the shipped
HTML exactly as intended.

## 35. Full Audit Pass

Requested as an exhaustive audit-fix-verify loop across the whole
application. Ran the mechanical checks directly (typecheck/lint/test/
build, all 32 required DB tables present, SEO metadata coverage,
secrets/gitignore hygiene) and delegated four parallel read-only deep
audits — Cashfree payment integration, auth/RBAC/IDOR, cart/stock/
coupon/refund business logic, and general security hardening — each
required to cite file:line for every claim rather than describe the
architecture from memory. Two genuinely new, concrete findings came out
of it; everything else the four audits checked (webhook signature
verification, payment idempotency, RLS policies, role restrictions,
checkout price/coupon server-side recalculation, secrets hygiene, rate
limiting, CSP, file upload limits, SQL injection surface) came back
PASS with evidence — see the individual fix commits/PR for the full
list of what was checked, not just what was wrong.

**Fixed — refund amount was a client round-trip, not a server ceiling.**
`initiateRefundAction` (`src/features/returns/admin-actions.ts`) used to
read `orderId`, `paymentId`, `userId`, and — critically —
`eligibleAmount` straight from hidden form fields, then checked the
submitted refund amount against that same client-supplied
`eligibleAmount`. Spec §56.14's "refund can never exceed eligible
amount" was therefore only ever checked against a number the client
itself provided — a tampered hidden field (devtools, or a raw POST)
could set an inflated ceiling and refund more than the return was
actually worth, or attribute the refund to an unrelated order/payment/
user. Fixed by deriving all four values server-side from `returnId`
alone, mirroring the exact calculation `getAdminReturnDetail` already
uses (`return_items` → `order_items.unit_price` × quantity) so the two
can never disagree. `InitiateRefundForm` no longer submits the three
now-unnecessary hidden fields; `eligibleAmount` stays as a display-only
prop (max/default on the amount input).

**Fixed — a confirmed-oversell was silently clamped to zero, no
record.** Checkout only ever checks a boolean "in stock at all"
(`get_product_availability`, Phase 4) — exact quantities are
deliberately never exposed to the browser — so a cart quantity larger
than what's actually left sailed through undetected. At payment
confirmation, `confirm_order_payment`'s inventory decrement was `update
inventory set quantity = greatest(0, quantity - x)` — floors at zero
with no error, no flag, nothing to tell an admin two orders just got
confirmed against the same last unit. Two-part fix:
- `supabase/migrations/20260822000000_fix_stock_oversell_detection.sql`
  replaces the function: still confirms the order and payment exactly
  as before (money is already captured by Cashfree by this point — the
  order can never be "rejected" here without keeping a customer's money
  with no order to show for it), but now locks the inventory row
  (`for update`) before comparing available quantity against what the
  order needs, and if it's short, inserts a clearly-labeled `OVERSOLD —
  ...` note into `order_status_history` for manual admin review. Returns
  a new `confirmed_oversold` result string (added to `confirm.ts`'s
  `ConfirmPaymentResult` type) alongside the existing `confirmed` —
  treated identically for the customer-facing confirmation email, since
  the oversell is an internal/admin concern, not something to expose to
  the customer via a different email.
- `src/features/checkout/actions.ts`'s `placeOrderAction` now also
  checks the *actual* inventory quantity (via a service-role read,
  never returned to the browser — preserves the existing "exact stock
  counts are admin-only" boundary) against the cart's requested
  quantity, rejecting with a generic "limited stock" message before an
  order can even be placed. This closes the common case (a single
  customer requesting more than what's left) — it does not fully
  eliminate the genuinely-concurrent race (two requests reading stock
  in the same instant, before either's order exists), which the
  migration above is the backstop for. A true reservation system (decrement
  at placement, release on abandonment/expiry) would close that
  remaining gap entirely but is a materially larger change — no
  expiry/cron for stale `PENDING_PAYMENT` orders exists yet either,
  which such a system would also need — flagged here rather than
  attempted half-finished.
- **This migration has not been applied to the live Supabase project**
  — same as every other migration in this repo, it needs to be run in
  the Supabase SQL Editor (see README's Database Setup section). The
  TypeScript changes are backward-compatible with the old function in
  the meantime (it never returns `"confirmed_oversold"`, so that branch
  is simply unreachable until the migration runs — no regression risk
  either way).

**Also fixed (minor, low severity):** `updatePasswordAction` was the one
auth action with no rate limiting (`src/lib/auth/actions.ts`) — added,
matching every other auth action's pattern. Not directly
brute-forceable pre-fix (requires an active Supabase recovery session),
just an inconsistency. Added `metadata` (page titles) to `/verify-email`
and `/account`, the two SEO-audit-flagged pages that are Server
Components; `login`/`register`/`forgot-password`/`reset-password`/
`track-order` are Client Components (can't export `metadata` at all)
and weren't worth wrapping in an extra file just for a browser tab
title.

**Confirmed clean, no code change needed:** all 32 spec-required DB
tables exist; `.env.local` is not git-tracked and no secret is ever
`NEXT_PUBLIC_`-prefixed; product pages have canonical URLs + JSON-LD
structured data; no raw/concatenated SQL anywhere in the tracked source;
Cashfree webhook signature verification uses the raw body + timing-safe
comparison; payment confirmation is idempotent via both a unique
`cashfree_event_id` constraint and a row-locked status recheck; wishlist
duplicates are prevented by a DB unique constraint; order/return status
transitions are re-validated server-side against the same
`ALLOWED_TRANSITIONS` maps the UI uses, not trusted from the client.

**Explicitly out of scope / needs production credentials, not
guessed:** live Cashfree sandbox/production request-response shapes
(the integration is written against Cashfree's docs, never exercised
against a real sandbox call); real concurrent-load behavior of the
oversell fix under actual simultaneous traffic (reasoned about, not
load-tested — no live DB/traffic tool available here); Resend domain
verification (already flagged in §24d/§33, unchanged); visual/responsive
testing across real devices (no browser available in this environment —
verified via rendered HTML/class presence and code review only, not a
substitute for actually looking at it).

## 36. Checkout Blocked by Default — FormData null vs. Zod's `.optional()`

A real user report: placing an order failed with a generic "Invalid
input" every time, even with a fully valid cart and address. Root
cause — `FormData.get(name)` returns `null` for a field that isn't in
the form's DOM at all, which happens by design in two places in
`checkout-form.tsx`: `guestEmail` only renders for guests (a logged-in
customer's form never has that input), and the entire billing-address
block only renders when "Same as shipping" is unticked — and it's
**checked by default** (`useState(true)`). So for the single most
common case — a logged-in customer leaving "Same as shipping" alone —
every optional field in `checkoutSchema` (`guestEmail`,
`billingFullName`, `billingPhone`, `billingLine1/2`, `billingCity`,
`billingState`, `billingPincode`) arrived as `null`. Zod's `.optional()`
widens a schema to accept `T | undefined` — not `null` — so the base
type check failed before any of the schema's own custom messages
(`"Enter full name"` etc.) ever ran, falling through to
`firstIssueMessage`'s generic `"Invalid input"` fallback. This blocked
checkout by default for essentially every customer, not an edge case.

Fixed in `placeOrderAction` (`src/features/checkout/actions.ts`) with a
small `field = (name) => formData.get(name) ?? undefined` helper used
for every field read into `checkoutSchema.safeParse(...)` — normalizes
"wasn't submitted" to the value `.optional()` actually expects. Found
and fixed the identical pattern in the admin product form
(`parseProductForm` in `src/features/products/admin-actions.ts`) at the
same time — an unchecked `<input type="checkbox">` (`blousePieceIncluded`,
`returnEligible`) submits nothing at all, hitting the exact same
null-vs-undefined gap. Confirmed both schemas' only other `.optional()`
users (`auth.ts`'s mobile field, `contact.ts`'s phone field) don't have
this exposure — their inputs are always present in the DOM, never
conditionally unmounted, so they only ever submit `""`, never `null`.

Verified two ways: `src/validations/checkout.test.ts` (new, permanent)
asserts `checkoutSchema` rejects the raw `null` shape FormData actually
produces and accepts it once normalized to `undefined` — both
assertions pass, directly proving the bug and the fix against the real
schema rather than a description of it. Then the full suite
(typecheck/lint/40 tests/build) reran clean.
