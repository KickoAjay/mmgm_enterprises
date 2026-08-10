import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Browser-side Supabase client — uses the anon key, subject to RLS.
// Safe to import from Client Components.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
