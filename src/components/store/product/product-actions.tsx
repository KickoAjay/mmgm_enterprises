"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/features/cart/actions";

export function ProductActions({
  productId,
  soldOut,
}: {
  productId: string;
  soldOut: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function addToCart(buyNow: boolean) {
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity);
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      if (buyNow) {
        router.push("/checkout");
        return;
      }
      setMessage("Added to bag");
      setTimeout(() => setMessage(null), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={soldOut || isPending}
            aria-label="Decrease quantity"
            className="flex size-9 items-center justify-center text-foreground hover:text-primary"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={soldOut || isPending}
            aria-label="Increase quantity"
            className="flex size-9 items-center justify-center text-foreground hover:text-primary"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>

      {message ? (
        <p className="text-meta text-muted-foreground">{message}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => addToCart(false)}
          disabled={soldOut || isPending}
          className="flex-1 tracking-wide uppercase"
        >
          {soldOut ? "Sold Out" : isPending ? "Adding…" : "Add to Cart"}
        </Button>
        <Button
          type="button"
          onClick={() => addToCart(true)}
          disabled={soldOut || isPending}
          variant="outline"
          className="flex-1 tracking-wide uppercase"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
