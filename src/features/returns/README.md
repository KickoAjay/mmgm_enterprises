# Returns

Customer-facing half: Phase 10 (request, view, photo evidence). Admin half: Phase 11
(approve/reject/pickup/mark-returned, initiate refund). Full detail:
[`docs/architecture.md` §26](../../../docs/architecture.md) and
[§27f](../../../docs/architecture.md).

- `status.ts` — status/reason label constants, plus `getAllowedReturnTransitions` (lives here,
  not in `admin-actions.ts`, since a `"use server"` file may only export async functions and
  this is called from a Client Component).
- `eligibility.ts` — `getReturnEligibility(orderId)`, enforced both when rendering the request
  form and again inside `actions.ts` (never trust the client).
- `actions.ts` — `requestReturnAction`, inserts via the normal session-scoped client (RLS already
  allows a customer to create their own return).
- `queries.ts` — `getMyReturns`, `getMyReturnDetail` (generates signed URLs for evidence photos).
- `admin-queries.ts` / `admin-actions.ts` — `getAdminReturns`/`getAdminReturnDetail`,
  `updateReturnStatusAction`, `initiateRefundAction` (refund amount capped server-side at the
  return's eligible amount, spec §56.14).
