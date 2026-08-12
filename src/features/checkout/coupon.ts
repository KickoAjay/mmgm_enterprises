import "server-only";
import { createServiceClient } from "@/lib/db/service";

export type CouponValidationResult =
  | { valid: true; couponId: string; code: string; discount: number }
  | { valid: false; error: string };

// Covers coupon core validation (code/active/date-window/min-order/usage
// limits) — enough to make checkout functional. Per-product/per-category
// applicability (coupon_products/coupon_categories, seeded but unused here)
// and the admin management UI are Phase 12's job; every coupon here applies
// storewide.
export async function validateCoupon(
  code: string,
  subtotal: number,
  userId: string | null,
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Enter a coupon code" };

  const supabase = createServiceClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();

  if (!coupon || !coupon.is_active) {
    return { valid: false, error: "Invalid coupon code" };
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, error: "This coupon is not active yet" };
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < now) {
    return { valid: false, error: "This coupon has expired" };
  }
  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      error: `Minimum order amount for this coupon is ₹${coupon.min_order_amount}`,
    };
  }

  if (coupon.usage_limit !== null) {
    const { count } = await supabase
      .from("coupon_usage")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id);
    if ((count ?? 0) >= coupon.usage_limit) {
      return { valid: false, error: "This coupon has reached its usage limit" };
    }
  }

  // Guests have no account to track per-user redemptions against, so this
  // check is skipped for them — only the storewide usage_limit above
  // applies to guest orders.
  if (userId) {
    const { count } = await supabase
      .from("coupon_usage")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId);
    if ((count ?? 0) >= coupon.per_user_limit) {
      return { valid: false, error: "You have already used this coupon" };
    }
  }

  let discount =
    coupon.type === "PERCENTAGE"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;
  if (coupon.max_discount_amount !== null) {
    discount = Math.min(discount, coupon.max_discount_amount);
  }
  discount = Math.min(discount, subtotal);

  return { valid: true, couponId: coupon.id, code: normalized, discount };
}
