"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X, Heart } from "lucide-react";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { formatINR } from "@/features/products/format";
import {
  updateCartItemQuantityAction,
  removeCartItemAction,
} from "@/features/cart/actions";
import { toggleWishlistAction } from "@/features/wishlist/actions";
import type { CartLine } from "@/features/cart/queries";

export function CartLineItem({ item }: { item: CartLine }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateQuantity(next: number) {
    startTransition(async () => {
      const result = await updateCartItemQuantityAction(item.cartItemId, next);
      setError("error" in result ? result.error : null);
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItemAction(item.cartItemId);
    });
  }

  function moveToWishlist() {
    startTransition(async () => {
      const result = await toggleWishlistAction(item.productId);
      if ("requiresLogin" in result) {
        router.push("/login");
        return;
      }
      await removeCartItemAction(item.cartItemId);
    });
  }

  return (
    <div className="flex gap-4 border-b border-border py-6">
      <Link href={`/sarees/${item.slug}`} className="w-24 shrink-0 sm:w-32">
        {item.imageUrl ? (
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
        ) : (
          <MediaPlaceholder
            seed={item.slug}
            label={item.name}
            aspect="aspect-[3/4]"
            className="rounded-sm"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/sarees/${item.slug}`}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              {item.name}
            </Link>
            {item.fabricName ? (
              <p className="text-meta mt-1 text-muted-foreground">
                {item.fabricName}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            aria-label="Remove item"
            className="text-muted-foreground hover:text-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        {item.isAvailable === false ? (
          <p className="text-meta mt-2 font-medium text-destructive">
            Out of stock
          </p>
        ) : null}
        {error ? (
          <p className="text-meta mt-2 text-destructive">{error}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 pt-3">
          <div className="flex items-center border border-border">
            <button
              type="button"
              onClick={() => updateQuantity(item.quantity - 1)}
              disabled={isPending}
              aria-label="Decrease quantity"
              className="flex size-8 items-center justify-center text-foreground hover:text-primary"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.quantity + 1)}
              disabled={isPending}
              aria-label="Increase quantity"
              className="flex size-8 items-center justify-center text-foreground hover:text-primary"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={moveToWishlist}
              disabled={isPending}
              aria-label="Move to wishlist"
              className="text-muted-foreground hover:text-primary"
            >
              <Heart className="size-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {formatINR(item.lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
