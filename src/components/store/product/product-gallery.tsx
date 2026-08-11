"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/features/products/detail";

// No real photography exists yet, so this falls back to a single
// MediaPlaceholder tile with no thumbnail strip — showing several
// identical placeholder "photos" would be dishonest, not just plain.
// The multi-image gallery (hover/click thumbnails) activates automatically
// once product_images rows exist, matching spec §15.
export function ProductGallery({
  images,
  seed,
  label,
}: {
  images: ProductImage[];
  seed: string;
  label: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <MediaPlaceholder
        seed={seed}
        label={label}
        aspect="aspect-[3/4]"
        className="rounded-sm"
      />
    );
  }

  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
        <Image
          src={active.url}
          alt={active.altText ?? label}
          fill
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-sm border",
                index === activeIndex ? "border-primary" : "border-border",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText ?? label}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
