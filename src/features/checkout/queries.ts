import "server-only";
import { createServiceClient } from "@/lib/db/service";

export type OrderConfirmationItem = {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderConfirmation = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  placedAt: string | null;
  contactEmail: string | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: OrderConfirmationItem[];
};

// Reads via the service-role client rather than RLS — a guest order has no
// auth.uid() for "Users view own orders" to match against. The order's
// UUID in the URL is the access token here, the same pattern most
// checkout confirmation pages use (unguessable, generated once, never
// listed). Logged-in users get their own orders listed under /account
// through the normal RLS-scoped path once that page exists.
export async function getOrderConfirmation(
  orderId: string,
): Promise<OrderConfirmation | null> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const [{ data: items }, addressResult, userResult] = await Promise.all([
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    order.shipping_address_id
      ? supabase
          .from("addresses")
          .select("*")
          .eq("id", order.shipping_address_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    order.user_id
      ? supabase
          .from("users")
          .select("email")
          .eq("id", order.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const address = addressResult.data;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    subtotal: order.subtotal,
    productDiscount: order.product_discount,
    couponDiscount: order.coupon_discount,
    shippingFee: order.shipping_fee,
    taxAmount: order.tax_amount,
    grandTotal: order.grand_total,
    placedAt: order.placed_at,
    contactEmail: order.guest_email ?? userResult.data?.email ?? null,
    shippingAddress: address
      ? {
          fullName: address.full_name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        }
      : null,
    items: (items ?? []).map((item) => ({
      id: item.id,
      productNameSnapshot: item.product_name_snapshot,
      skuSnapshot: item.sku_snapshot,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      lineTotal: item.line_total,
    })),
  };
}
