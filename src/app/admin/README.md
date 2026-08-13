# Admin Panel

Implemented: Phase 11. Full detail: [`docs/architecture.md` §27](../../../docs/architecture.md).

Plain folder (not a route group) because the spec requires a real `/admin` URL prefix.

- `login/`, `setup/` — public/customer-auth-only entry points, outside the admin auth gate.
- `(dashboard)/` — route group carrying the actual auth gate (`requireAdmin()`/`requireRole()`
  in its `layout.tsx`) plus the sidebar nav, so `/admin/login` and `/admin/setup` stay reachable
  without already being an admin. Everything under here needs an active `admin_users` row.

Inventory (stock adjustment UI) and Coupons (admin CRUD) are Phase 12, not here, despite spec
§60's admin journey mentioning "Change Stock" and "Manage Coupons" — basic stock quantity is
still editable from the product edit form (spec §32 lists "Stock" as a product-managed field),
just not the dedicated audit-trailed inventory workflow from spec §34.
