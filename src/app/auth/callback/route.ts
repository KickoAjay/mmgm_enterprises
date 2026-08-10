import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";

// Exchanges the PKCE code from a Supabase email link (signup confirmation
// or password recovery) for a session, then redirects onward. Used as the
// `emailRedirectTo` / `redirectTo` target for every auth email Supabase
// sends — see src/lib/auth/actions.ts.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
