import "server-only";
import { createClient } from "@/lib/db/server";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/features/orders/status";

// Same "excluded from revenue" set as the dashboard cards (features/admin/
// dashboard.ts) — an order that never got past PENDING_PAYMENT, or that
// was CANCELLED, was never actually sold.
const EXCLUDED_FROM_REVENUE: OrderStatus[] = ["PENDING_PAYMENT", "CANCELLED"];

export type SalesPoint = { label: string; orders: number; revenue: number };
export type StatusBreakdownPoint = { status: string; count: number };
export type TopSellingPoint = {
  name: string;
  quantity: number;
  revenue: number;
};
export type CategoryPerformancePoint = {
  category: string;
  revenue: number;
  quantity: number;
};

export type ReportsData = {
  dailySales: SalesPoint[];
  monthlySales: SalesPoint[];
  orderStatusBreakdown: StatusBreakdownPoint[];
  topSellingSarees: TopSellingPoint[];
  categoryPerformance: CategoryPerformancePoint[];
};

type OrderRow = {
  id: string;
  status: string;
  grand_total: number;
  created_at: string | null;
};

function buildTimeSeries(
  orders: OrderRow[],
  points: number,
  unit: "day" | "month",
): SalesPoint[] {
  const now = new Date();
  const keys: { key: string; label: string }[] = [];

  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now);
    if (unit === "day") {
      d.setDate(d.getDate() - i);
      keys.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
      });
    } else {
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      keys.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
      });
    }
  }

  const buckets = new Map<string, SalesPoint>(
    keys.map((k) => [k.key, { label: k.label, orders: 0, revenue: 0 }]),
  );

  for (const order of orders) {
    if (
      !order.created_at ||
      EXCLUDED_FROM_REVENUE.includes(order.status as OrderStatus)
    )
      continue;
    const d = new Date(order.created_at);
    const key =
      unit === "day"
        ? d.toISOString().slice(0, 10)
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue; // outside the reporting window
    bucket.orders += 1;
    bucket.revenue += order.grand_total;
  }

  return keys.map((k) => buckets.get(k.key)!);
}

// Reads with the admin's own session-scoped client — same RLS-full-read
// pattern as getDashboardStats. Fetches broad and aggregates in JS rather
// than relying on PostgREST group-by (it doesn't have one); acceptable at
// this data volume, matching the existing dashboard card query style.
export async function getReportsData(): Promise<ReportsData> {
  const supabase = await createClient();

  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase.from("orders").select("id, status, grand_total, created_at"),
    supabase
      .from("order_items")
      .select(
        "order_id, product_id, product_name_snapshot, quantity, line_total",
      ),
  ]);

  const orderRows = (orders ?? []) as OrderRow[];
  const itemRows = items ?? [];

  const revenueOrderIds = new Set(
    orderRows
      .filter((o) => !EXCLUDED_FROM_REVENUE.includes(o.status as OrderStatus))
      .map((o) => o.id),
  );

  // Flat queries + in-JS joins, same pattern as getAdminOrders/getAdminTeam
  // — the hand-maintained Database type has no relationship metadata for
  // PostgREST's embedded-resource select syntax to type-check against.
  const productIds = [...new Set(itemRows.map((i) => i.product_id))];
  const { data: products } =
    productIds.length > 0
      ? await supabase
          .from("products")
          .select("id, category_id")
          .in("id", productIds)
      : { data: [] };
  const categoryIdByProductId = new Map(
    (products ?? []).map((p) => [p.id, p.category_id]),
  );

  const categoryIds = [
    ...new Set(
      [...categoryIdByProductId.values()].filter((id): id is string => !!id),
    ),
  ];
  const { data: categories } =
    categoryIds.length > 0
      ? await supabase
          .from("categories")
          .select("id, name")
          .in("id", categoryIds)
      : { data: [] };
  const categoryNameById = new Map(
    (categories ?? []).map((c) => [c.id, c.name]),
  );

  const statusCounts = new Map<string, number>();
  for (const order of orderRows) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
  }
  const orderStatusBreakdown = [...statusCounts.entries()]
    .map(([status, count]) => ({
      status: ORDER_STATUS_LABELS[status as OrderStatus] ?? status,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const productTotals = new Map<string, TopSellingPoint>();
  const categoryTotals = new Map<string, CategoryPerformancePoint>();

  for (const item of itemRows) {
    if (!revenueOrderIds.has(item.order_id)) continue;

    const product = productTotals.get(item.product_id) ?? {
      name: item.product_name_snapshot,
      quantity: 0,
      revenue: 0,
    };
    product.quantity += item.quantity;
    product.revenue += item.line_total;
    productTotals.set(item.product_id, product);

    const categoryId = categoryIdByProductId.get(item.product_id);
    const categoryName =
      (categoryId && categoryNameById.get(categoryId)) || "Uncategorized";
    const category = categoryTotals.get(categoryName) ?? {
      category: categoryName,
      revenue: 0,
      quantity: 0,
    };
    category.revenue += item.line_total;
    category.quantity += item.quantity;
    categoryTotals.set(categoryName, category);
  }

  const topSellingSarees = [...productTotals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const categoryPerformance = [...categoryTotals.values()].sort(
    (a, b) => b.revenue - a.revenue,
  );

  return {
    dailySales: buildTimeSeries(orderRows, 30, "day"),
    monthlySales: buildTimeSeries(orderRows, 12, "month"),
    orderStatusBreakdown,
    topSellingSarees,
    categoryPerformance,
  };
}
