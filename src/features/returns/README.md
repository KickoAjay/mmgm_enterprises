# Returns

Implemented: Phase 10 — customer-facing half only (request, view, photo evidence). Full detail:
[`docs/architecture.md` §26](../../../docs/architecture.md). The admin approve/reject/pickup/
mark-returned workflow named in the original scope is Phase 11 — `returns`/`return_items` have
no admin-write code anywhere yet.

- `status.ts` — status/reason label constants.
- `eligibility.ts` — `getReturnEligibility(orderId)`, enforced both when rendering the request
  form and again inside `actions.ts` (never trust the client).
- `actions.ts` — `requestReturnAction`, inserts via the normal session-scoped client (RLS already
  allows a customer to create their own return).
- `queries.ts` — `getMyReturns`, `getMyReturnDetail` (generates signed URLs for evidence photos),
  `getMyRefunds` (read-only — refunds have no customer-insert path, admin-only).
