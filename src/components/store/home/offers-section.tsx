import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/store/section-heading";

const OFFERS = [
  {
    label: "Under ₹999",
    href: "/shop?maxPrice=999",
    imageUrl:
      "https://images.pexels.com/photos/20531149/pexels-photo-20531149.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Under ₹1,999",
    href: "/shop?maxPrice=1999",
    imageUrl:
      "https://images.pexels.com/photos/9824794/pexels-photo-9824794.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Under ₹2,999",
    href: "/shop?maxPrice=2999",
    imageUrl:
      "https://images.pexels.com/photos/30243795/pexels-photo-30243795.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Premium Sarees",
    href: "/shop?category=designer-sarees",
    imageUrl:
      "https://images.pexels.com/photos/8793891/pexels-photo-8793891.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    label: "Wedding Collection",
    href: "/shop?category=wedding-sarees",
    imageUrl:
      "https://images.pexels.com/photos/14944287/pexels-photo-14944287.jpeg?auto=compress&cs=tinysrgb&w=800",
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
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary transition-transform duration-300 group-hover:scale-[1.02]">
              <Image
                src={offer.imageUrl}
                alt={offer.label}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover"
              />
            </div>
            <span className="mt-3 block text-center text-sm font-medium text-foreground">
              {offer.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
