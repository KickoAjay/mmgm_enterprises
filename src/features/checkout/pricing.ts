// Free shipping above ₹999 matches the announcement-bar copy already
// shown site-wide (Phase 3). GST is modelled as a single flat rate rather
// than India's real HSN-slab-based textile schedule (5%/12% by unit
// price) — replicating that exactly is out of scope here; this keeps the
// number honest and server-computed without pretending to be a tax engine.
export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 99;
export const GST_RATE = 0.05;

export function calculateShippingFee(subtotalAfterDiscount: number): number {
  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD
    ? 0
    : STANDARD_SHIPPING_FEE;
}

export function calculateTax(subtotalAfterDiscount: number): number {
  return Math.round(subtotalAfterDiscount * GST_RATE);
}

export type OrderTotals = {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
};

export function calculateOrderTotals(params: {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
}): OrderTotals {
  const afterCoupon = Math.max(
    0,
    params.subtotal - params.couponDiscount,
  );
  const shippingFee = calculateShippingFee(afterCoupon);
  const taxAmount = calculateTax(afterCoupon);
  const grandTotal = afterCoupon + shippingFee + taxAmount;

  return {
    subtotal: params.subtotal,
    productDiscount: params.productDiscount,
    couponDiscount: params.couponDiscount,
    shippingFee,
    taxAmount,
    grandTotal,
  };
}
