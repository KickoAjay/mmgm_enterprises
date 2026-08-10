"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const ACCENTS = [
  { name: "Burgundy", className: "bg-brand-burgundy" },
  { name: "Rose", className: "bg-brand-rose" },
  { name: "Dusty Pink", className: "bg-brand-dusty-pink" },
  { name: "Emerald", className: "bg-brand-emerald" },
  { name: "Mustard", className: "bg-brand-mustard" },
  { name: "Terracotta", className: "bg-brand-terracotta" },
  { name: "Plum", className: "bg-brand-plum" },
  { name: "Champagne Gold", className: "bg-brand-champagne" },
];

// Phase 1 scaffold placeholder — proves fonts, design tokens, shadcn/ui,
// and Framer Motion are wired correctly. The real homepage (hero banner,
// category tiles, trending/new-arrivals carousels, editorial banners) is
// built in Phase 3.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
          MMGM Enterprises
        </span>

        <h1 className="mt-6 font-serif text-hero text-foreground">
          Elegance Woven Into Every Thread
        </h1>

        <p className="mt-4 max-w-md text-muted-foreground">
          Discover timeless sarees curated for every occasion.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="px-6 tracking-wide uppercase">
            Shop Sarees
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-6 tracking-wide uppercase"
          >
            Explore Collections
          </Button>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          {ACCENTS.map((accent) => (
            <div key={accent.name} className="flex flex-col items-center gap-2">
              <span
                className={`size-6 rounded-full border border-border ${accent.className}`}
                aria-hidden
              />
              <span className="text-meta text-muted-foreground">
                {accent.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
