"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { createServiceClient } from "@/lib/db/service";
import { loginSchema } from "@/validations/auth";
import { getCurrentUser, requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export type AdminActionState = { error: string } | { success: true } | null;

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

// Same Supabase Auth backend as the storefront — the only difference is
// what happens after: a successful password check that doesn't resolve to
// an active admin_users row is signed straight back out. Deliberately the
// same "invalid email or password"-shaped rejection either way, so this
// can't be used to probe which emails have admin access.
export async function adminSignInAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`admin-login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) return { error: "Too many attempts. Please try again in a few minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Invalid email or password" };

  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  const { data: membership } = user
    ? await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  if (!membership) {
    await supabase.auth.signOut();
    return { error: "Invalid email or password" };
  }

  await supabase
    .from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", membership.id);

  redirect("/admin");
}

// Self-limiting: only succeeds while admin_users is completely empty (RLS
// backs this too — "First admin can self-bootstrap", migration
// 20260810180000). Assigns SUPER_ADMIN; every admin after this one is
// created via createAdminAction by an existing admin.
export async function bootstrapFirstAdminAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first, then return to this page" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (fullName.length < 2) return { error: "Enter your full name" };

  const supabase = await createClient();
  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    return { error: "An admin account already exists. Ask an existing admin to add you." };
  }

  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "SUPER_ADMIN")
    .maybeSingle();
  if (!role) return { error: "SUPER_ADMIN role is not seeded — check the database." };

  const { error } = await supabase
    .from("admin_users")
    .insert({ user_id: user.id, role_id: role.id, full_name: fullName });
  if (error) return { error: "Could not create the admin account. Please try again." };

  redirect("/admin");
}

export type AdminTeamMember = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roleName: string;
  isActive: boolean;
  lastLoginAt: string | null;
};

export async function getAdminTeam(): Promise<AdminTeamMember[]> {
  await requireRole(["SUPER_ADMIN"]);
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });
  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const roleIds = [...new Set(members.map((m) => m.role_id))];
  const [{ data: users }, { data: roles }] = await Promise.all([
    supabase.from("users").select("id, email").in("id", userIds),
    supabase.from("roles").select("id, name").in("id", roleIds),
  ]);
  const emailMap = new Map((users ?? []).map((u) => [u.id, u.email]));
  const roleNameMap = new Map((roles ?? []).map((r) => [r.id, r.name]));

  return members.map((m) => ({
    id: m.id,
    userId: m.user_id,
    fullName: m.full_name,
    email: emailMap.get(m.user_id) ?? "—",
    roleName: roleNameMap.get(m.role_id) ?? "—",
    isActive: m.is_active,
    lastLoginAt: m.last_login_at,
  }));
}

export async function getAdminRoles(): Promise<{ id: string; name: string }[]> {
  await requireRole(["SUPER_ADMIN"]);
  const supabase = await createClient();
  const { data } = await supabase.from("roles").select("id, name").order("name");
  return data ?? [];
}

// Promotes an existing registered customer account to an admin — simpler
// and safer than a separate admin-signup flow, since it reuses the same
// verified-email account rather than minting new credentials.
export async function createAdminAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const membership = await requireRole(["SUPER_ADMIN"]);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "");
  if (!email || !fullName || !roleId) return { error: "Fill in all fields" };

  const supabase = await createClient();
  const serviceSupabase = createServiceClient();

  const { data: targetUser } = await serviceSupabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!targetUser) {
    return { error: "No registered customer account found with that email" };
  }

  const { data: existing } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", targetUser.id)
    .maybeSingle();
  if (existing) return { error: "This person is already an admin" };

  const { error } = await supabase
    .from("admin_users")
    .insert({ user_id: targetUser.id, role_id: roleId, full_name: fullName });
  if (error) return { error: "Could not add admin. Please try again." };

  await logAdminAction({
    adminUserId: membership.id,
    action: "ADMIN_CREATED",
    entityType: "admin_users",
    entityId: targetUser.id,
    metadata: { email, roleId },
  });

  return { success: true };
}

export async function setAdminActiveAction(adminUserId: string, isActive: boolean): Promise<void> {
  const membership = await requireRole(["SUPER_ADMIN"]);
  const supabase = await createClient();
  await supabase.from("admin_users").update({ is_active: isActive }).eq("id", adminUserId);
  await logAdminAction({
    adminUserId: membership.id,
    action: isActive ? "ADMIN_ACTIVATED" : "ADMIN_DEACTIVATED",
    entityType: "admin_users",
    entityId: adminUserId,
  });
}
