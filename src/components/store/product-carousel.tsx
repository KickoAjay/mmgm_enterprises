import { SectionHeading } from "@/components/store/section-heading";
import { ProductCard } from "@/components/store/product-card";
import type { ProductListItem } from "@/features/products/queries";

export function ProductCarousel({
  title,
  products,
}: {
  title: string;
  products: ProductListItem[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeading title={title} />
      <div className="flex gap-6 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-48 shrink-0 sm:w-56">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
