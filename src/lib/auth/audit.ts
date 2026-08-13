import "server-only";
import { createServiceClient } from "@/lib/db/service";

// audit_logs has no insert RLS policy at all (view-only for admins,
// Phase 2) — every admin action writes here through the service role.
// Best-effort: a logging failure must never block the admin action itself.
export async function logAdminAction(params: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from("audit_logs").insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch {
    // Best-effort.
  }
}
