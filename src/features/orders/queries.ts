import "server-only";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  placedAt: string | null;
  itemCount: number;
};

// Read with the session-scoped client — RLS ("Users view own orders",
// Phase 2) already restricts this to the signed-in user, the explicit
// getCurrentUser() check just lets callers render an empty state for a
// signed-out visitor without a redirect (same pattern as wishlist/queries.ts).
export async function getMyOrders(limit?: number): Promise<OrderListItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data: orders } = await query;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, quantity")
    .in("order_id", orderIds);

  const itemCounts = new Map<string, number>();
  for (const item of items ?? []) {
    itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + item.quantity);
  }

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    grandTotal: order.grand_total,
    placedAt: order.placed_at,
    itemCount: itemCounts.get(order.id) ?? 0,
  }));
}

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  placedAt: string | null;
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  items: {
    id: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  } | null;
  statusHistory: { status: string; note: string | null; createdAt: string }[];
  shipment: {
    courierName: string | null;
    trackingNumber: string | null;
    estimatedDelivery: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
};

export async function getMyOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order) return null;

  const [{ data: items }, addressResult, { data: history }, { data: shipment }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true }),
      order.shipping_address_id
        ? supabase
            .from("addresses")
            .select("*")
            .eq("id", order.shipping_address_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("order_status_history")
        .select("status, note, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true }),
      supabase.from("shipments").select("*").eq("order_id", order.id).maybeSingle(),
    ]);

  const address = addressResult.data;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    placedAt: order.placed_at,
    subtotal: order.subtotal,
    productDiscount: order.product_discount,
    couponDiscount: order.coupon_discount,
    shippingFee: order.shipping_fee,
    taxAmount: order.tax_amount,
    grandTotal: order.grand_total,
    items: (items ?? []).map((item) => ({
      id: item.id,
      productNameSnapshot: item.product_name_snapshot,
      skuSnapshot: item.sku_snapshot,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
    })),
    shippingAddress: address
      ? {
          fullName: address.full_name,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          phone: address.phone,
        }
      : null,
    statusHistory: (history ?? []).map((h) => ({
      status: h.status,
      note: h.note,
      createdAt: h.created_at,
    })),
    shipment: shipment
      ? {
          courierName: shipment.courier_name,
          trackingNumber: shipment.tracking_number,
          estimatedDelivery: shipment.estimated_delivery,
          shippedAt: shipment.shipped_at,
          deliveredAt: shipment.delivered_at,
        }
      : null,
  };
}
