import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/db/service";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Static, canonical, publicly-indexable routes only. Category browsing
// lives at /shop?category=slug (a filtered view of /sarees, not a
// distinct page — see the canonical on /sarees), so it's deliberately
// left out here rather than listing near-duplicate filtered URLs.
const STATIC_ROUTES = ["/", "/sarees", "/track-order"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .neq("status", "ARCHIVED");

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "daily" : "hourly",
    priority: path === "/" ? 1 : 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${siteUrl}/sarees/${p.slug}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticEntries, ...productEntries];
}
