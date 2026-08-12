import "server-only";
import { createServiceClient } from "@/lib/db/service";
import { sendOrderConfirmedNotifications } from "@/features/payments/notify";

export type ConfirmPaymentResult = "confirmed" | "already_confirmed" | "not_found";

// Thin wrapper around the confirm_order_payment() SQL function (Phase 8
// migration) — every write (payment status, order status + history,
// inventory decrement) happens inside that single function call so it's
// one transaction with a row lock on the order. Called from both the
// payment-return page (immediate, best-effort) and the Cashfree webhook
// (authoritative, possibly duplicated) — safe to call twice for the same
// order, per spec §56.9.
export async function confirmPayment(
  cashfreeOrderId: string,
  cashfreePaymentId?: string,
): Promise<ConfirmPaymentResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("confirm_order_payment", {
    p_cashfree_order_id: cashfreeOrderId,
    p_cashfree_payment_id: cashfreePaymentId,
  });
  if (error) throw error;
  const result = data as ConfirmPaymentResult;

  // Only on the transition that actually just happened — the
  // "already_confirmed" branch means some earlier call (return page or
  // webhook) already sent this, so sending again here would double it.
  if (result === "confirmed") {
    const { data: payment } = await supabase
      .from("payments")
      .select("order_id")
      .eq("cashfree_order_id", cashfreeOrderId)
      .maybeSingle();
    if (payment) {
      await sendOrderConfirmedNotifications(payment.order_id, cashfreePaymentId);
    }
  }

  return result;
}
