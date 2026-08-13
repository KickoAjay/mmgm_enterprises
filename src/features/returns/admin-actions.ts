"use server";

import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";
import { getAllowedReturnTransitions, type ReturnStatus } from "@/features/returns/status";

export type ReturnActionState = { error: string } | { success: true } | null;

export async function updateReturnStatusAction(
  _prevState: ReturnActionState,
  formData: FormData,
): Promise<ReturnActionState> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
  const returnId = String(formData.get("returnId") ?? "");
  const newStatus = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  if (!returnId || !newStatus) return { error: "Missing required fields" };

  const supabase = await createClient();
  const { data: returnRow } = await supabase
    .from("returns")
    .select("status")
    .eq("id", returnId)
    .maybeSingle();
  if (!returnRow) return { error: "Return not found" };

  const allowed = getAllowedReturnTransitions(returnRow.status);
  if (!allowed.includes(newStatus as ReturnStatus)) {
    return { error: `Cannot move a return from ${returnRow.status} to ${newStatus}` };
  }

  const isTerminal = newStatus === "REJECTED" || newStatus === "RETURNED";
  const { error } = await supabase
    .from("returns")
    .update({
      status: newStatus as ReturnStatus,
      admin_note: adminNote || null,
      resolved_at: isTerminal ? new Date().toISOString() : null,
    })
    .eq("id", returnId);
  if (error) return { error: "Could not update the return. Please try again." };

  await logAdminAction({
    adminUserId: membership.id,
    action: "RETURN_STATUS_UPDATED",
    entityType: "returns",
    entityId: returnId,
    metadata: { newStatus },
  });

  return { success: true };
}

// Records the refund as a real, trackable entity linked to order/payment/
// customer/amount (spec §37) — creating this row is as far as this phase
// goes. No Cashfree Refunds API call happens here; actually moving money
// is a separate integration this phase doesn't attempt (see
// docs/architecture.md §27 for why). cashfree_refund_id stays null.
export async function initiateRefundAction(
  _prevState: ReturnActionState,
  formData: FormData,
): Promise<ReturnActionState> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
  const returnId = String(formData.get("returnId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const paymentId = String(formData.get("paymentId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const eligibleAmount = Number(formData.get("eligibleAmount") ?? "0");
  const amountRaw = Number(formData.get("amount") ?? "0");

  if (!returnId || !orderId || !paymentId || !userId) {
    return { error: "Missing required fields" };
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return { error: "Enter a valid refund amount" };
  }
  // Business rule §56.14 — never allow refund amount greater than
  // eligible amount, enforced server-side regardless of what the form
  // last displayed.
  if (amountRaw > eligibleAmount) {
    return { error: `Refund amount cannot exceed the eligible amount of ₹${eligibleAmount}` };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("refunds")
    .select("id")
    .eq("return_id", returnId)
    .maybeSingle();
  if (existing) return { error: "A refund has already been initiated for this return" };

  const { error } = await supabase.from("refunds").insert({
    return_id: returnId,
    order_id: orderId,
    payment_id: paymentId,
    user_id: userId,
    amount: amountRaw,
    status: "REQUESTED",
  });
  if (error) return { error: "Could not initiate the refund. Please try again." };

  await logAdminAction({
    adminUserId: membership.id,
    action: "REFUND_INITIATED",
    entityType: "refunds",
    entityId: returnId,
    metadata: { orderId, amount: amountRaw },
  });

  return { success: true };
}
