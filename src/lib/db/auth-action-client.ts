import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { fetchWithTimeout } from "@/lib/db/fetch-with-timeout";

const AUTH_ACTION_TIMEOUT_MS = 10_000;

// Session-aware client for login/signup/password actions only.
// Uses a longer timeout than middleware so a slow Auth service fails in
// ~10s instead of hanging for minutes, without capping database queries.
export async function createAuthActionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) =>
          fetchWithTimeout(input, init, AUTH_ACTION_TIMEOUT_MS),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
