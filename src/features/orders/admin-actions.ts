"use server";

import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";
import { sendOrderStatusUpdateNotification } from "@/features/payments/notify";
import { TIMELINE_STATUSES, getAllowedNextStatuses, type OrderStatus } from "@/features/orders/status";

export type OrderActionState = { error: string } | { success: true } | null;

const ALL_STATUSES = new Set<string>([...TIMELINE_STATUSES, "CANCELLED"]);

export async function updateOrderAction(
  _prevState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
  const orderId = String(formData.get("orderId") ?? "");
  const rawStatus = String(formData.get("status") ?? "");
  const newStatus: OrderStatus | null = ALL_STATUSES.has(rawStatus) ? (rawStatus as OrderStatus) : null;
  const courierName = String(formData.get("courierName") ?? "").trim() || null;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  const estimatedDelivery = String(formData.get("estimatedDelivery") ?? "").trim() || null;
  if (!orderId) return { error: "Missing order" };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "Order not found" };

  if (newStatus) {
    const allowed = getAllowedNextStatuses(order.status);
    if (!allowed.includes(newStatus)) {
      return { error: `Cannot move an order from ${order.status} to ${newStatus}` };
    }

    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) return { error: "Could not update order status" };

    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: newStatus,
      note: `Updated by admin`,
      changed_by: membership.id,
    });
  }

  if (courierName || trackingNumber || estimatedDelivery || newStatus === "SHIPPED" || newStatus === "DELIVERED") {
    const { data: existingShipment } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    const shipmentPatch: {
      courier_name?: string;
      tracking_number?: string;
      estimated_delivery?: string;
      shipped_at?: string;
      delivered_at?: string;
    } = {};
    if (courierName) shipmentPatch.courier_name = courierName;
    if (trackingNumber) shipmentPatch.tracking_number = trackingNumber;
    if (estimatedDelivery) shipmentPatch.estimated_delivery = estimatedDelivery;
    if (newStatus === "SHIPPED") shipmentPatch.shipped_at = new Date().toISOString();
    if (newStatus === "DELIVERED") shipmentPatch.delivered_at = new Date().toISOString();

    if (existingShipment) {
      await supabase.from("shipments").update(shipmentPatch).eq("id", existingShipment.id);
    } else if (Object.keys(shipmentPatch).length > 0) {
      await supabase.from("shipments").insert({ order_id: orderId, ...shipmentPatch });
    }
  }

  await logAdminAction({
    adminUserId: membership.id,
    action: "ORDER_UPDATED",
    entityType: "orders",
    entityId: orderId,
    metadata: { newStatus, courierName, trackingNumber, estimatedDelivery },
  });

  // Closes a gap flagged since Phase 8: these templates existed but had
  // no trigger because no order could ever change status. Only fires on
  // an actual transition to one of the three statuses the template
  // covers — not on every shipment-info edit.
  if (newStatus === "SHIPPED" || newStatus === "DELIVERED" || newStatus === "CANCELLED") {
    await sendOrderStatusUpdateNotification(orderId, {
      orderNumber: order.order_number,
      status: newStatus,
      courierName: courierName ?? undefined,
      trackingNumber: trackingNumber ?? undefined,
    });
  }

  return { success: true };
}
