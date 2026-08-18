import { notFound, redirect } from "next/navigation";
import { getOrderForPayment } from "@/features/payments/queries";
import { getCashfreeOrder } from "@/lib/cashfree/client";
import { confirmPayment } from "@/features/payments/confirm";

export const metadata = {
  title: "Verifying Payment",
};

// Cashfree redirects the customer here after checkout. This does its own
// server-to-server status check and confirmation (spec §56.7 "payment
// must be verified server-side") rather than trusting that the customer
// simply arrived at this URL — the Cashfree webhook hitting
// /api/webhooks/cashfree is the other, authoritative path to the same
// confirmPayment() call, and either one can win the race safely.
export default async function PaymentReturnPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderForPayment(orderId);
  if (!order) notFound();

  if (order.paymentStatus === "SUCCESS") {
    redirect(`/checkout/confirmation/${order.id}`);
  }

  if (!order.cashfreeOrderId) {
    redirect(`/checkout/pay/${order.id}`);
  }

  let cfStatus: string | null = null;
  try {
    const cfOrder = await getCashfreeOrder(order.cashfreeOrderId);
    cfStatus = cfOrder?.orderStatus ?? null;
  } catch {
    cfStatus = null;
  }

  if (cfStatus === "PAID") {
    await confirmPayment(order.cashfreeOrderId);
    redirect(`/checkout/confirmation/${order.id}`);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="font-serif text-section text-foreground">Payment Not Completed</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        {cfStatus
          ? `Order ${order.orderNumber} wasn't paid (status: ${cfStatus}). If money was
             deducted, it will be auto-refunded by Cashfree — otherwise, you can try again.`
          : `We couldn't confirm payment for order ${order.orderNumber} right now. If money
             was deducted, check back shortly — this page also updates automatically once
             our systems hear back from Cashfree.`}
      </p>
      <a
        href={`/checkout/pay/${order.id}`}
        className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        Try Payment Again
      </a>
    </main>
  );
}
