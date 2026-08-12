# Email

Order confirmation implemented as part of Phase 8 (pulled forward from the original Phase 13
scope, at the user's request, once payment confirmation existed to hang it off of). Other
notification types (refund status, shipment updates, etc.) are still Phase 13.

- `client.ts` — `sendEmail()`, a thin Resend wrapper. Never throws — a delivery failure must
  never undo an already-confirmed payment or order. `isEmailConfigured()` gates callers when
  `RESEND_API_KEY` isn't set.
- `templates/order-confirmation.ts` — `buildOrderConfirmationEmail()`, plain inline-styled
  HTML (no react-email dependency) + a plain-text fallback.

Orchestration (fetching order data, calling `sendEmail`, logging to `notifications`/
`notification_logs`) lives in `src/features/payments/notify.ts`, called from
`src/features/payments/confirm.ts` only on the `"confirmed"` transition — never on
`"already_confirmed"`, which is what stops the return-page/webhook race from double-sending.

No real Resend API key is configured in this environment — sends silently no-op (logged as
`FAILED` in `notification_logs`) until one is added to `.env.local`. Default sender is Resend's
sandbox address (`onboarding@resend.dev`), which only delivers to the account's own registered
email until a domain is verified.
