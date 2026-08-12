"use client";

import { useActionState } from "react";
import { trackOrderAction, type TrackOrderState } from "@/features/orders/tracking";
import { formatOrderDate } from "@/features/orders/format";
import { OrderStatusTimeline } from "@/components/store/orders/order-status-timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TrackOrderPage() {
  const [state, formAction, isPending] = useActionState<TrackOrderState, FormData>(
    trackOrderAction,
    null,
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-section text-foreground">Track Your Order</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your order number and the email or mobile number used to place it.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orderNumber">Order Number</Label>
          <Input id="orderNumber" name="orderNumber" placeholder="MMGM-20260812-ABC123" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact">Registered Email or Mobile Number</Label>
          <Input id="contact" name="contact" required />
        </div>

        {state && "error" in state ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}

        <Button type="submit" disabled={isPending} className="uppercase tracking-wide">
          {isPending ? "Searching…" : "Track Order"}
        </Button>
      </form>

      {state && "order" in state ? (
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
              {state.order.orderNumber}
            </h2>
            {state.order.placedAt ? (
              <span className="text-meta text-muted-foreground">
                Placed {formatOrderDate(state.order.placedAt)}
              </span>
            ) : null}
          </div>

          <div className="mt-6">
            <OrderStatusTimeline
              currentStatus={state.order.status}
              history={state.order.statusHistory}
            />
          </div>

          {state.order.shipment &&
          (state.order.shipment.courierName || state.order.shipment.trackingNumber) ? (
            <div className="mt-6 flex flex-col gap-1 text-sm text-foreground">
              {state.order.shipment.courierName ? (
                <p>Courier: {state.order.shipment.courierName}</p>
              ) : null}
              {state.order.shipment.trackingNumber ? (
                <p>Tracking Number: {state.order.shipment.trackingNumber}</p>
              ) : null}
              {state.order.shipment.estimatedDelivery ? (
                <p>Estimated Delivery: {state.order.shipment.estimatedDelivery}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
