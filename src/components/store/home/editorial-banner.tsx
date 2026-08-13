import Link from "next/link";
import Image from "next/image";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { cn } from "@/lib/utils";

export function EditorialBanner({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  seed,
  imageUrl,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  seed: string;
  imageUrl?: string;
  reverse?: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div
        className={cn(
          "grid items-center gap-8 lg:grid-cols-2",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        {imageUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-secondary">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : (
          <MediaPlaceholder
            seed={seed}
            aspect="aspect-[4/3]"
            className="rounded-sm"
          />
        )}
        <div className="flex flex-col items-start px-2">
          <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
            {eyebrow}
          </span>
          <h2 className="mt-3 font-serif text-section text-foreground">
            {title}
          </h2>
          <p className="mt-3 max-w-sm text-muted-foreground">{description}</p>
          <Link
            href={ctaHref}
            className="mt-6 text-sm font-semibold tracking-wide text-primary uppercase underline-offset-4 hover:underline"
          >
            {ctaLabel} →
          </Link>
        </div>
      </div>
    </section>
  );
}
