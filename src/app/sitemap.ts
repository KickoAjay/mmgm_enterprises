import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/db/service";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

// Static, canonical, publicly-indexable routes only. Category browsing
// lives at /shop?category=slug (a filtered view of /sarees, not a
// distinct page — see the canonical on /sarees), so it's deliberately
// left out here rather than listing near-duplicate filtered URLs.
const STATIC_ROUTES = ["/", "/sarees", "/track-order"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "daily" : "hourly",
    priority: path === "/" ? 1 : 0.8,
  }));

  // This runs at build time (sitemap.xml is statically generated) — a
  // missing/misconfigured Supabase env var (e.g. a CI run with no
  // Supabase secrets configured) would otherwise fail the entire
  // production build over a sitemap, not just omit product URLs from it.
  // Degrade to the static routes only rather than crashing the build.
  try {
    const supabase = createServiceClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .neq("status", "ARCHIVED");

    const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${siteUrl}/sarees/${p.slug}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "daily",
      priority: 0.9,
    }));

    return [...staticEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}
