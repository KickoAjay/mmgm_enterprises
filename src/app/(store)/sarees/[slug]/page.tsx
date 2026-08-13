import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import {
  getProductDetail,
  getSimilarProducts,
  getProductReviews,
} from "@/features/products/detail";
import { formatINR } from "@/features/products/format";
import { ProductGallery } from "@/components/store/product/product-gallery";
import { ProductActions } from "@/components/store/product/product-actions";
import { DeliveryCheck } from "@/components/store/product/delivery-check";
import { ProductInfoSections } from "@/components/store/product/product-info-sections";
import { RecentlyViewed } from "@/components/store/product/recently-viewed";
import { WishlistButton } from "@/components/store/wishlist-button";
import { ProductCarousel } from "@/components/store/product-carousel";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) return {};

  return {
    title: `${product.name} | MMGM Enterprises`,
    description:
      product.shortDescription ??
      product.description?.slice(0, 160) ??
      `Shop ${product.name} at MMGM Enterprises.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) notFound();

  const [similar, reviews] = await Promise.all([
    getSimilarProducts(product),
    getProductReviews(product.id),
  ]);

  const soldOut = product.isAvailable === false;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <nav className="text-meta flex items-center gap-2 text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span>/</span>
        <Link href="/sarees" className="hover:text-primary">
          Sarees
        </Link>
        {product.categoryName && product.categorySlug ? (
          <>
            <span>/</span>
            <Link
              href={`/shop?category=${product.categorySlug}`}
              className="hover:text-primary"
            >
              {product.categoryName}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          seed={product.slug}
          label={product.name}
        />

        <div className="flex flex-col">
          <h1 className="font-serif text-section text-foreground">
            {product.name}
          </h1>

          <div className="mt-2 flex items-center gap-3">
            {product.reviewCount > 0 ? (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-4 fill-brand-mustard text-brand-mustard" />
                <span>{product.avgRating.toFixed(1)}</span>
                <span>({product.reviewCount} reviews)</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                No reviews yet
              </span>
            )}
            <span className="text-meta text-muted-foreground">
              SKU: {product.sku}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-price text-xl font-semibold text-foreground">
              {formatINR(product.sellingPrice)}
            </span>
            {product.discountPercent > 0 ? (
              <>
                <span className="text-muted-foreground line-through">
                  {formatINR(product.originalPrice)}
                </span>
                <span className="text-meta rounded-sm bg-primary px-2 py-1 font-semibold text-primary-foreground">
                  {product.discountPercent}% OFF
                </span>
              </>
            ) : null}
          </div>

          <span
            className={
              soldOut
                ? "text-meta mt-3 inline-block w-fit rounded-sm bg-foreground px-2 py-1 font-semibold text-background"
                : "text-meta mt-3 inline-block w-fit rounded-sm bg-brand-emerald px-2 py-1 font-semibold text-white"
            }
          >
            {soldOut ? "Out of Stock" : "In Stock"}
          </span>

          <div className="mt-6">
            <ProductActions productId={product.id} soldOut={soldOut} />
          </div>

          <div className="mt-3 flex">
            <WishlistButton productId={product.id} variant="inline" />
          </div>

          <div className="mt-6">
            <DeliveryCheck
              returnEligible={product.returnEligible}
              returnPeriodDays={product.returnPeriodDays}
            />
          </div>
        </div>
      </div>

      <ProductInfoSections product={product} reviews={reviews} />

      <ProductCarousel title="Similar Sarees" products={similar} />

      <RecentlyViewed
        current={{
          slug: product.slug,
          name: product.name,
          fabricName: product.fabricName,
          imageUrl: product.images[0]?.url ?? null,
          sellingPrice: product.sellingPrice,
        }}
      />
    </main>
  );
}
