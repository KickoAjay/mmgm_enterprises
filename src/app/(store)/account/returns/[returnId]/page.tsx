import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyReturnDetail } from "@/features/returns/queries";
import { RETURN_STATUS_LABELS, type ReturnStatus } from "@/features/returns/status";
import { REFUND_STATUS_LABELS, type RefundStatus } from "@/features/refunds/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";

export const metadata = {
  title: "Return Details | MMGM Enterprises",
};

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ returnId: string }>;
}) {
  await requireUser();
  const { returnId } = await params;
  const ret = await getMyReturnDetail(returnId);
  if (!ret) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-section text-foreground">Return Request</h1>
        <span className="text-meta font-medium text-foreground">
          {RETURN_STATUS_LABELS[ret.status as ReturnStatus] ?? ret.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Order{" "}
        <Link
          href={`/account/orders/${ret.orderId}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {ret.orderNumber}
        </Link>{" "}
        · Requested {formatOrderDate(ret.requestedAt)}
      </p>

      <section className="mt-8">
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Reason
        </h2>
        <p className="mt-2 text-sm text-foreground">{ret.reason}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Items
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {ret.items.map((item, index) => (
            <div key={index} className="flex flex-col gap-2 border border-border p-4">
              <p className="text-sm text-foreground">
                {item.productName} ({item.sku}) × {item.quantity}
              </p>
              {item.imageUrls.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt="Return evidence"
                      className="size-20 rounded-sm border border-border object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {ret.adminNote ? (
        <section className="mt-8">
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Note from MMGM Enterprises
          </h2>
          <p className="mt-2 text-sm text-foreground">{ret.adminNote}</p>
        </section>
      ) : null}

      {ret.refund ? (
        <section className="mt-8 border border-border p-4">
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Refund
          </h2>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="text-foreground">{formatINR(ret.refund.amount)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-foreground">
              {REFUND_STATUS_LABELS[ret.refund.status as RefundStatus] ?? ret.refund.status}
            </span>
          </div>
        </section>
      ) : null}
    </main>
  );
}
