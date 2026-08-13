import "server-only";
import { createClient } from "@/lib/db/server";

export type AdminReturnListItem = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  reason: string;
  status: string;
  requestedAt: string;
};

export async function getAdminReturns(): Promise<AdminReturnListItem[]> {
  const supabase = await createClient();
  const { data: returns } = await supabase
    .from("returns")
    .select("*")
    .order("requested_at", { ascending: false });
  if (!returns || returns.length === 0) return [];

  const orderIds = [...new Set(returns.map((r) => r.order_id))];
  const userIds = [...new Set(returns.map((r) => r.user_id))];
  const [{ data: orders }, { data: users }] = await Promise.all([
    supabase.from("orders").select("id, order_number").in("id", orderIds),
    supabase.from("users").select("id, email").in("id", userIds),
  ]);
  const orderNumberMap = new Map((orders ?? []).map((o) => [o.id, o.order_number]));
  const emailMap = new Map((users ?? []).map((u) => [u.id, u.email]));

  return returns.map((r) => ({
    id: r.id,
    orderNumber: orderNumberMap.get(r.order_id) ?? "—",
    customerEmail: emailMap.get(r.user_id) ?? "—",
    reason: r.reason,
    status: r.status,
    requestedAt: r.requested_at,
  }));
}

export type AdminReturnDetail = {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  reason: string;
  status: string;
  requestedAt: string;
  adminNote: string | null;
  items: { productName: string; sku: string; quantity: number; imageUrls: string[] }[];
  eligibleRefundAmount: number;
  paymentId: string | null;
  existingRefund: { id: string; amount: number; status: string } | null;
};

export async function getAdminReturnDetail(returnId: string): Promise<AdminReturnDetail | null> {
  const supabase = await createClient();
  const { data: returnRow } = await supabase
    .from("returns")
    .select("*")
    .eq("id", returnId)
    .maybeSingle();
  if (!returnRow) return null;

  const [{ data: order }, { data: user }, { data: returnItems }, { data: payment }, { data: refund }] =
    await Promise.all([
      supabase.from("orders").select("order_number").eq("id", returnRow.order_id).maybeSingle(),
      supabase.from("users").select("email").eq("id", returnRow.user_id).maybeSingle(),
      supabase.from("return_items").select("*").eq("return_id", returnRow.id),
      supabase.from("payments").select("id").eq("order_id", returnRow.order_id).maybeSingle(),
      supabase.from("refunds").select("id, amount, status").eq("return_id", returnRow.id).maybeSingle(),
    ]);

  const orderItemIds = (returnItems ?? []).map((ri) => ri.order_item_id);
  const { data: orderItemRows } =
    orderItemIds.length > 0
      ? await supabase
          .from("order_items")
          .select("id, product_name_snapshot, sku_snapshot, unit_price")
          .in("id", orderItemIds)
      : { data: [] };
  const orderItemMap = new Map((orderItemRows ?? []).map((oi) => [oi.id, oi]));

  const items: AdminReturnDetail["items"] = [];
  let eligibleRefundAmount = 0;
  for (const ri of returnItems ?? []) {
    const oi = orderItemMap.get(ri.order_item_id);
    eligibleRefundAmount += (oi?.unit_price ?? 0) * ri.quantity;

    let imageUrls: string[] = [];
    if (ri.image_urls.length > 0) {
      const { data: signed } = await supabase.storage
        .from("return-evidence")
        .createSignedUrls(ri.image_urls, 3600);
      imageUrls = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => Boolean(u));
    }

    items.push({
      productName: oi?.product_name_snapshot ?? "Item",
      sku: oi?.sku_snapshot ?? "",
      quantity: ri.quantity,
      imageUrls,
    });
  }

  return {
    id: returnRow.id,
    orderId: returnRow.order_id,
    orderNumber: order?.order_number ?? "—",
    userId: returnRow.user_id,
    customerEmail: user?.email ?? "—",
    reason: returnRow.reason,
    status: returnRow.status,
    requestedAt: returnRow.requested_at,
    adminNote: returnRow.admin_note,
    items,
    eligibleRefundAmount,
    paymentId: payment?.id ?? null,
    existingRefund: refund ? { id: refund.id, amount: refund.amount, status: refund.status } : null,
  };
}
