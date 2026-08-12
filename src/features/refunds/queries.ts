import "server-only";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";

export type RefundListItem = {
  id: string;
  orderNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
};

// Refunds have no customer-facing creation path — "Admins manage refunds"
// (Phase 2 RLS) is insert-only for admins, matching spec §36/§37 (refund
// initiation is an admin action). This is read-only, ready to show real
// data once Phase 11's admin panel can create refund rows.
export async function getMyRefunds(): Promise<RefundListItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();

  const { data: refunds } = await supabase
    .from("refunds")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (!refunds || refunds.length === 0) return [];

  const orderIds = [...new Set(refunds.map((r) => r.order_id))];
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number")
    .in("id", orderIds);
  const orderNumberMap = new Map((orders ?? []).map((o) => [o.id, o.order_number]));

  return refunds.map((r) => ({
    id: r.id,
    orderNumber: orderNumberMap.get(r.order_id) ?? "—",
    amount: r.amount,
    status: r.status,
    createdAt: r.created_at,
    processedAt: r.processed_at,
  }));
}
