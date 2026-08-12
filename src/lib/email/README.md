# Email

Full detail: [`docs/architecture.md` §24](../../../docs/architecture.md). Order confirmation
started in Phase 8; welcome/payment-confirmation/admin-alert/test-route/status-update templates
were added once a real Resend account was connected. Shipment/delivery/cancellation emails have
templates but no trigger yet — no admin order-status-management feature exists in this codebase.

- `client.ts` — `sendEmail()`, the only caller of the Resend SDK. Never throws. `from` always
  comes from `EMAIL_FROM`, never a parameter. Validates `to` via zod. `isEmailConfigured()`
  gates every caller.
- `log.ts` — `logEmailDelivery()`, shared by every email caller; writes to
  `notifications`/`notification_logs` regardless of send outcome.
- `templates/shared.ts` — `emailShell()`, `summaryRow()`, `ctaButton()`, `escapeHtml()`,
  `formatEmailDate()` — one consistent brand wrapper for every template below.
- `templates/order-confirmation.ts`, `payment-confirmation.ts`, `admin-new-order.ts`,
  `welcome.ts`, `test-email.ts`, `order-status-update.ts`.

Orchestration lives in `src/features/payments/notify.ts` (order/payment/admin emails, fired
from `confirmPayment()` only on the `"confirmed"` transition — never `"already_confirmed"`,
which is what stops the payment-return-page/webhook race from double-sending) and
`src/lib/auth/notify.ts` (welcome email, fired from `signUpAction`).

`mmgmenterprises.com` is not yet verified in Resend (confirmed via a live API call) — `EMAIL_FROM`
is the sandbox address (`onboarding@resend.dev`) until it is. See architecture.md §24d for the
domain-verification steps.
