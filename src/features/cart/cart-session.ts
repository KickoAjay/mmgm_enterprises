import "server-only";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/db/server";
import { createServiceClient } from "@/lib/db/service";
import { getCurrentUser } from "@/lib/auth/session";
import type { Database } from "@/types/supabase";

const CART_COOKIE = "mmgm_cart_session";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CartContext = {
  cartId: string | null;
  supabase: SupabaseClient<Database>;
};

// Logged-in carts are read/written with the anon/session client — RLS
// ("Users manage own cart", Phase 2) already scopes them to auth.uid().
// Guest carts have no auth.uid() for RLS to check, so they go through the
// service-role client instead (deliberate, narrow exception — see
// docs/architecture.md §7/§19 for the same pattern with inventory reads).
async function resolveCartId(): Promise<CartContext> {
  const user = await getCurrentUser();

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    return { cartId: data?.id ?? null, supabase };
  }

  const supabase = createServiceClient();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_COOKIE)?.value;
  if (!sessionId) return { cartId: null, supabase };

  const { data } = await supabase
    .from("carts")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();
  return { cartId: data?.id ?? null, supabase };
}

// Read-only — safe to call from a Server Component render. Never creates a
// cart or sets a cookie (Next.js forbids writing cookies during render).
export async function getCartContext(): Promise<CartContext> {
  return resolveCartId();
}

// Creates the cart (and, for guests, the session cookie) if it doesn't
// exist yet. Only callable from a Server Action or Route Handler, where
// cookie writes are allowed.
export async function getOrCreateCartContext(): Promise<{
  cartId: string;
  supabase: SupabaseClient<Database>;
}> {
  const existing = await resolveCartId();
  if (existing.cartId) {
    return { cartId: existing.cartId, supabase: existing.supabase };
  }

  const user = await getCurrentUser();
  if (user) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("carts")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    return { cartId: data.id, supabase };
  }

  const supabase = createServiceClient();
  const sessionId = globalThis.crypto.randomUUID();
  const { data, error } = await supabase
    .from("carts")
    .insert({ session_id: sessionId })
    .select("id")
    .single();
  if (error) throw error;

  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });

  return { cartId: data.id, supabase };
}
