import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { WishlistButton } from "@/components/store/wishlist-button";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { formatINR, discountPercent } from "@/features/products/format";
import type { ProductListItem } from "@/features/products/queries";

// The product detail link (/sarees/[slug]) 404s until Phase 5 builds that
// route; that's expected during phased development, not a bug.
export function ProductCard({
  product,
}: {
  product: ProductListItem & { isAvailable?: boolean | null; imageUrl?: string | null };
}) {
  const discount = discountPercent(
    product.original_price,
    product.selling_price,
  );
  const soldOut = product.isAvailable === false;

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <Link href={`/sarees/${product.slug}`} className="block">
          {product.imageUrl ? (
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <MediaPlaceholder
              seed={product.slug}
              label={product.name}
              className="rounded-sm"
            />
          )}
        </Link>
        <WishlistButton productId={product.id} />
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
          href={`/sarees/${product.slug}`}
          className="text-sm font-medium text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        {product.fabricName ? (
          <span className="text-meta text-muted-foreground">
            {product.fabricName}
          </span>
        ) : null}

        {product.review_count > 0 ? (
          <div className="text-meta flex items-center gap-1 text-muted-foreground">
            <Star className="size-3 fill-brand-mustard text-brand-mustard" />
            <span>{product.avg_rating.toFixed(1)}</span>
            <span>({product.review_count})</span>
          </div>
        ) : null}

        <div className="mt-1 flex items-center gap-2">
          <span className="text-price font-semibold text-foreground">
            {formatINR(product.selling_price)}
          </span>
          {discount > 0 ? (
            <span className="text-meta text-muted-foreground line-through">
              {formatINR(product.original_price)}
            </span>
          ) : null}
        </div>
      </div>

      <AddToCartButton productId={product.id} soldOut={soldOut} />
    </div>
  );
}
