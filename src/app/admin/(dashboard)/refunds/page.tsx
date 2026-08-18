import { requireRole } from "@/lib/auth/session";
import { getAdminRefunds } from "@/features/refunds/admin-queries";
import { REFUND_STATUS_LABELS, type RefundStatus } from "@/features/refunds/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";
import { AdvanceRefundButton } from "@/components/admin/advance-refund-button";

export const metadata = {
  title: "Refunds",
};

export default async function AdminRefundsPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
  const refunds = await getAdminRefunds();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Refunds</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Tracks refund status only — no payment gateway refund call is made automatically.
      </p>

      <div className="mt-6 overflow-x-auto border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-meta text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{r.orderNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.customerEmail}</td>
                <td className="px-4 py-3 text-foreground">{formatINR(r.amount)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatOrderDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-foreground">
                  {REFUND_STATUS_LABELS[r.status as RefundStatus] ?? r.status}
                </td>
                <td className="px-4 py-3">
                  <AdvanceRefundButton refundId={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {refunds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No refunds yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
