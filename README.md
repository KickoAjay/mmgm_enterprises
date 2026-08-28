# MMGM Enterprises

A premium saree e-commerce storefront and admin dashboard, built with Next.js 16 (App Router), Supabase (Postgres + Auth + Storage), and Cashfree Payments.

See [`docs/architecture.md`](docs/architecture.md) for the full system design (ERD, RLS policies, order/return/refund lifecycles, payment flow) and [`docs/original-spec.md`](docs/original-spec.md) for the original product spec this was built against.

## Tech stack

- **Framework**: Next.js 16 (App Router, Server Actions), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend**: Supabase (Postgres, Auth, Storage, Row Level Security)
- **Payments**: Cashfree Payments (Orders API)
- **Email**: Resend
- **Testing**: Vitest
- **Package manager**: pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything | Public — safe to expose, RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | Guest checkout, webhooks, admin bootstrap | **Secret** — server-only, never exposed to the browser |
| `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` | Checkout | From the Cashfree dashboard (sandbox or production) |
| `CASHFREE_API_URL` | Checkout | `https://sandbox.cashfree.com/pg` or the production equivalent |
| `CASHFREE_WEBHOOK_SECRET` | Payment confirmation | Optional — defaults to `CASHFREE_SECRET_KEY` (Cashfree uses the same PG secret for webhook signatures) |
| `RESEND_API_KEY` | Transactional email | From resend.com |
| `EMAIL_FROM` | Transactional email | Must be a verified sender/domain in Resend |
| `ADMIN_NOTIFICATION_EMAIL` | Admin new-order alerts | Optional — leave unset to skip that email |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects, emails, sitemap, canonical URLs | e.g. `https://mmgmenterprises.com` in production |

Never prefix a secret (`SUPABASE_SERVICE_ROLE_KEY`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`, `RESEND_API_KEY`) with `NEXT_PUBLIC_` — that prefix ships the value to every visitor's browser.

## Database setup

Migrations live in `supabase/migrations/`, applied in filename order via the Supabase SQL Editor (this project has no CLI/CI-driven migration runner — apply each file's contents manually, in order, on a fresh project):

1. `20260810120000_init_schema.sql` — full schema (tables, enums, triggers)
2. `20260810130000_phase2_auth_and_rls.sql` — RLS policies, auth triggers
3. `20260810140000_phase4_catalog.sql`
4. `20260810150000_phase7_guest_checkout.sql`
5. `20260810160000_phase8_payments.sql`
6. `20260810170000_phase10_returns_storage.sql`
7. `20260810180000_phase11_admin.sql`
8. `20260810190000_phase14_security.sql`
9. `20260822000000_fix_stock_oversell_detection.sql`
10. `20260824000000_add_enquiries.sql` — Enquiries admin inbox (Contact form submissions)

Then seed demo data with `supabase/seed.sql` (optional, but the storefront has nothing to show without it).

### First admin account

There's no seeded admin. Register a normal account at `/register`, then sign in and visit `/admin/setup` — it's only reachable while `admin_users` is empty, and creates the first admin (`SUPER_ADMIN` role) for whichever account visits it. Every admin after that is added from `/admin/team` by an existing `SUPER_ADMIN`.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run a production build locally |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Run the test suite once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm format` / `pnpm format:check` | Prettier |

## Deploying to Vercel

1. Import the repo into Vercel — it's a standard Next.js project, no extra build configuration needed.
2. Set every variable from [Environment variables](#environment-variables) above in the Vercel project settings (Production + Preview as appropriate).
3. Point `NEXT_PUBLIC_SITE_URL` at the real production domain.
4. In the Cashfree dashboard, set the webhook URL to `https://<your-domain>/api/webhooks/cashfree`. Webhook signatures use `CASHFREE_SECRET_KEY` automatically — `CASHFREE_WEBHOOK_SECRET` is only needed if you want to override that.
5. In Resend, verify the sending domain (resend.com/domains) and update `EMAIL_FROM` to use it — until then, Resend's sandbox sender only delivers to the Resend account's own registered address.
6. Run the Supabase migrations (see above) against the production project before the first deploy.

## Project structure

See [`docs/architecture.md`](docs/architecture.md) §3 for the full folder layout. Broad strokes: `src/app` (routes), `src/components` (UI), `src/features` (business logic + data access, one folder per domain), `src/lib` (cross-cutting: auth, db clients, email, security, SEO).
