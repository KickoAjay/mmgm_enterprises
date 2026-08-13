"use server";

import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";

// Actually enforced at login (src/lib/auth/actions.ts signInAction checks
// users.is_active) — this isn't a cosmetic flag.
export async function setCustomerActiveAction(userId: string, isActive: boolean): Promise<void> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"]);
  const supabase = await createClient();
  await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
  await logAdminAction({
    adminUserId: membership.id,
    action: isActive ? "CUSTOMER_ENABLED" : "CUSTOMER_DISABLED",
    entityType: "users",
    entityId: userId,
  });
}
