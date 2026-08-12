import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { getMyOrders } from "@/features/orders/queries";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/features/orders/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";

// Dashboard grows alongside each account-area feature as it ships —
// orders (Phase 9) and wishlist (Phase 6) are real; addresses/returns/
// refunds/reviews (spec §26) aren't built yet, so they're left off rather
// than linking to routes that don't exist.
export default async function AccountPage() {
  const user = await requireUser();
  const recentOrders = await getMyOrders(3);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
        MMGM Enterprises
      </span>
      <h1 className="mt-4 font-serif text-2xl text-foreground">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="uppercase tracking-wide">
          <Link href="/account/wishlist">Wishlist</Link>
        </Button>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="uppercase tracking-wide">
            Log out
          </Button>
        </form>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Recent Orders
          </h2>
          {recentOrders.length > 0 ? (
            <Link
              href="/account/orders"
              className="text-meta text-primary underline-offset-4 hover:underline"
            >
              View All
            </Link>
          ) : null}
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link href="/sarees" className="text-primary underline-offset-4 hover:underline">
              Shop Sarees
            </Link>
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between border border-border p-4 transition-colors hover:border-primary"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                  <p className="text-meta mt-1 text-muted-foreground">
                    {order.placedAt ? formatOrderDate(order.placedAt) : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
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
        )}
      </section>
    </main>
  );
}
