# Cart

Target phase: Phase 6 — Cart + Wishlist
Scope: Cart server actions, server-side price/discount/tax recalculation, cart UI logic.

- `cart-session.ts` — resolves the current cart (logged-in via `user_id`/RLS, guest via a
  `mmgm_cart_session` cookie + service-role client). `getCartContext()` is read-only
  (Server Component safe); `getOrCreateCartContext()` creates the cart/cookie and is only
  callable from a Server Action.
- `queries.ts` — `getCartSummary()`, `getCartItemCount()`. Prices always come from the live
  `products` row, never `cart_items.unit_price_snapshot` (spec §56.3).
- `actions.ts` — add/update/remove, with server-side stock clamping (spec §56.2) via the
  admin-only `inventory` table (read through the service-role client, not exposed raw).
- Coupon/shipping/tax calculation is Phase 7 (Checkout) — the cart page shows subtotal only.
- Known gap: no guest→user cart merge on login yet.
