# Customers

Implemented: Phase 11. Full detail: [`docs/architecture.md` §27g](../../../docs/architecture.md).

- `queries.ts` — `getAdminCustomers` (list/search), `getAdminCustomerDetail` (profile + orders +
  total spending + returns + refunds). Never selects anything payment-credential-shaped (spec
  §39) — there's nothing of that shape in this schema to leak; Cashfree's hosted checkout means
  this app never touches card data.
- `actions.ts` — `setCustomerActiveAction`. Actually enforced at login (`signInAction` in
  `src/lib/auth/actions.ts` checks `users.is_active`), not a cosmetic flag.
