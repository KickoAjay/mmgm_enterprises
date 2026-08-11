import { HeroBanner } from "@/components/store/home/hero-banner";
import { ShopByCategory } from "@/components/store/home/shop-by-category";
import { ProductCarousel } from "@/components/store/product-carousel";
import { ProductGrid } from "@/components/store/home/product-grid";
import { EditorialBanner } from "@/components/store/home/editorial-banner";
import { OffersSection } from "@/components/store/home/offers-section";
import {
  getTrendingNow,
  getNewArrivals,
  getBestSellers,
} from "@/features/products/queries";

export default async function Home() {
  const [trending, newArrivals, bestSellers] = await Promise.all([
    getTrendingNow(),
    getNewArrivals(),
    getBestSellers(),
  ]);

  return (
    <main>
      <HeroBanner />
      <ShopByCategory />

      <ProductCarousel title="Trending Now" products={trending} />

      <EditorialBanner
        eyebrow="The Silk Edit"
        title="Timeless Silk, Woven for Unforgettable Occasions"
        description="Explore our curated edit of pure and blended silk sarees, crafted for weddings and festive celebrations."
        ctaLabel="Explore Silk"
        ctaHref="/shop?fabric=silk"
        seed="edit-silk"
      />

      <ProductGrid title="New Arrivals" products={newArrivals} />

      <EditorialBanner
        eyebrow="Wedding Edit"
        title="Bridal Elegance, Reimagined"
        description="From Kanchipuram silks to Banarasi brocades — sarees made for your biggest day."
        ctaLabel="Explore Wedding"
        ctaHref="/shop?category=wedding-sarees"
        seed="edit-wedding"
        reverse
      />

      <EditorialBanner
        eyebrow="Festive Edit"
        title="Dressed for Every Celebration"
        description="Vibrant traditional weaves and zari work, ready for festival mornings and evening pujas alike."
        ctaLabel="Explore Festive"
        ctaHref="/shop?category=festive"
        seed="edit-festive"
      />

      <ProductGrid title="Best Sellers" products={bestSellers} />

      <EditorialBanner
        eyebrow="Handloom Edit"
        title="Crafted by Hand, Worn with Pride"
        description="Celebrate India's weaving heritage with our handloom saree collection."
        ctaLabel="Explore Handloom"
        ctaHref="/shop?category=handloom"
        seed="edit-handloom"
        reverse
      />

      <EditorialBanner
        eyebrow="Everyday Elegance"
        title="Sarees for Office, Errands & Everything Between"
        description="Breathable cottons and linens designed for effortless everyday wear."
        ctaLabel="Explore Daily Wear"
        ctaHref="/shop?category=daily-wear"
        seed="edit-everyday"
      />

      <OffersSection />
    </main>
  );
}
