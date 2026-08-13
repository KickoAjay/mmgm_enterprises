import "server-only";
import { createClient } from "@/lib/db/server";

export type AdminRefundListItem = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
};

export async function getAdminRefunds(): Promise<AdminRefundListItem[]> {
  const supabase = await createClient();
  const { data: refunds } = await supabase
    .from("refunds")
    .select("*")
    .order("created_at", { ascending: false });
  if (!refunds || refunds.length === 0) return [];

  const orderIds = [...new Set(refunds.map((r) => r.order_id))];
  const userIds = [...new Set(refunds.map((r) => r.user_id))];
  const [{ data: orders }, { data: users }] = await Promise.all([
    supabase.from("orders").select("id, order_number").in("id", orderIds),
    supabase.from("users").select("id, email").in("id", userIds),
  ]);
  const orderNumberMap = new Map((orders ?? []).map((o) => [o.id, o.order_number]));
  const emailMap = new Map((users ?? []).map((u) => [u.id, u.email]));

  return refunds.map((r) => ({
    id: r.id,
    orderNumber: orderNumberMap.get(r.order_id) ?? "—",
    customerEmail: emailMap.get(r.user_id) ?? "—",
    amount: r.amount,
    status: r.status,
    createdAt: r.created_at,
    processedAt: r.processed_at,
  }));
}
