import { notFound, redirect } from "next/navigation";
import { getOrderForPayment } from "@/features/payments/queries";
import {
  createCashfreeOrder,
  getCashfreeOrder,
  isCashfreeConfigured,
  type CashfreeOrder,
} from "@/lib/cashfree/client";
import { CashfreeCheckout } from "@/components/store/checkout/cashfree-checkout";
import { formatINR } from "@/features/products/format";

export const metadata = {
  title: "Complete Payment",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderForPayment(orderId);
  if (!order) notFound();

  if (order.paymentStatus === "SUCCESS" || order.orderStatus !== "PENDING_PAYMENT") {
    redirect(`/checkout/confirmation/${order.id}`);
  }

  if (!isCashfreeConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-serif text-section text-foreground">Complete Payment</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Order <span className="font-medium text-foreground">{order.orderNumber}</span> has
          been recorded for {formatINR(order.grandTotal)}, but online payment isn&apos;t
          connected yet. We&apos;ll follow up to complete payment.
        </p>
      </main>
    );
  }

  let existing: CashfreeOrder | null = null;
  try {
    existing = order.cashfreeOrderId
      ? await getCashfreeOrder(order.cashfreeOrderId)
      : null;
  } catch (err) {
    // Best-effort resume check only — used solely to reuse an in-progress
    // session instead of creating a duplicate one. A failure here (a stale
    // cashfree_order_id recorded before any real Cashfree order existed
    // under the current credentials, a transient network error, etc.)
    // must NOT block the customer: fall through and create a fresh order
    // below instead. Previously this set fetchFailed and aborted the whole
    // page even though order creation itself works fine — verified live.
    console.error(
      `Cashfree order lookup failed for order ${order.id}, creating a fresh session instead:`,
      err,
    );
  }

  if (existing?.orderStatus === "PAID") {
    redirect(`/checkout/pay/${order.id}/return`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const mode = (process.env.CASHFREE_API_URL ?? "").includes("sandbox")
    ? "sandbox"
    : "production";

  let paymentSessionId: string | null = null;
  let fetchFailed = false;
  if (existing?.paymentSessionId && existing.orderStatus === "ACTIVE") {
    paymentSessionId = existing.paymentSessionId;
  } else {
    try {
      const created = await createCashfreeOrder({
        orderId: order.cashfreeOrderId ?? order.orderNumber,
        amount: order.grandTotal,
        customerId: order.id,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        returnUrl: `${siteUrl}/checkout/pay/${order.id}/return`,
      });
      paymentSessionId = created.paymentSessionId;
    } catch (err) {
      console.error(`Cashfree order creation failed for order ${order.id}:`, err);
      fetchFailed = true;
    }
  }

  if (fetchFailed || !paymentSessionId) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-serif text-section text-foreground">Complete Payment</h1>
        <p className="mt-4 text-sm text-destructive">
          We couldn&apos;t start the payment session. Please try again.
        </p>
        <a
          href={`/checkout/pay/${order.id}`}
          className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Retry
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="font-serif text-section text-foreground">Complete Payment</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Order {order.orderNumber} — {formatINR(order.grandTotal)}
      </p>
      <CashfreeCheckout paymentSessionId={paymentSessionId} mode={mode} />
    </main>
  );
}
