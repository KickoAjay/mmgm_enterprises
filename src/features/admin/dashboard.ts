import "server-only";
import { createClient } from "@/lib/db/server";

export type DashboardStats = {
  todayRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalReturns: number;
  totalRefunds: number;
};

// Reads with the admin's own session-scoped client, not service-role —
// RLS already gives an admin full SELECT on every table this touches
// (Phase 2). Cards only, per spec §31 — the chart section of that spec
// (Daily/Monthly Sales, Revenue Trends, Top Selling Sarees, Category
// Performance) is deferred to Phase 13 "Reports + Notifications", which
// is where it's actually scoped in the phase breakdown (spec §63).
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { data: allOrders },
    { count: totalCustomers },
    { count: totalProducts },
    { data: inventoryRows },
    { count: totalReturns },
    { count: totalRefunds },
  ] = await Promise.all([
    supabase.from("orders").select("grand_total, status, created_at"),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .neq("status", "ARCHIVED"),
    supabase.from("inventory").select("quantity, low_stock_threshold"),
    supabase.from("returns").select("id", { count: "exact", head: true }),
    supabase.from("refunds").select("id", { count: "exact", head: true }),
  ]);

  const orders = allOrders ?? [];
  const paidOrders = orders.filter(
    (o) => o.status !== "PENDING_PAYMENT" && o.status !== "CANCELLED",
  );
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grand_total, 0);
  const todayRevenue = paidOrders
    .filter((o) => o.created_at && new Date(o.created_at) >= todayStart)
    .reduce((sum, o) => sum + o.grand_total, 0);

  return {
    todayRevenue,
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "PENDING_PAYMENT").length,
    deliveredOrders: orders.filter((o) => o.status === "DELIVERED").length,
    totalCustomers: totalCustomers ?? 0,
    totalProducts: totalProducts ?? 0,
    lowStockCount: (inventoryRows ?? []).filter((i) => i.quantity <= i.low_stock_threshold)
      .length,
    totalReturns: totalReturns ?? 0,
    totalRefunds: totalRefunds ?? 0,
  };
}
