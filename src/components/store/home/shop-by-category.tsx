import Link from "next/link";
import Image from "next/image";
import { getShopByCategoryTiles } from "@/features/products/queries";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { SectionHeading } from "@/components/store/section-heading";

export async function ShopByCategory() {
  const categories = await getShopByCategoryTiles();
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeading title="Shop by Category" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className="group block"
          >
            {category.image_url ? (
              <div className="relative aspect-square overflow-hidden rounded-sm bg-secondary">
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <MediaPlaceholder
                seed={category.slug}
                label={category.name}
                aspect="aspect-square"
                className="rounded-sm transition-transform duration-300 group-hover:scale-[1.02]"
              />
            )}
            <span className="mt-3 block text-center text-sm font-medium text-foreground">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
