"use client";

import { useActionState } from "react";
import { updateOrderAction, type OrderActionState } from "@/features/orders/admin-actions";
import { TIMELINE_STEP_LABELS, getAllowedNextStatuses } from "@/features/orders/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrderStatusForm({
  orderId,
  currentStatus,
  shipment,
}: {
  orderId: string;
  currentStatus: string;
  shipment: { courierName: string | null; trackingNumber: string | null; estimatedDelivery: string | null } | null;
}) {
  const [state, formAction, isPending] = useActionState<OrderActionState, FormData>(
    updateOrderAction,
    null,
  );
  const nextStatuses = getAllowedNextStatuses(currentStatus);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="orderId" value={orderId} />

      {nextStatuses.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Update Status</Label>
          <select
            id="status"
            name="status"
            defaultValue=""
            className="border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Keep current status</option>
            {nextStatuses.map((status) => (
              <option key={status} value={status}>
                {TIMELINE_STEP_LABELS[status] ?? status}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-meta text-muted-foreground">No further status updates available.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="courierName">Courier</Label>
          <Input id="courierName" name="courierName" defaultValue={shipment?.courierName ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trackingNumber">Tracking Number</Label>
          <Input
            id="trackingNumber"
            name="trackingNumber"
            defaultValue={shipment?.trackingNumber ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
          <Input
            id="estimatedDelivery"
            name="estimatedDelivery"
            type="date"
            defaultValue={shipment?.estimatedDelivery ?? ""}
          />
        </div>
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state && "success" in state ? <p className="text-sm text-foreground">Saved.</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit uppercase tracking-wide">
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
