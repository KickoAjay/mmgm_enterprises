# Payments

Implemented: Phase 8 — Cashfree Integration.

- `queries.ts` — `getOrderForPayment(orderId)`, read via the service-role client (same
  unguessable-UUID-as-access-token rationale as `checkout/queries.ts`).
- `confirm.ts` — `confirmPayment()`, a thin wrapper around the `confirm_order_payment()` SQL
  function (migration `20260810160000_phase8_payments.sql`). Called from both the
  payment-return page and the Cashfree webhook — safe to call twice for the same order
  (spec §56.9), since the SQL function does the idempotency guarding.
