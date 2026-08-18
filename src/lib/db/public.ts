import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Anon-key client with no cookie adapter — unlike the session-scoped
// client (db/server.ts), this never calls next/headers' cookies(), so it
// can be used inside unstable_cache (Next.js forbids dynamic APIs in a
// cached function). Still fully RLS-enforced as a logged-out visitor
// (no auth.uid(), is_admin() false) — safe for the public catalog/product
// reads this backs, which already carry the same "public active rows
// only" filters a real anonymous session would see. Never use this for
// anything that should differ per logged-in user.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
