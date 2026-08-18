import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminCustomerDetail } from "@/features/customers/queries";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/features/orders/status";
import { RETURN_STATUS_LABELS, type ReturnStatus } from "@/features/returns/status";
import { REFUND_STATUS_LABELS, type RefundStatus } from "@/features/refunds/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";
import { ToggleCustomerActiveButton } from "@/components/admin/toggle-customer-active-button";

export const metadata = {
  title: "Customer Profile",
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"]);
  const { customerId } = await params;
  const customer = await getAdminCustomerDetail(customerId);
  if (!customer) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground">{customer.fullName ?? customer.email}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.email} · {customer.mobile ?? "No mobile on file"} · Joined{" "}
            {formatOrderDate(customer.createdAt)}
          </p>
        </div>
        <ToggleCustomerActiveButton userId={customer.id} isActive={customer.isActive} />
      </div>

      <div className="mt-6 flex gap-4">
        <div className="border border-border bg-background p-4">
          <p className="text-meta text-muted-foreground uppercase">Total Spent</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatINR(customer.totalSpent)}
          </p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-meta text-muted-foreground uppercase">Orders</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{customer.orders.length}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">Orders</h2>
        <div className="mt-4 flex flex-col gap-2">
          {customer.orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between border border-border p-3 text-sm hover:border-primary"
            >
              <span className="text-foreground">{o.orderNumber}</span>
              <span className="text-muted-foreground">
                {o.placedAt ? formatOrderDate(o.placedAt) : "—"}
              </span>
              <span className="text-foreground">
                {ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}
              </span>
              <span className="text-foreground">{formatINR(o.grandTotal)}</span>
            </Link>
          ))}
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">Returns</h2>
        <div className="mt-4 flex flex-col gap-2">
          {customer.returns.map((r) => (
            <Link
              key={r.id}
              href={`/admin/returns/${r.id}`}
              className="flex items-center justify-between border border-border p-3 text-sm hover:border-primary"
            >
              <span className="text-muted-foreground">{formatOrderDate(r.requestedAt)}</span>
              <span className="text-foreground">
                {RETURN_STATUS_LABELS[r.status as ReturnStatus] ?? r.status}
              </span>
            </Link>
          ))}
          {customer.returns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No returns.</p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">Refunds</h2>
        <div className="mt-4 flex flex-col gap-2">
          {customer.refunds.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between border border-border p-3 text-sm"
            >
              <span className="text-muted-foreground">{formatOrderDate(r.createdAt)}</span>
              <span className="text-foreground">{formatINR(r.amount)}</span>
              <span className="text-foreground">
                {REFUND_STATUS_LABELS[r.status as RefundStatus] ?? r.status}
              </span>
            </div>
          ))}
          {customer.refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refunds.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
