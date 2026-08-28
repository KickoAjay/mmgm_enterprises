"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import {
  placeOrderAction,
  previewCouponAction,
  type CheckoutActionState,
} from "@/features/checkout/actions";
import { calculateOrderTotals } from "@/features/checkout/pricing";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CartLine } from "@/features/cart/queries";

function AddressFields({ prefix }: { prefix: "shipping" | "billing" }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${prefix}FullName`}>Full name</Label>
        <Input id={`${prefix}FullName`} name={`${prefix}FullName`} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}Phone`}>Mobile number</Label>
        <Input id={`${prefix}Phone`} name={`${prefix}Phone`} type="tel" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}Pincode`}>Pincode</Label>
        <Input id={`${prefix}Pincode`} name={`${prefix}Pincode`} required />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${prefix}Line1`}>Address line 1</Label>
        <Input id={`${prefix}Line1`} name={`${prefix}Line1`} required />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${prefix}Line2`}>Address line 2 (optional)</Label>
        <Input id={`${prefix}Line2`} name={`${prefix}Line2`} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}City`}>City</Label>
        <Input id={`${prefix}City`} name={`${prefix}City`} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}State`}>State</Label>
        <Input id={`${prefix}State`} name={`${prefix}State`} required />
      </div>
    </div>
  );
}

export function CheckoutForm({
  items,
  subtotal,
  userEmail,
}: {
  items: CartLine[];
  subtotal: number;
  userEmail: string | null;
}) {
  const [state, formAction, isPending] = useActionState<
    CheckoutActionState,
    FormData
  >(placeOrderAction, null);

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCouponPending, startCouponTransition] = useTransition();

  const productDiscount = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.unitPrice) * item.quantity,
    0,
  );
  const totals = calculateOrderTotals({
    subtotal,
    productDiscount,
    couponDiscount: coupon?.discount ?? 0,
  });

  function applyCoupon() {
    setCouponError(null);
    startCouponTransition(async () => {
      const result = await previewCouponAction(couponCode);
      if (!result.applied) {
        setCoupon(null);
        setCouponError(result.error);
        return;
      }
      setCoupon({ code: result.code, discount: result.discount });
    });
  }

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        {!userEmail ? (
          <section>
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Contact
            </h2>
            <p className="mt-1 text-meta text-muted-foreground">
              Checking out as a guest. Have an account?{" "}
              <a href="/login?redirect=/checkout" className="text-primary underline-offset-4 hover:underline">
                Log in
              </a>
              {" "}for faster checkout.
            </p>
            <div className="mt-4 flex flex-col gap-1.5">
              <Label htmlFor="guestEmail">Email</Label>
              <Input id="guestEmail" name="guestEmail" type="email" required />
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Shipping Address
          </h2>
          <div className="mt-4">
            <AddressFields prefix="shipping" />
          </div>
        </section>

        <section>
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Billing Address
          </h2>
          <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="billingSameAsShipping"
              checked={sameAsShipping}
              onChange={(e) => setSameAsShipping(e.target.checked)}
              className="size-4"
            />
            Same as shipping address
          </label>
          {!sameAsShipping ? (
            <div className="mt-4">
              <AddressFields prefix="billing" />
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Coupon
          </h2>
          <div className="mt-4 flex gap-2">
            <Input
              name="couponCode"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isCouponPending || !couponCode}
              onClick={applyCoupon}
              className="uppercase tracking-wide"
            >
              {isCouponPending ? "Checking…" : "Apply"}
            </Button>
          </div>
          {couponError ? (
            <p className="text-meta mt-2 text-destructive">{couponError}</p>
          ) : null}
          {coupon ? (
            <p className="text-meta mt-2 text-foreground">
              &ldquo;{coupon.code}&rdquo; applied — you save {formatINR(coupon.discount)}
            </p>
          ) : null}
        </section>
      </div>

      <div className="h-fit border border-border p-6">
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Order Summary
        </h2>

        <ul className="mt-4 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.cartItemId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.name} × {item.quantity}
              </span>
              <span className="text-foreground">{formatINR(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatINR(totals.subtotal)}</span>
          </div>
          {totals.productDiscount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product Discount</span>
              <span className="text-foreground">−{formatINR(totals.productDiscount)}</span>
            </div>
          ) : null}
          {totals.couponDiscount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coupon Discount</span>
              <span className="text-foreground">−{formatINR(totals.couponDiscount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-foreground">
              {totals.shippingFee === 0 ? "Free" : formatINR(totals.shippingFee)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST</span>
            <span className="text-foreground">{formatINR(totals.taxAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span className="text-foreground">Grand Total</span>
            <span className="text-foreground">{formatINR(totals.grandTotal)}</span>
          </div>
        </div>

        {state && "error" in state ? (
          <p className="mt-4 text-sm text-destructive">{state.error}</p>
        ) : null}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full uppercase tracking-wide"
        >
          {isPending ? "Placing Order…" : "Place Order"}
        </Button>
        <p className="text-meta mt-3 text-muted-foreground">
          You&apos;ll be redirected to Cashfree to complete payment securely.
        </p>
      </div>
    </form>
  );
}
