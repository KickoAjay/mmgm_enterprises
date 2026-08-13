# Refunds

Customer-facing read-only view: Phase 10 (`queries.ts`, `getMyRefunds`). Admin half: Phase 11.
Full detail: [`docs/architecture.md` §27f](../../../docs/architecture.md).

- `status.ts` — labels, plus `getNextRefundStatus` (lives here, not `admin-actions.ts` — a
  `"use server"` file may only export async functions, and this is called from a Client
  Component).
- `admin-queries.ts` — `getAdminRefunds` (list, joined to order/customer).
- `admin-actions.ts` — `advanceRefundStatusAction`, moves a refund through spec §37's
  REQUESTED → APPROVED → INITIATED → PROCESSING → COMPLETED one stage at a time.
  **Bookkeeping only — no Cashfree Refunds API call happens at any stage.** `cashfree_refund_id`
  stays null; actually moving money is not implemented.

Refund rows themselves are created by `initiateRefundAction` in `src/features/returns/
admin-actions.ts` (a refund is initiated *from* an approved/returned return), not from anywhere
in this folder.
