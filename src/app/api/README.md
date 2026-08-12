# API Routes

- `webhooks/cashfree/route.ts` (Phase 8) — Cashfree payment webhook. A Route Handler rather
  than a Server Action because it needs the raw request body (for HMAC signature verification)
  and has no Next.js form/action semantics — it's called by Cashfree's servers, not the browser.

Target phase: Phase 9 — order/tracking endpoints that can't be Server Actions.
