import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";

// Server Component / Server Action only — never import from a Client
// Component (enforced by the "server-only" import above).

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Broad admin check (any active admin_users row) — mirrors the
// public.is_admin() RLS helper. Fine-grained per-role authorization is
// enforced in each admin Server Action/route once Phase 11 builds them;
// this is the RBAC entry point that later phase's checks build on top of.
export async function getAdminMembership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("id, role_id, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

export async function requireAdmin() {
  const membership = await getAdminMembership();
  if (!membership) redirect("/login");
  return membership;
}
