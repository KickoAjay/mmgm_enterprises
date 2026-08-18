import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyOrderDetail } from "@/features/orders/queries";
import { formatOrderDate } from "@/features/orders/format";
import { formatINR } from "@/features/products/format";
import { OrderStatusTimeline } from "@/components/store/orders/order-status-timeline";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Order Details",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireUser();
  const { orderId } = await params;
  const order = await getMyOrderDetail(orderId);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-section text-foreground">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.placedAt ? `Placed ${formatOrderDate(order.placedAt)}` : null}
          </p>
        </div>
        {order.status === "DELIVERED" ? (
          <Button asChild variant="outline" className="uppercase tracking-wide">
            <Link href={`/account/orders/${order.id}/return`}>Request Return</Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Status
            </h2>
            <div className="mt-4">
              <OrderStatusTimeline currentStatus={order.status} history={order.statusHistory} />
            </div>
          </section>

          {order.shipment &&
          (order.shipment.courierName || order.shipment.trackingNumber) ? (
            <section>
              <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
                Shipment
              </h2>
              <div className="mt-4 flex flex-col gap-1 text-sm text-foreground">
                {order.shipment.courierName ? <p>Courier: {order.shipment.courierName}</p> : null}
                {order.shipment.trackingNumber ? (
                  <p>Tracking Number: {order.shipment.trackingNumber}</p>
                ) : null}
                {order.shipment.estimatedDelivery ? (
                  <p>Estimated Delivery: {order.shipment.estimatedDelivery}</p>
                ) : null}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Items
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.productNameSnapshot} × {item.quantity}
                  </span>
                  <span className="text-foreground">{formatINR(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          {order.shippingAddress ? (
            <section>
              <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
                Shipping Address
              </h2>
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="text-foreground">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p>{order.shippingAddress.phone}</p>
              </div>
            </section>
          ) : null}
        </div>

        <div className="h-fit border border-border p-6">
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Order Summary
          </h2>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatINR(order.subtotal)}</span>
            </div>
            {order.productDiscount > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product Discount</span>
                <span className="text-foreground">−{formatINR(order.productDiscount)}</span>
              </div>
            ) : null}
            {order.couponDiscount > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupon Discount</span>
                <span className="text-foreground">−{formatINR(order.couponDiscount)}</span>
              </div>
            ) : null}
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
    </main>
  );
}
