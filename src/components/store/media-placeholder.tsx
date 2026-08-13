import { cn } from "@/lib/utils";

// Fallback for whenever a product/category genuinely has no image (most
// now have real Pexels-sourced photography, seeded via product_images/
// categories.image_url — see docs/architecture.md §28) — a mismatched
// stock photo would be worse than a tasteful placeholder tile. The
// gradient is deterministic per `seed` (e.g. a product slug) so the same
// item always gets the same treatment.
const GRADIENTS: [string, string][] = [
  ["var(--brand-burgundy)", "var(--brand-plum)"],
  ["var(--brand-rose)", "var(--brand-dusty-pink)"],
  ["var(--brand-terracotta)", "var(--brand-mustard)"],
  ["var(--brand-plum)", "var(--brand-burgundy)"],
  ["var(--brand-emerald)", "var(--brand-plum)"],
  ["var(--brand-champagne)", "var(--brand-terracotta)"],
];

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function MediaPlaceholder({
  seed,
  label,
  className,
  aspect = "aspect-[3/4]",
}: {
  seed: string;
  label?: string;
  className?: string;
  aspect?: string;
}) {
  const [from, to] = GRADIENTS[hashSeed(seed) % GRADIENTS.length];
  const monogram = (label ?? seed).trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        aspect,
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span
        className="font-serif text-6xl text-white/25 select-none"
        aria-hidden
      >
        {monogram}
      </span>
    </div>
  );
}
