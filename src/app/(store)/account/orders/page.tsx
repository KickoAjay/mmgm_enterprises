import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyOrders } from "@/features/orders/queries";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/features/orders/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My Orders | MMGM Enterprises",
};

export default async function OrdersPage() {
  await requireUser();
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-section text-foreground">No orders yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your past orders will show up here once you place one.
        </p>
        <Button asChild className="mt-6 tracking-wide uppercase">
          <Link href="/sarees">Shop Sarees</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">My Orders</h1>

      <div className="mt-8 flex flex-col gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex flex-col gap-2 border border-border p-5 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
              <p className="text-meta mt-1 text-muted-foreground">
                {order.placedAt ? formatOrderDate(order.placedAt) : "—"} · {order.itemCount}{" "}
                item{order.itemCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
              <span className="text-meta font-medium text-foreground">
                {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatINR(order.grandTotal)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
