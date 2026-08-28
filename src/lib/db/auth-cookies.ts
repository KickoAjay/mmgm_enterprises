import type { NextRequest } from "next/server";

// Supabase SSR stores session chunks as sb-<project-ref>-auth-token[.N].
// Skip Auth network calls for anonymous visitors — nothing to refresh.
export function hasSupabaseAuthSessionFromCookies(
  cookies: { name: string }[],
): boolean {
  return cookies.some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"),
  );
}

export function hasSupabaseAuthSession(request: NextRequest): boolean {
  return hasSupabaseAuthSessionFromCookies(request.cookies.getAll());
}
