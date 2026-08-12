# Cashfree

Implemented: Phase 8 — Cashfree Integration.

- `client.ts` — thin wrapper over the Cashfree Orders API (v2023-08-01): `createCashfreeOrder`
  (creates the order + payment session), `getCashfreeOrder` (server-to-server status/session
  lookup, used both to resume an in-progress session and to verify payment). `isCashfreeConfigured()`
  gates callers when `CASHFREE_APP_ID`/`CASHFREE_SECRET_KEY`/`CASHFREE_API_URL` aren't set.
- `webhook.ts` — `verifyCashfreeWebhookSignature()`, HMAC-SHA256 over the raw request body.

Built with no live Cashfree credentials in this environment — see
docs/architecture.md §23 for what that means (reviewed against Cashfree's documented API
shape, not yet exercised against a live sandbox; re-verify field/header names against the
current dashboard once real credentials exist).
