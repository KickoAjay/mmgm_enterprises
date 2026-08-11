# Wishlist

Target phase: Phase 6 — Cart + Wishlist
Scope: Wishlist add/remove/move-to-cart server actions, duplicate-prevention logic.

Requires login (spec §24 lives under /account/wishlist) — `toggleWishlistAction` returns
`{ requiresLogin: true }` for signed-out callers rather than erroring. Duplicate prevention
is enforced by the DB's unique `(wishlist_id, product_id)` constraint (spec §56.10), not
just application logic. `queries.ts` doesn't fetch per-product wishlist membership for
listing pages (would mean an extra query on every product card, everywhere) — the heart
icon shows accurate state only after you click it or on /account/wishlist itself.
