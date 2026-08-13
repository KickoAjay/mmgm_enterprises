"use client";

import { useActionState } from "react";
import { initiateRefundAction, type ReturnActionState } from "@/features/returns/admin-actions";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InitiateRefundForm({
  returnId,
  orderId,
  paymentId,
  userId,
  eligibleAmount,
}: {
  returnId: string;
  orderId: string;
  paymentId: string;
  userId: string;
  eligibleAmount: number;
}) {
  const [state, formAction, isPending] = useActionState<ReturnActionState, FormData>(
    initiateRefundAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="returnId" value={returnId} />
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="eligibleAmount" value={eligibleAmount} />

      <div className="flex flex-col gap-1.5 max-w-[200px]">
        <Label htmlFor="amount">Refund Amount (₹)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={0}
          max={eligibleAmount}
          step="0.01"
          defaultValue={eligibleAmount}
          required
        />
        <p className="text-meta text-muted-foreground">
          Eligible amount: {formatINR(eligibleAmount)}
        </p>
      </div>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state && "success" in state ? (
        <p className="text-sm text-foreground">Refund initiated.</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-fit uppercase tracking-wide">
        {isPending ? "Initiating…" : "Initiate Refund"}
      </Button>
    </form>
  );
}
