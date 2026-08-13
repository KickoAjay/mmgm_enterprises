import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { createServiceClient } from "@/lib/db/service";

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

export type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "ORDER_MANAGER"
  | "PRODUCT_MANAGER"
  | "INVENTORY_MANAGER"
  | "CUSTOMER_SUPPORT";

export type AdminMembership = {
  id: string;
  userId: string;
  roleId: string;
  roleName: AdminRole;
  fullName: string;
};

// Broad admin check (any active admin_users row) — mirrors the
// public.is_admin() RLS helper, plus resolves the role name so callers
// can do role-based authorization (spec §41: "permissions must be
// enforced server-side"). Role checks here are name-based rather than
// against the granular `permissions`/`role_permissions` tables — those
// exist in the schema but were never seeded with any permission codes,
// and spec §41 only requires roles + server-side enforcement, not that
// specific table being populated.
export async function getAdminMembership(): Promise<AdminMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("admin_users")
    .select("id, role_id, full_name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!membership) return null;

  const { data: role } = await supabase
    .from("roles")
    .select("name")
    .eq("id", membership.role_id)
    .maybeSingle();
  if (!role) return null;

  return {
    id: membership.id,
    userId: user.id,
    roleId: membership.role_id,
    roleName: role.name as AdminRole,
    fullName: membership.full_name,
  };
}

export async function requireAdmin(): Promise<AdminMembership> {
  const membership = await getAdminMembership();
  if (membership) return membership;

  // admin_users' own SELECT policy is admin-only, so a non-admin caller
  // can't tell an empty table from one they just can't see — check via
  // service-role instead. Sends a genuinely adminless install to
  // /admin/setup instead of a login page that would otherwise dead-end.
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true });
  redirect((count ?? 0) === 0 ? "/admin/setup" : "/admin/login");
}

// Redirects to the dashboard (not /admin/login — the caller already is an
// admin, just not one of the roles this section requires) rather than
// rendering a 403, since there's no admin error-page UI built yet.
export async function requireRole(allowed: AdminRole[]): Promise<AdminMembership> {
  const membership = await requireAdmin();
  if (!allowed.includes(membership.roleName)) redirect("/admin");
  return membership;
}
