import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminOrders } from "@/features/orders/admin-queries";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/features/orders/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";

export const metadata = {
  title: "Orders | MMGM Admin",
};

const STATUS_FILTERS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "ORDER_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT"]);
  const { status } = await searchParams;
  const orders = await getAdminOrders(status);

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`text-meta border px-3 py-1.5 ${!status ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
        >
          All
        </Link>
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`text-meta border px-3 py-1.5 ${status === s ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-meta text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{o.customerLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.placedAt ? formatOrderDate(o.placedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                </td>
                <td className="px-4 py-3 text-foreground">{formatINR(o.grandTotal)}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
