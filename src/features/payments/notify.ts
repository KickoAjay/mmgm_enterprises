import "server-only";
import { sendEmail } from "@/lib/email/client";
import { logEmailDelivery } from "@/lib/email/log";
import { formatEmailDate } from "@/lib/email/templates/shared";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { buildPaymentConfirmationEmail } from "@/lib/email/templates/payment-confirmation";
import { buildAdminNewOrderEmail } from "@/lib/email/templates/admin-new-order";
import {
  buildOrderStatusUpdateEmail,
  type OrderStatusUpdateEmailData,
} from "@/lib/email/templates/order-status-update";
import { getOrderConfirmation, type OrderConfirmation } from "@/features/checkout/queries";

async function sendCustomerOrderConfirmation(order: OrderConfirmation): Promise<void> {
  if (!order.contactEmail) return;
  const { subject, html, text } = buildOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    customerName: order.shippingAddress?.fullName ?? "Customer",
    orderDate: formatEmailDate(order.placedAt ?? new Date().toISOString()),
    orderStatus: order.status,
    items: order.items.map((item) => ({
      name: item.productNameSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal,
    productDiscount: order.productDiscount,
    couponDiscount: order.couponDiscount,
    shippingFee: order.shippingFee,
    taxAmount: order.taxAmount,
    grandTotal: order.grandTotal,
    shippingAddress: order.shippingAddress,
  });
  const result = await sendEmail({ to: order.contactEmail, subject, html, text });
  await logEmailDelivery(
    subject,
    `Order confirmation for ${order.orderNumber}`,
    result.success ? "SENT" : "FAILED",
    result.success ? undefined : result.error,
  );
}

async function sendCustomerPaymentConfirmation(
  order: OrderConfirmation,
  cashfreePaymentId?: string,
): Promise<void> {
  if (!order.contactEmail) return;
  const { subject, html, text } = buildPaymentConfirmationEmail({
    orderNumber: order.orderNumber,
    cashfreePaymentId: cashfreePaymentId ?? null,
    amount: order.grandTotal,
    paymentStatus: "SUCCESS",
    transactionDate: formatEmailDate(new Date().toISOString()),
  });
  const result = await sendEmail({ to: order.contactEmail, subject, html, text });
  await logEmailDelivery(
    subject,
    `Payment confirmation for ${order.orderNumber}`,
    result.success ? "SENT" : "FAILED",
    result.success ? undefined : result.error,
  );
}

async function sendAdminNewOrderAlert(order: OrderConfirmation): Promise<void> {
  // Skipped, not an error, when no admin inbox is configured — there's no
  // settings row/UI for this yet, just an env var.
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;

  const { subject, html, text } = buildAdminNewOrderEmail({
    orderNumber: order.orderNumber,
    customerName: order.shippingAddress?.fullName ?? "Customer",
    customerEmail: order.contactEmail ?? "unknown",
    customerPhone: order.shippingAddress?.phone ?? "unknown",
    items: order.items.map((item) => ({
      name: item.productNameSnapshot,
      sku: item.skuSnapshot,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    grandTotal: order.grandTotal,
    shippingAddress: order.shippingAddress,
    placedAt: formatEmailDate(order.placedAt ?? new Date().toISOString()),
  });
  const result = await sendEmail({ to: adminEmail, subject, html, text });
  await logEmailDelivery(
    subject,
    `Admin new-order alert for ${order.orderNumber}`,
    result.success ? "SENT" : "FAILED",
    result.success ? undefined : result.error,
  );
}

// Fired exactly once, from confirmPayment()'s (src/features/payments/confirm.ts)
// "confirmed" transition only — never on "already_confirmed". One order
// fetch, fanned out to three emails; that single-fetch shape (rather than
// each email independently re-fetching) is what keeps the return-page and
// the webhook from double-sending when both fire for the same order.
export async function sendOrderConfirmedNotifications(
  orderId: string,
  cashfreePaymentId?: string,
): Promise<void> {
  try {
    const order = await getOrderConfirmation(orderId);
    if (!order) return;

    await Promise.all([
      sendCustomerOrderConfirmation(order).catch(() => undefined),
      sendCustomerPaymentConfirmation(order, cashfreePaymentId).catch(() => undefined),
      sendAdminNewOrderAlert(order).catch(() => undefined),
    ]);
  } catch {
    // Best-effort — a confirmed payment must never be undone by a
    // notification failure.
  }
}

// Not wired to any trigger yet — there is no admin order-status-management
// feature in this codebase (order status changes are a later admin-panel
// phase). Ready to call once an admin action transitions an order to
// SHIPPED/DELIVERED/CANCELLED.
export async function sendOrderStatusUpdateNotification(
  orderId: string,
  data: OrderStatusUpdateEmailData,
): Promise<void> {
  try {
    const order = await getOrderConfirmation(orderId);
    if (!order || !order.contactEmail) return;
    const { subject, html, text } = buildOrderStatusUpdateEmail(data);
    const result = await sendEmail({ to: order.contactEmail, subject, html, text });
    await logEmailDelivery(
      subject,
      `Status update (${data.status}) for ${order.orderNumber}`,
      result.success ? "SENT" : "FAILED",
      result.success ? undefined : result.error,
    );
  } catch {
    // Best-effort
  }
}
