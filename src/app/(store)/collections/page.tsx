import { ShopByCategory } from "@/components/store/home/shop-by-category";

export const metadata = {
  title: "Collections",
  description: "Browse every MMGM Enterprises saree collection by category.",
};

export default function CollectionsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-2 text-center">
        <h1 className="font-serif text-section text-foreground">Our Collections</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Beautifully refurbished sarees, quality-checked and curated by category.
        </p>
      </div>
      <ShopByCategory limit={24} />
    </main>
  );
}
