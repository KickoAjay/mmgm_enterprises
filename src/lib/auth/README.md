# Auth

Target phase: Phase 2 — Database + Authentication
Scope: Supabase Auth integration, session handling, RBAC role resolution.

- `actions.ts` — Server Actions bound directly to `<form action={...}>` via `useActionState` (sign up, sign in, sign out, request/complete password reset, resend verification email)
- `session.ts` — `getCurrentUser()`, `requireUser()`, `getAdminMembership()`, `requireAdmin()` — server-only, broad admin check backing `public.is_admin()`; fine-grained per-role checks land in Phase 11
