import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Service-role Supabase client — bypasses Row Level Security entirely.
// Server-only. Never import into a Client Component or expose the service
// role key to the browser. Reserved for privileged server-side operations:
// server-computed order/payment writes, admin actions, webhook handlers,
// and guest-cart mutations that have no auth.uid() for RLS to check.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
