import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout";

const baseShipping = {
  shippingFullName: "Test User",
  shippingPhone: "9876543210",
  shippingLine1: "123 Main St",
  shippingCity: "Chennai",
  shippingState: "Tamil Nadu",
  shippingPincode: "600001",
  billingSameAsShipping: "on",
};

// Regression test for a bug that blocked checkout by default: FormData.get()
// returns null for a field that isn't in the form at all — which happens by
// design for guestEmail (logged-in users) and every billing field ("Same as
// shipping", checked by default, unmounts the whole billing block). Zod's
// `.optional()` accepts undefined, not null, so this schema must keep
// treating null the same as a genuinely absent field. See
// placeOrderAction's `field()` helper in src/features/checkout/actions.ts.
describe("checkoutSchema tolerates FormData's null for an absent field", () => {
  it("fails on null directly (documents why the action must normalize it first)", () => {
    const result = checkoutSchema.safeParse({
      ...baseShipping,
      guestEmail: null,
      billingFullName: null,
      billingPhone: null,
      billingLine1: null,
      billingLine2: null,
      billingCity: null,
      billingState: null,
      billingPincode: null,
      couponCode: null,
      shippingLine2: null,
    });
    expect(result.success).toBe(false);
  });

  it("passes once null is normalized to undefined, as placeOrderAction now does", () => {
    const result = checkoutSchema.safeParse({
      ...baseShipping,
      guestEmail: undefined,
      billingFullName: undefined,
      billingPhone: undefined,
      billingLine1: undefined,
      billingLine2: undefined,
      billingCity: undefined,
      billingState: undefined,
      billingPincode: undefined,
      couponCode: undefined,
      shippingLine2: undefined,
    });
    expect(result.success).toBe(true);
  });
});
