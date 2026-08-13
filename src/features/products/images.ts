import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Shared by every product-list query (New Arrivals, Best Sellers,
// Trending, catalog grid, similar products) — one image per product,
// preferring product_images.is_primary when set, else the lowest
// sort_order. Mirrors the getAvailabilityMap pattern (availability.ts):
// accepts whichever client the caller already has, batches by product_id
// rather than one query per card.
export async function getPrimaryImageMap(
  supabase: SupabaseClient<Database>,
  productIds: string[],
): Promise<Map<string, string>> {
  if (productIds.length === 0) return new Map();

  const { data } = await supabase
    .from("product_images")
    .select("product_id, url, is_primary")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  const map = new Map<string, string>();
  for (const img of data ?? []) {
    if (!map.has(img.product_id) || img.is_primary) {
      map.set(img.product_id, img.url);
    }
  }
  return map;
}
