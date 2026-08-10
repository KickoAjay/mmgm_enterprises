import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { formatINR, discountPercent } from "@/features/products/format";
import type { ProductListItem } from "@/features/products/queries";

// Wishlist (heart) and Quick Add are visual-only for now — Phase 6 wires
// them up to the real cart/wishlist tables. The product detail link
// (/sarees/[slug]) 404s until Phase 5 builds that route; that's expected
// during phased development, not a bug.
export function ProductCard({
  product,
}: {
  product: ProductListItem & { isAvailable?: boolean | null };
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
          <MediaPlaceholder
            seed={product.slug}
            label={product.name}
            className="rounded-sm"
          />
        </Link>
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:text-primary"
        >
          <Heart className="size-4" />
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

      <button
        type="button"
        disabled={soldOut}
        className="text-meta mt-3 w-full border border-border py-2 font-semibold tracking-wide text-foreground uppercase opacity-0 transition-opacity group-hover:opacity-100 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-0 disabled:group-hover:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
      >
        {soldOut ? "Sold Out" : "Quick Add"}
      </button>
    </div>
  );
}
