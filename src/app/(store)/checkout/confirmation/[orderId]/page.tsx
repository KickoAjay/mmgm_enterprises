import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderConfirmation } from "@/features/checkout/queries";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Order Confirmation | MMGM Enterprises",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderConfirmation(orderId);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="border border-border p-8 text-center">
        <h1 className="font-serif text-section text-foreground">
          Thank you for your order
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order <span className="font-medium text-foreground">{order.orderNumber}</span> has
          been recorded. We&apos;ll email {order.contactEmail ?? "you"} with next steps to
          complete payment.
        </p>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Shipping To
          </h2>
          {order.shippingAddress ? (
            <div className="mt-3 text-sm text-muted-foreground">
              <p className="text-foreground">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.pincode}
              </p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Order Status
          </h2>
          <p className="mt-3 text-sm text-foreground">Payment Pending</p>
        </div>
      </div>

      <div className="mt-8 border border-border p-6">
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Order Summary
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.productNameSnapshot} × {item.quantity}
              </span>
              <span className="text-foreground">{formatINR(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
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

      <Button asChild className="mt-8 w-full uppercase tracking-wide">
        <Link href="/sarees">Continue Shopping</Link>
      </Button>
    </main>
  );
}
