import { OffersSection } from "@/components/store/home/offers-section";

export const metadata = {
  title: "Offers",
  description: "Shop the best deals on MMGM Enterprises' quality-checked refurbished sarees.",
};

export default function OffersPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 pt-10">
      <div className="mb-2 text-center">
        <h1 className="font-serif text-section text-foreground">Offers</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Premium refurbished sarees at every budget, quality-checked before they reach you.
        </p>
      </div>
      <OffersSection />
    </main>
  );
}
