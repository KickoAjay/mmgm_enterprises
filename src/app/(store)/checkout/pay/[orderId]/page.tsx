import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getOrderForPayment } from "@/features/payments/queries";
import {
  getCashfreeOrder,
  getConfiguredSiteUrl,
  getProductionCheckoutBlockReason,
  isCashfreeConfigured,
} from "@/lib/cashfree/client";
import { ensureCashfreePaymentSession } from "@/lib/cashfree/session";
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

  if (order.cashfreeOrderId) {
    const existing = await getCashfreeOrder(order.cashfreeOrderId);
    if (existing?.orderStatus === "PAID") {
      redirect(`/checkout/pay/${order.id}/return`);
    }
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const requestOrigin = host ? `${protocol}://${host}` : null;
  const siteUrl = getConfiguredSiteUrl();
  const returnUrl = `${siteUrl}/checkout/pay/${order.id}/return`;

  let paymentSessionId: string | null = null;
  let checkoutMode: "sandbox" | "production" = "production";
  let fetchFailed = false;
  let fetchError: string | null = null;

  try {
    const session = await ensureCashfreePaymentSession({
      dbOrderId: order.id,
      cashfreeOrderId: order.cashfreeOrderId ?? order.orderNumber,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      customerId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      returnUrl,
    });
    paymentSessionId = session.paymentSessionId;
    checkoutMode = session.mode;
  } catch (err) {
    console.error(`Cashfree order creation failed for order ${order.id}:`, err);
    fetchFailed = true;
    fetchError = err instanceof Error ? err.message : null;
  }

  const productionBlockReason = getProductionCheckoutBlockReason(
    requestOrigin,
    checkoutMode,
  );

  if (productionBlockReason) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-serif text-section text-foreground">Complete Payment</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Order {order.orderNumber} — {formatINR(order.grandTotal)}
        </p>
        <p className="mt-4 text-sm text-destructive">{productionBlockReason}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          For local testing, switch back to Cashfree <strong>sandbox/test keys</strong>.
          For real payments, use{" "}
          <a
            href={getConfiguredSiteUrl()}
            className="text-primary underline-offset-4 hover:underline"
          >
            {getConfiguredSiteUrl()}
          </a>
          .
        </p>
      </main>
    );
  }

  if (fetchFailed || !paymentSessionId) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-serif text-section text-foreground">Complete Payment</h1>
        <p className="mt-4 text-sm text-destructive">
          We couldn&apos;t start the payment session. Please try again.
        </p>
        {fetchError ? (
          <p className="mt-2 text-xs text-muted-foreground">{fetchError}</p>
        ) : null}
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
      <CashfreeCheckout
        paymentSessionId={paymentSessionId}
        mode={checkoutMode}
        productionSiteUrl={getConfiguredSiteUrl()}
      />
    </main>
  );
}
