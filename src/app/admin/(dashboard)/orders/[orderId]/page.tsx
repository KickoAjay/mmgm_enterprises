import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { getAdminOrderDetail } from "@/features/orders/admin-queries";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/features/orders/status";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";
import { OrderStatusTimeline } from "@/components/store/orders/order-status-timeline";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export const metadata = {
  title: "Order Details",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT"]);
  const { orderId } = await params;
  const order = await getAdminOrderDetail(orderId);
  if (!order) notFound();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {order.placedAt ? `Placed ${formatOrderDate(order.placedAt)}` : null} ·{" "}
        {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
        {order.paymentStatus ? ` · Payment: ${order.paymentStatus}` : ""}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Status
            </h2>
            <div className="mt-4">
              <OrderStatusTimeline currentStatus={order.status} history={order.statusHistory} />
            </div>
          </section>

          <section className="border border-border p-5">
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Update Order
            </h2>
            <div className="mt-4">
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
                shipment={order.shipment}
              />
            </div>
          </section>

          <section>
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Items
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.productNameSnapshot} ({item.skuSnapshot}) × {item.quantity}
                  </span>
                  <span className="text-foreground">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border border-border p-6">
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Customer
            </h2>
            <div className="mt-3 text-sm text-foreground">
              <p>{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
              <p className="text-muted-foreground">{order.customerPhone}</p>
            </div>
          </div>

          {order.shippingAddress ? (
            <div className="border border-border p-6">
              <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
                Shipping Address
              </h2>
              <div className="mt-3 text-sm text-muted-foreground">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </p>
              </div>
            </div>
          ) : null}

          <div className="border border-border p-6">
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Order Summary
            </h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">
                  {order.shippingFee === 0 ? "Free" : formatINR(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST</span>
                <span className="text-foreground">{formatINR(order.taxAmount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span className="text-foreground">Grand Total</span>
                <span className="text-foreground">{formatINR(order.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
