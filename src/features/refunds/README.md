# Refunds

Implemented: Phase 10 — read-only. `refunds` has no customer-insert RLS policy at all (Phase 2:
"Admins manage refunds" is insert-only for `public.is_admin()`), matching spec §36/§37's "Initiate
Refund" being an admin action. `queries.ts` (`getMyRefunds`) is the only piece that exists —
the refund lifecycle state machine, eligible-amount validation (spec §56.14), and Cashfree refund
API integration all need an admin action to create the row in the first place, so they're
Phase 11.
