"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// No DB column backs the hero banner (it's not tied to a product or
// category) — the image is a hardcoded editorial choice, same as the
// headline copy below it. Sourced from Pexels (free license); swap this
// constant for real brand photography whenever it exists. Pure product
// photography only (fabric close-up, no people) — see docs/architecture.md
// §28 for why lifestyle/model photography was deliberately avoided.
const HERO_IMAGE_URL =
  "https://images.pexels.com/photos/10317127/pexels-photo-10317127.jpeg?auto=compress&cs=tinysrgb&w=1920";

export function HeroBanner() {
  return (
    <section className="relative">
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        <Image
          src={HERO_IMAGE_URL}
          alt="Close-up of richly patterned silk saree fabric"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex max-w-xl flex-col items-center px-6 text-center"
        >
          <span className="text-meta font-semibold tracking-[0.2em] text-white/80 uppercase">
            MMGM Enterprises
          </span>
          <h1 className="mt-4 font-serif text-hero text-white">
            Elegance Woven Into Every Thread
          </h1>
          <p className="mt-4 max-w-md text-white/85">
            Discover timeless sarees curated for every occasion.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="px-6 tracking-wide uppercase">
              <Link href="/sarees">Shop Sarees</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/60 bg-transparent px-6 tracking-wide text-white uppercase hover:bg-white/10 hover:text-white"
            >
              <Link href="/collections">Explore Collections</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
