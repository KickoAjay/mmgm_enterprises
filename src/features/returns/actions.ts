"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getReturnEligibility } from "@/features/returns/eligibility";
import { RETURN_REASONS } from "@/features/returns/status";

export type ReturnActionState = { error: string } | null;

// Inserts go through the normal session-scoped client, not service-role —
// RLS already allows a user to create their own return/return_items rows
// ("Users create own return requests"/"Users create own return items",
// Phase 2), the same shape as cart/wishlist writes.
export async function requestReturnAction(
  _prevState: ReturnActionState,
  formData: FormData,
): Promise<ReturnActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to request a return" };

  const orderId = String(formData.get("orderId") ?? "");
  const orderItemId = String(formData.get("orderItemId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const quantityRaw = Number(formData.get("quantity"));
  const imagePaths = formData.getAll("imagePaths").map(String).filter(Boolean);

  if (!orderId || !orderItemId || !reason) {
    return { error: "Fill in all required fields" };
  }
  if (!(RETURN_REASONS as readonly string[]).includes(reason)) {
    return { error: "Select a valid reason" };
  }
  if (!Number.isFinite(quantityRaw) || quantityRaw < 1) {
    return { error: "Enter a valid quantity" };
  }

  // Re-verify eligibility server-side — the form's displayed limits are
  // just UX, never trusted for the actual write (spec §56.15).
  const eligibility = await getReturnEligibility(orderId);
  if (!eligibility.eligible) return { error: eligibility.reason };
  const eligibleItem = eligibility.items.find((item) => item.orderItemId === orderItemId);
  if (!eligibleItem) return { error: "This item isn't eligible for return" };
  if (quantityRaw > eligibleItem.returnableQuantity) {
    return { error: `You can return at most ${eligibleItem.returnableQuantity} of this item` };
  }
  if (imagePaths.length > 5) {
    return { error: "Attach at most 5 images" };
  }

  const supabase = await createClient();
  const { data: returnRow, error: returnError } = await supabase
    .from("returns")
    .insert({
      order_id: orderId,
      user_id: user.id,
      reason: notes ? `${reason}: ${notes}` : reason,
    })
    .select("id")
    .single();
  if (returnError) return { error: "Could not submit your return request. Please try again." };

  const { error: itemError } = await supabase.from("return_items").insert({
    return_id: returnRow.id,
    order_item_id: orderItemId,
    quantity: quantityRaw,
    image_urls: imagePaths,
  });
  if (itemError) return { error: "Could not save return details. Please try again." };

  redirect(`/account/returns/${returnRow.id}`);
}
