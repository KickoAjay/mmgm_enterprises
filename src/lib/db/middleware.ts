import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { hasSupabaseAuthSession } from "@/lib/db/auth-cookies";
import { fetchWithTimeout } from "@/lib/db/fetch-with-timeout";

// Refreshes the Supabase auth session on every request. Server Components
// can't write cookies themselves, so this runs in middleware instead —
// required for SSR session handling per Supabase's Next.js integration.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Anonymous traffic has no session to refresh — skip Auth entirely so a
  // flaky GoTrue endpoint cannot block catalog/homepage rendering.
  if (!hasSupabaseAuthSession(request)) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not remove — refreshing the token here is what keeps the session
  // alive for subsequent Server Component reads. Fail open: a broken Auth
  // service must not take down the storefront for logged-out visitors.
  try {
    const { error } = await supabase.auth.getUser();
    if (error) {
      clearSupabaseAuthCookies(request, supabaseResponse);
    }
  } catch {
    // Session refresh failed — clear stale cookies so the next request
    // skips Auth entirely instead of blocking again.
    clearSupabaseAuthCookies(request, supabaseResponse);
  }

  return supabaseResponse;
}

function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
) {
  for (const cookie of request.cookies.getAll()) {
    if (
      cookie.name.startsWith("sb-") &&
      cookie.name.includes("-auth-token")
    ) {
      response.cookies.delete(cookie.name);
    }
  }
}
