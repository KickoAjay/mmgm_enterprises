"use server";

import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";
import { getNextRefundStatus } from "@/features/refunds/status";

// Advances the tracked lifecycle by exactly one stage — spec §37's
// REQUESTED → APPROVED → INITIATED → PROCESSING → COMPLETED. This is
// bookkeeping only: no Cashfree Refunds API call happens at any stage
// (see docs/architecture.md §27), so "COMPLETED" here records that the
// refund was completed, it doesn't cause money to move.
export async function advanceRefundStatusAction(refundId: string): Promise<void> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
  const supabase = await createClient();

  const { data: refund } = await supabase
    .from("refunds")
    .select("status")
    .eq("id", refundId)
    .maybeSingle();
  if (!refund) return;

  const next = getNextRefundStatus(refund.status);
  if (!next) return;

  await supabase
    .from("refunds")
    .update({
      status: next,
      processed_at: next === "COMPLETED" ? new Date().toISOString() : null,
    })
    .eq("id", refundId);

  await logAdminAction({
    adminUserId: membership.id,
    action: "REFUND_STATUS_ADVANCED",
    entityType: "refunds",
    entityId: refundId,
    metadata: { newStatus: next },
  });
}
