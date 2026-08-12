import "server-only";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";

export type ReturnEligibleItem = {
  orderItemId: string;
  name: string;
  sku: string;
  orderedQuantity: number;
  returnableQuantity: number;
};

export type ReturnEligibility =
  | { eligible: false; reason: string }
  | { eligible: true; deliveredAt: string; items: ReturnEligibleItem[] };

// Business rule §56.15 "only eligible orders can be returned" — checked
// here, not just displayed. Re-run server-side on submission
// (requestReturnAction), never trusted from what the form last rendered.
//
// "Delivered" is read from order_status_history rather than
// shipments.delivered_at — a status transition to DELIVERED always writes
// a history row (every admin action that will ever set it is expected to,
// same as every other status change in this app), whereas shipments is a
// separate table nothing is guaranteed to populate alongside it.
export async function getReturnEligibility(orderId: string): Promise<ReturnEligibility> {
  const user = await getCurrentUser();
  if (!user) return { eligible: false, reason: "Sign in to request a return" };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order) return { eligible: false, reason: "Order not found" };
  if (order.status !== "DELIVERED") {
    return { eligible: false, reason: "This order hasn't been delivered yet" };
  }

  const { data: deliveredHistory } = await supabase
    .from("order_status_history")
    .select("created_at")
    .eq("order_id", order.id)
    .eq("status", "DELIVERED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const deliveredAt = deliveredHistory?.created_at;
  if (!deliveredAt) {
    return { eligible: false, reason: "We couldn't confirm the delivery date for this order" };
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);
  if (!orderItems || orderItems.length === 0) {
    return { eligible: false, reason: "No items on this order" };
  }

  const productIds = orderItems.map((item) => item.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, return_eligible, return_period_days")
    .in("id", productIds);
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  const orderItemIds = orderItems.map((item) => item.id);
  const { data: existingReturnItems } = await supabase
    .from("return_items")
    .select("*")
    .in("order_item_id", orderItemIds);

  const alreadyRequestedQty = new Map<string, number>();
  if (existingReturnItems && existingReturnItems.length > 0) {
    const returnIds = [...new Set(existingReturnItems.map((ri) => ri.return_id))];
    const { data: returnRows } = await supabase
      .from("returns")
      .select("id, status")
      .in("id", returnIds);
    const returnStatusMap = new Map((returnRows ?? []).map((r) => [r.id, r.status]));
    for (const ri of existingReturnItems) {
      // A rejected return frees the quantity back up for a new request.
      if (returnStatusMap.get(ri.return_id) === "REJECTED") continue;
      alreadyRequestedQty.set(
        ri.order_item_id,
        (alreadyRequestedQty.get(ri.order_item_id) ?? 0) + ri.quantity,
      );
    }
  }

  const now = new Date();
  const items: ReturnEligibleItem[] = [];
  for (const item of orderItems) {
    const product = productMap.get(item.product_id);
    if (!product || !product.return_eligible) continue;

    const deadline = new Date(deliveredAt);
    deadline.setDate(deadline.getDate() + product.return_period_days);
    if (now > deadline) continue;

    const returnable = item.quantity - (alreadyRequestedQty.get(item.id) ?? 0);
    if (returnable <= 0) continue;

    items.push({
      orderItemId: item.id,
      name: item.product_name_snapshot,
      sku: item.sku_snapshot,
      orderedQuantity: item.quantity,
      returnableQuantity: returnable,
    });
  }

  if (items.length === 0) {
    return { eligible: false, reason: "No items on this order are eligible for return" };
  }

  return { eligible: true, deliveredAt, items };
}
