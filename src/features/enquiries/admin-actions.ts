"use server";

import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";

// Customer support's domain, same as returns/refunds admin actions.
const ENQUIRY_ROLES = ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"] as const;

export async function markEnquiryReadAction(enquiryId: string, isRead: boolean): Promise<void> {
  await requireRole([...ENQUIRY_ROLES]);
  const supabase = await createClient();
  await supabase.from("enquiries").update({ is_read: isRead }).eq("id", enquiryId);
}

export type DeleteEnquiryResult = { success: true } | { error: string };

export async function deleteEnquiryAction(enquiryId: string): Promise<DeleteEnquiryResult> {
  const membership = await requireRole([...ENQUIRY_ROLES]);
  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").delete().eq("id", enquiryId);
  if (error) return { error: "Could not delete the enquiry. Please try again." };

  await logAdminAction({
    adminUserId: membership.id,
    action: "ENQUIRY_DELETED",
    entityType: "enquiries",
    entityId: enquiryId,
  });

  return { success: true };
}
