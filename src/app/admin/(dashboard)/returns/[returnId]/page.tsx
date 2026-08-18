import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAdminReturnDetail } from "@/features/returns/admin-queries";
import { RETURN_STATUS_LABELS, type ReturnStatus } from "@/features/returns/status";
import { REFUND_STATUS_LABELS, type RefundStatus } from "@/features/refunds/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";
import { ReturnStatusForm } from "@/components/admin/return-status-form";
import { InitiateRefundForm } from "@/components/admin/initiate-refund-form";

export const metadata = {
  title: "Return Details",
};

export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ returnId: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT"]);
  const { returnId } = await params;
  const ret = await getAdminReturnDetail(returnId);
  if (!ret) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">Order {ret.orderNumber}</h1>
        <span className="text-meta font-medium text-foreground">
          {RETURN_STATUS_LABELS[ret.status as ReturnStatus] ?? ret.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {ret.customerEmail} · Requested {formatOrderDate(ret.requestedAt)}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Reason
            </h2>
            <p className="mt-2 text-sm text-foreground">{ret.reason}</p>
          </section>

          <section>
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
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-border p-6">
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Update Return
            </h2>
            <div className="mt-4">
              <ReturnStatusForm
                returnId={ret.id}
                currentStatus={ret.status}
                adminNote={ret.adminNote}
              />
            </div>
          </div>

          {ret.status === "RETURNED" && ret.paymentId ? (
            <div className="border border-border p-6">
              <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
                Refund
              </h2>
              {ret.existingRefund ? (
                <div className="mt-3 text-sm text-foreground">
                  <p>{formatINR(ret.existingRefund.amount)}</p>
                  <p className="text-muted-foreground">
                    {REFUND_STATUS_LABELS[ret.existingRefund.status as RefundStatus] ??
                      ret.existingRefund.status}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <InitiateRefundForm
                    returnId={ret.id}
                    orderId={ret.orderId}
                    paymentId={ret.paymentId}
                    userId={ret.userId}
                    eligibleAmount={ret.eligibleRefundAmount}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
