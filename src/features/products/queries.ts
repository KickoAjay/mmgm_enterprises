import "server-only";
import { createClient } from "@/lib/db/server";
import type { Database } from "@/types/supabase";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductListItem = ProductRow & { fabricName: string | null };

// Homepage sections only need the fabric's name, and the hand-maintained
// Database type (src/types/supabase.ts) doesn't model foreign-table
// relationships for typed embedded selects — so this does a second lookup
// query instead of `.select("*, fabrics(name)")`. Revisit once generated
// types are available.
async function withFabricNames(
  products: ProductRow[],
): Promise<ProductListItem[]> {
  if (products.length === 0) return [];

  const supabase = await createClient();
  const fabricIds = [
    ...new Set(
      products
        .map((p) => p.fabric_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const fabricMap = new Map<string, string>();
  if (fabricIds.length > 0) {
    const { data: fabrics } = await supabase
      .from("fabrics")
      .select<"id, name", { id: string; name: string }>("id, name")
      .in("id", fabricIds);
    for (const f of fabrics ?? []) fabricMap.set(f.id, f.name);
  }

  return products.map((p) => ({
    ...p,
    fabricName: p.fabric_id ? (fabricMap.get(p.fabric_id) ?? null) : null,
  }));
}

export async function getNewArrivals(limit = 8): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return withFabricNames(data ?? []);
}

// No real order history yet, so "best selling" / "trending" fall back to
// rating/recency ordering — both are 0/tied across the seeded catalog
// until real reviews and sales exist (Phase 9/10 onward).
export async function getBestSellers(limit = 8): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("review_count", { ascending: false })
    .order("avg_rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return withFabricNames(data ?? []);
}

export async function getTrendingNow(limit = 10): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("avg_rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return withFabricNames(data ?? []);
}

type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export async function getShopByCategoryTiles(
  limit = 8,
): Promise<CategoryTile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select<"id, name, slug, image_url", CategoryTile>(
      "id, name, slug, image_url",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
