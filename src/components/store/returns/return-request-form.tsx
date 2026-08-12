"use client";

import { useActionState, useState } from "react";
import { requestReturnAction, type ReturnActionState } from "@/features/returns/actions";
import { RETURN_REASONS } from "@/features/returns/status";
import { ReturnImageUpload } from "@/components/store/returns/return-image-upload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ReturnEligibleItem } from "@/features/returns/eligibility";

export function ReturnRequestForm({
  orderId,
  userId,
  items,
}: {
  orderId: string;
  userId: string;
  items: ReturnEligibleItem[];
}) {
  const [state, formAction, isPending] = useActionState<ReturnActionState, FormData>(
    requestReturnAction,
    null,
  );
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.orderItemId ?? "");
  const selectedItem = items.find((item) => item.orderItemId === selectedItemId);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="orderId" value={orderId} />

      <div>
        <Label>Item to Return</Label>
        <div className="mt-2 flex flex-col gap-2">
          {items.map((item) => (
            <label
              key={item.orderItemId}
              className="flex items-center gap-2 border border-border p-3 text-sm has-checked:border-primary"
            >
              <input
                type="radio"
                name="orderItemId"
                value={item.orderItemId}
                checked={selectedItemId === item.orderItemId}
                onChange={() => setSelectedItemId(item.orderItemId)}
              />
              <span className="text-foreground">
                {item.name} ({item.sku}) — up to {item.returnableQuantity} of{" "}
                {item.orderedQuantity}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-w-[160px]">
        <Label htmlFor="quantity">Quantity</Label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={selectedItem?.returnableQuantity ?? 1}
          defaultValue={1}
          required
          className="border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason</Label>
        <select
          id="reason"
          name="reason"
          required
          defaultValue=""
          className="border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="" disabled>
            Select a reason
          </option>
          {RETURN_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Additional Details (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div>
        <Label>Photos (optional)</Label>
        <div className="mt-2">
          <ReturnImageUpload userId={userId} />
        </div>
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="uppercase tracking-wide">
        {isPending ? "Submitting…" : "Submit Return Request"}
      </Button>
    </form>
  );
}
