"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartContext } from "@/features/cart/cart-session";
import { getCartSummary } from "@/features/cart/queries";
import { createServiceClient } from "@/lib/db/service";
import { checkoutSchema } from "@/validations/checkout";
import { validateCoupon } from "@/features/checkout/coupon";
import { calculateOrderTotals } from "@/features/checkout/pricing";

export type CheckoutActionState = { error: string } | null;

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

export type CouponPreviewResult =
  | { applied: true; code: string; discount: number }
  | { applied: false; error: string };

export async function previewCouponAction(
  code: string,
): Promise<CouponPreviewResult> {
  const user = await getCurrentUser();
  const { subtotal } = await getCartSummary();
  if (subtotal <= 0) return { applied: false, error: "Your bag is empty" };

  const result = await validateCoupon(code, subtotal, user?.id ?? null);
  if (!result.valid) return { applied: false, error: result.error };
  return { applied: true, code: result.code, discount: result.discount };
}

function generateOrderNumber() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const randomPart = globalThis.crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 6)
    .toUpperCase();
  return `MMGM-${datePart}-${randomPart}`;
}

export async function placeOrderAction(
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const parsed = checkoutSchema.safeParse({
    guestEmail: formData.get("guestEmail"),
    shippingFullName: formData.get("shippingFullName"),
    shippingPhone: formData.get("shippingPhone"),
    shippingLine1: formData.get("shippingLine1"),
    shippingLine2: formData.get("shippingLine2"),
    shippingCity: formData.get("shippingCity"),
    shippingState: formData.get("shippingState"),
    shippingPincode: formData.get("shippingPincode"),
    billingSameAsShipping: formData.get("billingSameAsShipping"),
    billingFullName: formData.get("billingFullName"),
    billingPhone: formData.get("billingPhone"),
    billingLine1: formData.get("billingLine1"),
    billingLine2: formData.get("billingLine2"),
    billingCity: formData.get("billingCity"),
    billingState: formData.get("billingState"),
    billingPincode: formData.get("billingPincode"),
    couponCode: formData.get("couponCode"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const input = parsed.data;

  const user = await getCurrentUser();
  if (!user && !input.guestEmail) {
    return { error: "Enter an email address so we can reach you about your order" };
  }

  const sameAsShipping = input.billingSameAsShipping === "on";
  if (!sameAsShipping) {
    const required = [
      input.billingFullName,
      input.billingPhone,
      input.billingLine1,
      input.billingCity,
      input.billingState,
      input.billingPincode,
    ];
    if (required.some((field) => !field)) {
      return { error: "Fill in all billing address fields, or use the same address as shipping" };
    }
    if (!/^[6-9]\d{9}$/.test(input.billingPhone!)) {
      return { error: "Enter a valid 10-digit billing mobile number" };
    }
    if (!/^[1-9][0-9]{5}$/.test(input.billingPincode!)) {
      return { error: "Enter a valid 6-digit billing pincode" };
    }
  }

  // Re-fetch the cart server-side — never trust client-submitted prices or
  // quantities (spec §56.3).
  const { items, subtotal } = await getCartSummary();
  if (items.length === 0) {
    return { error: "Your bag is empty" };
  }
  const unavailable = items.find((item) => item.isAvailable === false);
  if (unavailable) {
    return { error: `${unavailable.name} is out of stock. Remove it to continue.` };
  }

  // Beyond the boolean "in stock at all" check above: get_product_
  // availability deliberately never exposes exact quantities to the
  // browser (Phase 4), which means a cart quantity greater than what's
  // actually left would otherwise sail through undetected until
  // confirm_order_payment silently floored inventory at 0 (found in a
  // full audit — see the fix_stock_oversell_detection migration for the
  // matching confirmation-time fix). This check runs entirely
  // server-side against the real inventory table via the service-role
  // client — the quantity itself is never sent back to the browser,
  // only a generic rejection, preserving that same privacy boundary.
  const stockCheckClient = createServiceClient();
  const { data: stockRows } = await stockCheckClient
    .from("inventory")
    .select("product_id, quantity")
    .in(
      "product_id",
      items.map((item) => item.productId),
    );
  const stockMap = new Map((stockRows ?? []).map((row) => [row.product_id, row.quantity]));
  const insufficientStock = items.find(
    (item) => (stockMap.get(item.productId) ?? 0) < item.quantity,
  );
  if (insufficientStock) {
    return {
      error: `${insufficientStock.name} only has limited stock left. Please reduce the quantity in your bag.`,
    };
  }

  const productDiscount = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.unitPrice) * item.quantity,
    0,
  );

  let couponId: string | null = null;
  let couponDiscount = 0;
  if (input.couponCode) {
    const couponResult = await validateCoupon(input.couponCode, subtotal, user?.id ?? null);
    if (!couponResult.valid) return { error: couponResult.error };
    couponId = couponResult.couponId;
    couponDiscount = couponResult.discount;
  }

  const totals = calculateOrderTotals({ subtotal, productDiscount, couponDiscount });

  const supabase = createServiceClient();

  const { data: shippingAddress, error: shippingError } = await supabase
    .from("addresses")
    .insert({
      user_id: user?.id ?? null,
      type: "SHIPPING",
      full_name: input.shippingFullName,
      phone: input.shippingPhone,
      line1: input.shippingLine1,
      line2: input.shippingLine2 || null,
      city: input.shippingCity,
      state: input.shippingState,
      pincode: input.shippingPincode,
    })
    .select("id")
    .single();
  if (shippingError) return { error: "Could not save shipping address. Please try again." };

  let billingAddressId = shippingAddress.id;
  if (!sameAsShipping) {
    const { data: billingAddress, error: billingError } = await supabase
      .from("addresses")
      .insert({
        user_id: user?.id ?? null,
        type: "BILLING",
        full_name: input.billingFullName!,
        phone: input.billingPhone!,
        line1: input.billingLine1!,
        line2: input.billingLine2 || null,
        city: input.billingCity!,
        state: input.billingState!,
        pincode: input.billingPincode!,
      })
      .select("id")
      .single();
    if (billingError) return { error: "Could not save billing address. Please try again." };
    billingAddressId = billingAddress.id;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      user_id: user?.id ?? null,
      guest_email: user ? null : input.guestEmail || null,
      guest_phone: user ? null : input.shippingPhone,
      status: "PENDING_PAYMENT",
      subtotal: totals.subtotal,
      product_discount: totals.productDiscount,
      coupon_id: couponId,
      coupon_discount: totals.couponDiscount,
      shipping_fee: totals.shippingFee,
      tax_amount: totals.taxAmount,
      grand_total: totals.grandTotal,
      shipping_address_id: shippingAddress.id,
      billing_address_id: billingAddressId,
      placed_at: new Date().toISOString(),
    })
    .select("id, order_number")
    .single();
  if (orderError) return { error: "Could not create your order. Please try again." };

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name_snapshot: item.name,
      sku_snapshot: item.sku,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      discount_amount: (item.originalPrice - item.unitPrice) * item.quantity,
      line_total: item.lineTotal,
    })),
  );
  if (itemsError) return { error: "Could not save order items. Please try again." };

  await supabase.from("order_status_history").insert({
    order_id: order.id,
    status: "PENDING_PAYMENT",
    note: "Order placed",
  });

  // cashfree_order_id is set eagerly to our own order_number — that's
  // what gets sent to Cashfree as *their* order_id once the payment page
  // creates the session, and is how the webhook/return-page look this
  // payment row back up.
  await supabase.from("payments").insert({
    order_id: order.id,
    cashfree_order_id: order.order_number,
    amount: totals.grandTotal,
    status: "PENDING",
  });

  if (couponId) {
    await supabase.from("coupon_usage").insert({
      coupon_id: couponId,
      user_id: user?.id ?? null,
      order_id: order.id,
    });
  }

  const { cartId } = await getCartContext();
  if (cartId) {
    await supabase.from("cart_items").delete().eq("cart_id", cartId);
  }

  redirect(`/checkout/pay/${order.id}`);
}
