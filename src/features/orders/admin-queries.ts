import "server-only";
import { createClient } from "@/lib/db/server";
import type { OrderStatus } from "@/features/orders/status";

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  placedAt: string | null;
  customerLabel: string;
};

// Admin reads with the normal session-scoped client — RLS already gives
// admins full SELECT on orders (Phase 2).
export async function getAdminOrders(statusFilter?: string): Promise<AdminOrderListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (statusFilter) query = query.eq("status", statusFilter as OrderStatus);
  const { data: orders } = await query;
  if (!orders || orders.length === 0) return [];

  const userIds = [...new Set(orders.map((o) => o.user_id).filter((id): id is string => !!id))];
  const { data: users } =
    userIds.length > 0 ? await supabase.from("users").select("id, email").in("id", userIds) : { data: [] };
  const emailMap = new Map((users ?? []).map((u) => [u.id, u.email]));

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    grandTotal: o.grand_total,
    placedAt: o.placed_at,
    customerLabel: o.user_id ? (emailMap.get(o.user_id) ?? "—") : (o.guest_email ?? "Guest"),
  }));
}

export type AdminOrderDetail = {
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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { id: string; productNameSnapshot: string; skuSnapshot: string; quantity: number; lineTotal: number }[];
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
  } | null;
  paymentStatus: string | null;
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return null;

  const [
    { data: items },
    addressResult,
    { data: history },
    { data: shipment },
    userResult,
    { data: payment },
  ] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
    order.shipping_address_id
      ? supabase.from("addresses").select("*").eq("id", order.shipping_address_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("order_status_history")
      .select("status, note, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    supabase.from("shipments").select("*").eq("order_id", order.id).maybeSingle(),
    order.user_id
      ? supabase.from("users").select("email, mobile").eq("id", order.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("payments").select("status").eq("order_id", order.id).maybeSingle(),
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
    customerName: address?.full_name ?? "—",
    customerEmail: order.guest_email ?? userResult.data?.email ?? "—",
    customerPhone: order.guest_phone ?? userResult.data?.mobile ?? address?.phone ?? "—",
    items: (items ?? []).map((item) => ({
      id: item.id,
      productNameSnapshot: item.product_name_snapshot,
      skuSnapshot: item.sku_snapshot,
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
        }
      : null,
    paymentStatus: payment?.status ?? null,
  };
}
