import "server-only";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";

export type ReturnListItem = {
  id: string;
  orderNumber: string;
  reason: string;
  status: string;
  requestedAt: string;
  itemSummary: string;
};

// Read with the session-scoped client — RLS ("Users view own returns",
// Phase 2) already restricts these to auth.uid(), same as orders/cart.
export async function getMyReturns(): Promise<ReturnListItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();

  const { data: returns } = await supabase
    .from("returns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (!returns || returns.length === 0) return [];

  const orderIds = [...new Set(returns.map((r) => r.order_id))];
  const returnIds = returns.map((r) => r.id);

  const [{ data: orders }, { data: returnItems }] = await Promise.all([
    supabase.from("orders").select("id, order_number").in("id", orderIds),
    supabase.from("return_items").select("*").in("return_id", returnIds),
  ]);
  const orderNumberMap = new Map((orders ?? []).map((o) => [o.id, o.order_number]));

  const orderItemIds = [...new Set((returnItems ?? []).map((ri) => ri.order_item_id))];
  const { data: orderItemRows } =
    orderItemIds.length > 0
      ? await supabase.from("order_items").select("id, product_name_snapshot").in("id", orderItemIds)
      : { data: [] };
  const itemNameMap = new Map((orderItemRows ?? []).map((oi) => [oi.id, oi.product_name_snapshot]));

  const itemsByReturn = new Map<string, string[]>();
  for (const ri of returnItems ?? []) {
    const name = itemNameMap.get(ri.order_item_id) ?? "Item";
    const list = itemsByReturn.get(ri.return_id) ?? [];
    list.push(`${name} × ${ri.quantity}`);
    itemsByReturn.set(ri.return_id, list);
  }

  return returns.map((r) => ({
    id: r.id,
    orderNumber: orderNumberMap.get(r.order_id) ?? "—",
    reason: r.reason,
    status: r.status,
    requestedAt: r.requested_at,
    itemSummary: (itemsByReturn.get(r.id) ?? []).join(", "),
  }));
}

export type ReturnDetail = {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
  adminNote: string | null;
  items: { productName: string; sku: string; quantity: number; imageUrls: string[] }[];
  refund: { amount: number; status: string; processedAt: string | null } | null;
};

export async function getMyReturnDetail(returnId: string): Promise<ReturnDetail | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: returnRow } = await supabase
    .from("returns")
    .select("*")
    .eq("id", returnId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!returnRow) return null;

  const [{ data: order }, { data: returnItems }, { data: refund }] = await Promise.all([
    supabase.from("orders").select("order_number").eq("id", returnRow.order_id).maybeSingle(),
    supabase.from("return_items").select("*").eq("return_id", returnRow.id),
    supabase.from("refunds").select("*").eq("return_id", returnRow.id).maybeSingle(),
  ]);

  const orderItemIds = (returnItems ?? []).map((ri) => ri.order_item_id);
  const { data: orderItemRows } =
    orderItemIds.length > 0
      ? await supabase
          .from("order_items")
          .select("id, product_name_snapshot, sku_snapshot")
          .in("id", orderItemIds)
      : { data: [] };
  const orderItemMap = new Map((orderItemRows ?? []).map((oi) => [oi.id, oi]));

  const items: ReturnDetail["items"] = [];
  for (const ri of returnItems ?? []) {
    const oi = orderItemMap.get(ri.order_item_id);
    let imageUrls: string[] = [];
    if (ri.image_urls.length > 0) {
      // Signed, short-lived — the bucket is private (Phase 10 migration).
      const { data: signed } = await supabase.storage
        .from("return-evidence")
        .createSignedUrls(ri.image_urls, 3600);
      imageUrls = (signed ?? [])
        .map((s) => s.signedUrl)
        .filter((url): url is string => Boolean(url));
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
    reason: returnRow.reason,
    status: returnRow.status,
    requestedAt: returnRow.requested_at,
    resolvedAt: returnRow.resolved_at,
    adminNote: returnRow.admin_note,
    items,
    refund: refund
      ? { amount: refund.amount, status: refund.status, processedAt: refund.processed_at }
      : null,
  };
}
