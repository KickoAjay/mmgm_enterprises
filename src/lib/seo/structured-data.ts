// Escapes "<" so a value like a product name can never prematurely close
// the surrounding <script> tag when this is serialized into page HTML.
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  description: string | null;
  sku: string;
  brand: string;
  images: { url: string }[];
  sellingPrice: number;
  isAvailable: boolean | null;
  avgRating: number;
  reviewCount: number;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      url: product.url,
      priceCurrency: "INR",
      price: product.sellingPrice,
      availability:
        product.isAvailable === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.avgRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
}
