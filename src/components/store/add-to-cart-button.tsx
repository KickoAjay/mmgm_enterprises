"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "@/features/cart/actions";

export function AddToCartButton({
  productId,
  soldOut,
}: {
  productId: string;
  soldOut: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await addToCartAction(productId, 1);
      setMessage("error" in result ? result.error : "Added to bag");
      setTimeout(() => setMessage(null), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={soldOut || isPending}
      className="text-meta mt-3 w-full border border-border py-2 font-semibold tracking-wide text-foreground uppercase opacity-0 transition-opacity group-hover:opacity-100 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-0 disabled:group-hover:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
    >
      {soldOut ? "Sold Out" : isPending ? "Adding…" : (message ?? "Quick Add")}
    </button>
  );
}
