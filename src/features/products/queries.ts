import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/db/public";
import { getPrimaryImageMap } from "@/features/products/images";
import type { Database } from "@/types/supabase";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductListItem = ProductRow & {
  fabricName: string | null;
  imageUrl: string | null;
};

type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

async function enrichProducts(
  supabase: SupabaseClient<Database>,
  products: ProductRow[],
): Promise<ProductListItem[]> {
  if (products.length === 0) return [];

  const fabricIds = [
    ...new Set(
      products
        .map((p) => p.fabric_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const [fabricsResult, imageMap] = await Promise.all([
    fabricIds.length > 0
      ? supabase.from("fabrics").select("id, name").in("id", fabricIds)
      : Promise.resolve({ data: [] }),
    getPrimaryImageMap(
      supabase,
      products.map((p) => p.id),
    ),
  ]);

  const fabricMap = new Map<string, string>();
  for (const f of fabricsResult.data ?? []) fabricMap.set(f.id, f.name);

  return products.map((p) => ({
    ...p,
    fabricName: p.fabric_id ? (fabricMap.get(p.fabric_id) ?? null) : null,
    imageUrl: imageMap.get(p.id) ?? null,
  }));
}

function dedupeProducts(products: ProductRow[]): ProductRow[] {
  const seen = new Set<string>();
  const unique: ProductRow[] = [];
  for (const product of products) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    unique.push(product);
  }
  return unique;
}

export async function getNewArrivals(limit = 8): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return enrichProducts(supabase, data ?? []);
}

export async function getBestSellers(limit = 8): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("review_count", { ascending: false })
    .order("avg_rating", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return enrichProducts(supabase, data ?? []);
}

export async function getTrendingNow(limit = 10): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .order("avg_rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return enrichProducts(supabase, data ?? []);
}

export async function getShopByCategoryTiles(
  limit = 8,
): Promise<CategoryTile[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type HomepageData = {
  trending: ProductListItem[];
  newArrivals: ProductListItem[];
  bestSellers: ProductListItem[];
  categories: CategoryTile[];
};

// One round-trip batch for the homepage instead of 9+ separate queries.
const loadHomepageData = unstable_cache(
  async (): Promise<HomepageData> => {
    const supabase = createPublicClient();

    const [trendingRes, newArrivalsRes, bestSellersRes, categoriesRes] =
      await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("status", "ACTIVE")
          .order("avg_rating", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("products")
          .select("*")
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("products")
          .select("*")
          .eq("status", "ACTIVE")
          .order("review_count", { ascending: false })
          .order("avg_rating", { ascending: false })
          .limit(8),
        supabase
          .from("categories")
          .select("id, name, slug, image_url")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(8),
      ]);

    if (trendingRes.error) throw trendingRes.error;
    if (newArrivalsRes.error) throw newArrivalsRes.error;
    if (bestSellersRes.error) throw bestSellersRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    const allRows = dedupeProducts([
      ...(trendingRes.data ?? []),
      ...(newArrivalsRes.data ?? []),
      ...(bestSellersRes.data ?? []),
    ]);
    const enriched = await enrichProducts(supabase, allRows);
    const enrichedMap = new Map(enriched.map((p) => [p.id, p]));

    const mapList = (rows: ProductRow[]) =>
      rows
        .map((row) => enrichedMap.get(row.id))
        .filter((p): p is ProductListItem => p !== undefined);

    return {
      trending: mapList(trendingRes.data ?? []),
      newArrivals: mapList(newArrivalsRes.data ?? []),
      bestSellers: mapList(bestSellersRes.data ?? []),
      categories: categoriesRes.data ?? [],
    };
  },
  ["homepage-data"],
  { revalidate: 60 },
);

export async function getHomepageData(): Promise<HomepageData> {
  return loadHomepageData();
}
