"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  checkDeliveryAction,
  type DeliveryCheckResult,
} from "@/features/products/delivery-actions";

export function DeliveryCheck({
  returnEligible,
  returnPeriodDays,
}: {
  returnEligible: boolean;
  returnPeriodDays: number;
}) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<DeliveryCheckResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      setResult(await checkDeliveryAction(pincode));
    });
  }

  return (
    <div className="border border-border p-4">
      <h3 className="text-meta font-semibold tracking-wide text-foreground uppercase">
        Delivery Information
      </h3>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter Pincode"
          className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <Button
          type="submit"
          disabled={isPending}
          variant="outline"
          className="tracking-wide uppercase"
        >
          Check
        </Button>
      </form>

      {result && "error" in result ? (
        <p className="text-meta mt-2 text-destructive">{result.error}</p>
      ) : null}
      {result && "estimatedDays" in result ? (
        <div className="mt-3 text-sm text-foreground">
          <p>Estimated delivery: {result.estimatedDays}</p>
          <p className="text-meta mt-1 text-muted-foreground">
            {result.codAvailable
              ? "Cash on Delivery available"
              : "Prepaid orders only"}
          </p>
        </div>
      ) : null}

      <p className="text-meta mt-3 text-muted-foreground">
        {returnEligible
          ? `Easy returns within ${returnPeriodDays} days.`
          : "This item is not eligible for returns."}
      </p>
    </div>
  );
}
