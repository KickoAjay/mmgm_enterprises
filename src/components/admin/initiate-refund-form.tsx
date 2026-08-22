"use client";

import { useActionState } from "react";
import { initiateRefundAction, type ReturnActionState } from "@/features/returns/admin-actions";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InitiateRefundForm({
  returnId,
  eligibleAmount,
}: {
  returnId: string;
  eligibleAmount: number;
}) {
  const [state, formAction, isPending] = useActionState<ReturnActionState, FormData>(
    initiateRefundAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* orderId/paymentId/userId/eligibleAmount are no longer submitted —
          the server derives all of them from returnId alone (see
          initiateRefundAction), so there's nothing left here for a
          tampered hidden field to lie about. eligibleAmount below is
          display-only (max/defaultValue on the amount input). */}
      <input type="hidden" name="returnId" value={returnId} />

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
