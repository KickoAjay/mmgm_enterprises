import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyRefunds } from "@/features/refunds/queries";
import { REFUND_STATUS_LABELS, type RefundStatus } from "@/features/refunds/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";

export const metadata = {
  title: "My Refunds",
};

export default async function RefundsPage() {
  await requireUser();
  const refunds = await getMyRefunds();

  if (refunds.length === 0) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-section text-foreground">No refunds yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Refunds are issued once a return is approved and processed.
        </p>
        <Link
          href="/account/returns"
          className="mt-6 text-sm text-primary underline-offset-4 hover:underline"
        >
          View Returns
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">My Refunds</h1>

      <div className="mt-8 flex flex-col gap-4">
        {refunds.map((refund) => (
          <div
            key={refund.id}
            className="flex flex-col gap-2 border border-border p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-foreground">Order {refund.orderNumber}</p>
              <p className="text-meta mt-1 text-muted-foreground">
                Requested {formatOrderDate(refund.createdAt)}
                {refund.processedAt ? ` · Processed ${formatOrderDate(refund.processedAt)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
              <span className="text-meta font-medium text-foreground">
                {REFUND_STATUS_LABELS[refund.status as RefundStatus] ?? refund.status}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatINR(refund.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
