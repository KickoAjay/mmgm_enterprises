import Link from "next/link";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { SectionHeading } from "@/components/store/section-heading";

const OFFERS = [
  { label: "Under ₹999", href: "/shop?maxPrice=999", seed: "offer-under-999" },
  {
    label: "Under ₹1,999",
    href: "/shop?maxPrice=1999",
    seed: "offer-under-1999",
  },
  {
    label: "Under ₹2,999",
    href: "/shop?maxPrice=2999",
    seed: "offer-under-2999",
  },
  {
    label: "Premium Sarees",
    href: "/shop?category=designer-sarees",
    seed: "offer-premium",
  },
  {
    label: "Wedding Collection",
    href: "/shop?category=wedding-sarees",
    seed: "offer-wedding",
  },
];

export function OffersSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        title="Up to 50% OFF"
        subtitle="Curated edits across every budget — without compromising on quality."
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {OFFERS.map((offer) => (
          <Link key={offer.href} href={offer.href} className="group block">
            <MediaPlaceholder
              seed={offer.seed}
              label={offer.label}
              aspect="aspect-[3/4]"
              className="rounded-sm transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="mt-3 block text-center text-sm font-medium text-foreground">
              {offer.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
