# Types

Target phase: Ongoing, per feature phase
Scope: Shared TypeScript types/interfaces, generated Supabase DB types (Phase 2 onward).

`supabase.ts` is a hand-maintained partial `Database` type (users/profiles/roles/admin_users
only) until the Supabase CLI is available to run `supabase gen types typescript` for the
full schema — see the note at the top of that file.
