"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { MediaPlaceholder } from "@/components/store/media-placeholder";
import { SectionHeading } from "@/components/store/section-heading";
import { formatINR } from "@/features/products/format";

const STORAGE_KEY = "mmgm_recently_viewed";
const MAX_ITEMS = 8;

export type RecentProduct = {
  slug: string;
  name: string;
  fabricName: string | null;
  imageUrl: string | null;
  sellingPrice: number;
};

function noopSubscribe() {
  return () => {};
}

// localStorage doesn't exist during SSR — useSyncExternalStore is the
// React-sanctioned way to read a client-only external store without a
// hydration mismatch (getServerSnapshot matches what the server rendered;
// getSnapshot picks up the real value once hydrated). This avoids the
// react-hooks/set-state-in-effect issue a naive useEffect+useState version
// hits: reading here never calls setState, React's own sync does the work.
function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

function parseStored(json: string): RecentProduct[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

// Fully client-side (localStorage) — there's no `recently_viewed` table in
// the schema, and tracking this server-side for guests would need its own
// session/cookie plumbing for a genuinely minor feature. Prices shown are
// a snapshot from when each product was last viewed, not live.
export function RecentlyViewed({ current }: { current: RecentProduct }) {
  const storedJson = useSyncExternalStore(
    noopSubscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const stored = parseStored(storedJson);
  const items = stored
    .filter((p) => p.slug !== current.slug)
    .slice(0, MAX_ITEMS);

  // Records this visit for next time — writes localStorage only, never
  // calls setState, so it doesn't trigger the effect-setState lint rule.
  useEffect(() => {
    const updated = [
      current,
      ...stored.filter((p) => p.slug !== current.slug),
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-record when the viewed product changes
  }, [current.slug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <SectionHeading title="Recently Viewed" />
      <div className="flex gap-6 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/sarees/${item.slug}`}
            className="w-40 shrink-0 sm:w-48"
          >
            {item.imageUrl ? (
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
            ) : (
              <MediaPlaceholder
                seed={item.slug}
                label={item.name}
                className="rounded-sm"
              />
            )}
            <p className="mt-2 text-sm text-foreground">{item.name}</p>
            {item.fabricName ? (
              <p className="text-meta text-muted-foreground">
                {item.fabricName}
              </p>
            ) : null}
            <p className="text-price mt-1 font-semibold text-foreground">
              {formatINR(item.sellingPrice)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
