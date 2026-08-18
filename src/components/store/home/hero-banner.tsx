"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 3000;
const FADE_DURATION_S = 1;

// No DB column backs the hero banner (it's not tied to a product or
// category) — these are hardcoded editorial choices, same as the headline
// copy below them. Sourced from Pexels (free license). Pure product
// photography only (folded/draped saree fabric, no people) — see
// docs/architecture.md §28 for why lifestyle/model photography was
// deliberately avoided. All 5 pre-loaded (not mounted/unmounted per
// slide) so the crossfade never has to wait on a network fetch.
const HERO_SLIDES = [
  {
    url: "https://images.pexels.com/photos/10317127/pexels-photo-10317127.jpeg?auto=compress&cs=tinysrgb&w=1920",
    alt: "Colorful Kanchipuram silk saree fabric",
  },
  {
    url: "https://images.pexels.com/photos/10317106/pexels-photo-10317106.jpeg?auto=compress&cs=tinysrgb&w=1920",
    alt: "A folded stack of Kanchipuram silk sarees",
  },
  {
    url: "https://images.pexels.com/photos/5439051/pexels-photo-5439051.jpeg?auto=compress&cs=tinysrgb&w=1920",
    alt: "Traditional red silk saree draped elegantly",
  },
  {
    url: "https://images.pexels.com/photos/7676340/pexels-photo-7676340.jpeg?auto=compress&cs=tinysrgb&w=1920",
    alt: "Luxurious gold and blue silk saree drapery",
  },
  {
    url: "https://images.pexels.com/photos/7676888/pexels-photo-7676888.jpeg?auto=compress&cs=tinysrgb&w=1920",
    alt: "Emerald green silk saree fabric",
  },
];

export function HeroBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        {HERO_SLIDES.map((slide, i) => (
          <motion.div
            key={slide.url}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: FADE_DURATION_S, ease: "easeInOut" }}
          >
            {/* Slow continuous zoom ("Ken Burns") only while a slide is
                active — restarts from 1 each time it becomes current. */}
            <motion.div
              className="relative size-full"
              animate={{ scale: i === index ? 1.06 : 1 }}
              transition={{
                duration: SLIDE_INTERVAL_MS / 1000 + FADE_DURATION_S,
                ease: "linear",
              }}
            >
              <Image
                src={slide.url}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* A stronger, gradient-shaped overlay (darkest behind the text,
          fading at the very top/bottom) reads reliably over every slide
          regardless of how light or busy that photo is — the flat 30%
          black wash this replaced let white text wash out against
          lighter fabric photography. */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-black/45 via-black/50 to-black/45">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex max-w-xl flex-col items-center px-6 text-center [text-shadow:0_2px_12px_rgb(0_0_0_/_0.45)]"
        >
          <span className="text-meta font-semibold tracking-[0.2em] text-white/90 uppercase">
            MMGM Enterprises
          </span>
          <h1 className="mt-4 font-serif text-hero text-white">
            Elegance Woven Into Every Thread
          </h1>
          <p className="mt-4 max-w-md text-white/90">
            Premium, quality-checked refurbished sarees curated for every occasion.
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

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.url}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75",
            )}
          />
        ))}
      </div>
    </section>
  );
}
