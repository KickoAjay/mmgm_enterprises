import "server-only";
import { createServiceClient } from "@/lib/db/service";

export type PaymentOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  cashfreeOrderId: string | null;
  grandTotal: number;
  customerEmail: string;
  customerPhone: string;
};

// Reads via the service-role client, same rationale as
// getOrderConfirmation (src/features/checkout/queries.ts) — a guest order
// has no auth.uid() for RLS to check, so the order's UUID in the URL is
// the access token.
export async function getOrderForPayment(
  orderId: string,
): Promise<PaymentOrder | null> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const [{ data: payment }, addressResult, userResult] = await Promise.all([
    supabase.from("payments").select("*").eq("order_id", order.id).maybeSingle(),
    order.shipping_address_id
      ? supabase
          .from("addresses")
          .select("phone")
          .eq("id", order.shipping_address_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    order.user_id
      ? supabase.from("users").select("email").eq("id", order.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!payment) return null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    orderStatus: order.status,
    paymentStatus: payment.status,
    cashfreeOrderId: payment.cashfree_order_id,
    grandTotal: order.grand_total,
    customerEmail: order.guest_email ?? userResult.data?.email ?? "",
    customerPhone: order.guest_phone ?? addressResult.data?.phone ?? "",
  };
}
