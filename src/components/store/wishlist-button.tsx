"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlistAction } from "@/features/wishlist/actions";
import { cn } from "@/lib/utils";

// Starts unfilled regardless of actual wishlist membership — see
// src/features/wishlist/README.md for why (avoids an extra query per
// product card on every listing page). Shows accurate state after a click,
// or on /account/wishlist itself.
export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if ("requiresLogin" in result) {
        router.push("/login");
        return;
      }
      if ("error" in result) return;
      setInWishlist(result.inWishlist);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={inWishlist}
      className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:text-primary"
    >
      <Heart
        className={cn("size-4", inWishlist && "fill-primary text-primary")}
      />
    </button>
  );
}
