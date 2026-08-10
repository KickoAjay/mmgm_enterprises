import { SectionHeading } from "@/components/store/section-heading";
import { ProductCard } from "@/components/store/product-card";
import type { ProductListItem } from "@/features/products/queries";

export function ProductGrid({
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
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
