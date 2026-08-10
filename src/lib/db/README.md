# Database

Target phase: Phase 2 — Database + Authentication
Scope: Supabase client factories.

- `client.ts` — browser client (anon key, RLS applies)
- `server.ts` — server client for Server Components/Actions (anon key, RLS applies, reads session from cookies)
- `service.ts` — service-role client (bypasses RLS; server-only, never import into a Client Component)
- `middleware.ts` — `updateSession()` helper used by `src/middleware.ts` to refresh the auth session

Typed query helpers beyond these factories land per-feature in later phases.
