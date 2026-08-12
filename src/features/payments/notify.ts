import "server-only";
import { createServiceClient } from "@/lib/db/service";
import { sendEmail } from "@/lib/email/client";
import { buildOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { getOrderConfirmation } from "@/features/checkout/queries";

// Called once, right after confirmPayment() transitions an order to
// ORDER_CONFIRMED (never on the "already_confirmed" branch — that's what
// keeps this from double-sending when the return page and the webhook
// both fire for the same order). Never throws: a failed/unconfigured
// email must not undo a real, already-confirmed payment.
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    const order = await getOrderConfirmation(orderId);
    if (!order || !order.contactEmail) return;

    const { subject, html, text } = buildOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      items: order.items.map((item) => ({
        name: item.productNameSnapshot,
        quantity: item.quantity,
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

    const supabase = createServiceClient();
    const { data: notification } = await supabase
      .from("notifications")
      .insert({ title: subject, body: `Order confirmation email for ${order.orderNumber}` })
      .select("id")
      .single();

    await supabase.from("notification_logs").insert({
      notification_id: notification?.id ?? null,
      channel: "email",
      status: result.success ? "SENT" : "FAILED",
      provider_response: result.success ? null : { error: result.error },
    });
  } catch {
    // Best-effort — order confirmation itself already succeeded by the
    // time this runs; a notification failure shouldn't surface as one.
  }
}
