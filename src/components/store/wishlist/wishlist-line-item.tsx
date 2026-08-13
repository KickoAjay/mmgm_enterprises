"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { Button } from "@/components/ui/button";
import { formatINR, discountPercent } from "@/features/products/format";
import {
  removeFromWishlistAction,
  moveToCartAction,
} from "@/features/wishlist/actions";
import type { WishlistLine } from "@/features/wishlist/queries";

export function WishlistLineItem({ item }: { item: WishlistLine }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const discount = discountPercent(item.originalPrice, item.sellingPrice);
  const soldOut = item.isAvailable === false;

  function remove() {
    startTransition(async () => {
      await removeFromWishlistAction(item.wishlistItemId);
      setRemoved(true);
    });
  }

  function moveToCart() {
    startTransition(async () => {
      const result = await moveToCartAction(
        item.wishlistItemId,
        item.productId,
      );
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setRemoved(true);
    });
  }

  if (removed) return null;

  return (
    <div className="flex flex-col">
      <div className="relative">
        <Link href={`/sarees/${item.slug}`} className="block">
          {item.imageUrl ? (
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            </div>
          ) : (
            <MediaPlaceholder
              seed={item.slug}
              label={item.name}
              className="rounded-sm"
            />
          )}
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          aria-label="Remove from wishlist"
          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground hover:text-primary"
        >
          <X className="size-4" />
        </button>
        {soldOut ? (
          <span className="text-meta absolute top-2 left-2 rounded-sm bg-foreground px-2 py-1 font-semibold text-background">
            SOLD OUT
          </span>
        ) : discount > 0 ? (
          <span className="text-meta absolute top-2 left-2 rounded-sm bg-primary px-2 py-1 font-semibold text-primary-foreground">
            {discount}% OFF
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <Link
          href={`/sarees/${item.slug}`}
          className="text-sm font-medium text-foreground hover:text-primary"
        >
          {item.name}
        </Link>
        {item.fabricName ? (
          <span className="text-meta text-muted-foreground">
            {item.fabricName}
          </span>
        ) : null}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-price font-semibold text-foreground">
            {formatINR(item.sellingPrice)}
          </span>
          {discount > 0 ? (
            <span className="text-meta text-muted-foreground line-through">
              {formatINR(item.originalPrice)}
            </span>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className="text-meta mt-2 text-destructive">{message}</p>
      ) : null}

      <Button
        type="button"
        onClick={moveToCart}
        disabled={soldOut || isPending}
        variant="outline"
        className="mt-3 w-full tracking-wide uppercase"
      >
        {soldOut ? "Sold Out" : "Move to Cart"}
      </Button>
    </div>
  );
}
