import "server-only";
import { createClient } from "@/lib/db/server";
import type { Database } from "@/types/supabase";
import {
  PRICE_BANDS,
  PAGE_SIZE,
  type CatalogSearchParams,
  type CatalogResult,
  type FilterOptions,
  type CatalogProduct,
  type SortOption,
} from "@/features/products/catalog-constants";

export * from "@/features/products/catalog-constants";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

// Candidate cap when the Availability filter is active — see the "Hybrid
// availability filtering" note below for why this can't be a plain DB-level
// `.range()` pagination in that case.
const AVAILABILITY_CANDIDATE_CAP = 300;

function parseList(value?: string): string[] {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}

async function namesToIds(
  table: "fabrics" | "colors" | "patterns" | "occasions",
  names: string[],
): Promise<string[]> {
  if (names.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select("id, name")
    .in("name", names);
  return (data ?? []).map((row) => row.id);
}

async function categorySlugToId(slug?: string): Promise<string | null> {
  if (!slug) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

// Resolves free-text search words against the taxonomy tables so a query
// like "red silk" (spec §20's own example) matches products by fabric/
// color/pattern/category name, not just substring hits on name/description.
async function searchTaxonomyIds(q: string) {
  const words = q.split(/\s+/).filter(Boolean);
  const empty = {
    fabricIds: [] as string[],
    colorIds: [] as string[],
    patternIds: [] as string[],
    categoryIds: [] as string[],
  };
  if (words.length === 0) return empty;

  const supabase = await createClient();
  const orExpr = words.map((w) => `name.ilike.%${w}%`).join(",");

  const [fabrics, colors, patterns, categories] = await Promise.all([
    supabase.from("fabrics").select("id").or(orExpr),
    supabase.from("colors").select("id").or(orExpr),
    supabase.from("patterns").select("id").or(orExpr),
    supabase.from("categories").select("id").or(orExpr),
  ]);

  return {
    fabricIds: (fabrics.data ?? []).map((r) => r.id),
    colorIds: (colors.data ?? []).map((r) => r.id),
    patternIds: (patterns.data ?? []).map((r) => r.id),
    categoryIds: (categories.data ?? []).map((r) => r.id),
  };
}

async function searchProductIds(q: string): Promise<string[]> {
  const supabase = await createClient();
  const taxonomy = await searchTaxonomyIds(q);
  const matched = new Set<string>();

  const orParts: string[] = [];
  if (taxonomy.fabricIds.length)
    orParts.push(`fabric_id.in.(${taxonomy.fabricIds.join(",")})`);
  if (taxonomy.colorIds.length) {
    orParts.push(`primary_color_id.in.(${taxonomy.colorIds.join(",")})`);
    orParts.push(`secondary_color_id.in.(${taxonomy.colorIds.join(",")})`);
  }
  if (taxonomy.patternIds.length)
    orParts.push(`pattern_id.in.(${taxonomy.patternIds.join(",")})`);
  if (taxonomy.categoryIds.length)
    orParts.push(`category_id.in.(${taxonomy.categoryIds.join(",")})`);

  if (orParts.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .or(orParts.join(","));
    for (const row of data ?? []) matched.add(row.id);
  }

  const { data: textMatches } = await supabase
    .from("products")
    .select("id")
    .or(
      `name.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`,
    );
  for (const row of textMatches ?? []) matched.add(row.id);

  return [...matched];
}

async function productIdsForOccasions(
  occasionIds: string[],
): Promise<string[]> {
  if (occasionIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_occasions")
    .select("product_id")
    .in("occasion_id", occasionIds);
  return [...new Set((data ?? []).map((r) => r.product_id))];
}

// The only public-facing read of stock status — routes through the
// SECURITY DEFINER `get_product_availability` RPC (Phase 4 migration)
// rather than selecting from `inventory` directly, which stays admin-only.
async function getAvailabilityMap(
  productIds: string[],
): Promise<Map<string, boolean>> {
  if (productIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_product_availability", {
    p_product_ids: productIds,
  });
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.product_id, row.is_available]));
}

async function getFilterOptions(): Promise<FilterOptions> {
  const supabase = await createClient();
  const [categories, fabrics, colors, patterns, occasions] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("fabrics").select("id, name").order("name"),
    supabase.from("colors").select("id, name, hex_code").order("name"),
    supabase.from("patterns").select("id, name").order("name"),
    supabase.from("occasions").select("id, name").order("name"),
  ]);

  return {
    categories: categories.data ?? [],
    fabrics: fabrics.data ?? [],
    colors: colors.data ?? [],
    patterns: patterns.data ?? [],
    occasions: occasions.data ?? [],
  };
}

export async function getCatalogPage(
  params: CatalogSearchParams,
): Promise<CatalogResult> {
  const supabase = await createClient();

  const q = params.q?.trim() ?? "";
  const sort: SortOption = (params.sort as SortOption) || "recommended";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const priceBand = PRICE_BANDS.find((b) => b.key === params.price);
  const discountMin = params.discount ? Number(params.discount) : undefined;
  const availability =
    params.availability === "in-stock" || params.availability === "out-of-stock"
      ? params.availability
      : undefined;

  const [
    categoryId,
    fabricIds,
    colorIds,
    patternIds,
    occasionIds,
    filterOptions,
  ] = await Promise.all([
    categorySlugToId(params.category),
    namesToIds("fabrics", parseList(params.fabric)),
    namesToIds("colors", parseList(params.color)),
    namesToIds("patterns", parseList(params.pattern)),
    namesToIds("occasions", parseList(params.occasion)),
    getFilterOptions(),
  ]);

  const empty = (): CatalogResult => ({
    items: [],
    totalCount: 0,
    page,
    pageCount: 0,
    filterOptions,
  });

  let idFilter: string[] | undefined;
  if (q) {
    const ids = await searchProductIds(q);
    if (ids.length === 0) return empty();
    idFilter = ids;
  }
  if (occasionIds.length > 0) {
    const ids = await productIdsForOccasions(occasionIds);
    if (ids.length === 0) return empty();
    idFilter = idFilter ? idFilter.filter((id) => ids.includes(id)) : ids;
    if (idFilter.length === 0) return empty();
  }

  function buildQuery() {
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("status", "ACTIVE");
    if (categoryId) query = query.eq("category_id", categoryId);
    if (fabricIds.length > 0) query = query.in("fabric_id", fabricIds);
    if (patternIds.length > 0) query = query.in("pattern_id", patternIds);
    if (colorIds.length > 0) {
      query = query.or(
        `primary_color_id.in.(${colorIds.join(",")}),secondary_color_id.in.(${colorIds.join(",")})`,
      );
    }
    if (priceBand) {
      query = query.gte("selling_price", priceBand.min);
      if (priceBand.max !== null)
        query = query.lte("selling_price", priceBand.max);
    }
    if (discountMin) query = query.gte("discount_percent", discountMin);
    if (idFilter) query = query.in("id", idFilter);

    switch (sort) {
      case "newest":
        return query.order("created_at", { ascending: false });
      case "best-selling":
        return query
          .order("review_count", { ascending: false })
          .order("avg_rating", { ascending: false });
      case "price-asc":
        return query.order("selling_price", { ascending: true });
      case "price-desc":
        return query.order("selling_price", { ascending: false });
      case "rating":
        return query.order("avg_rating", { ascending: false });
      case "discount":
        return query.order("discount_percent", { ascending: false });
      case "recommended":
      default:
        return query.order("created_at", { ascending: false });
    }
  }

  let rows: ProductRow[];
  let totalCount: number;

  if (availability) {
    // Hybrid availability filtering: stock status lives behind the
    // get_product_availability RPC, not a filterable column on `products`,
    // so it can't be pushed into the SQL query/pagination above. Instead,
    // pull a capped candidate set (already filtered/sorted by everything
    // else), resolve availability for those, then filter+paginate in JS.
    // Fine at this catalog's scale; revisit (e.g. a materialized
    // availability column) if the catalog grows well past the cap.
    const { data, error } = await buildQuery().limit(
      AVAILABILITY_CANDIDATE_CAP,
    );
    if (error) throw error;
    const candidates = data ?? [];
    const availMap = await getAvailabilityMap(candidates.map((p) => p.id));
    const filtered = candidates.filter((p) => {
      const isAvailable = availMap.get(p.id) ?? true;
      return availability === "in-stock" ? isAvailable : !isAvailable;
    });
    totalCount = filtered.length;
    const start = (page - 1) * PAGE_SIZE;
    rows = filtered.slice(start, start + PAGE_SIZE);
  } else {
    const start = (page - 1) * PAGE_SIZE;
    const { data, error, count } = await buildQuery().range(
      start,
      start + PAGE_SIZE - 1,
    );
    if (error) throw error;
    rows = data ?? [];
    totalCount = count ?? 0;
  }

  const fabricNameMap = new Map(
    filterOptions.fabrics.map((f) => [f.id, f.name]),
  );
  const pageAvailability = await getAvailabilityMap(rows.map((p) => p.id));
  const items: CatalogProduct[] = rows.map((p) => ({
    ...p,
    fabricName: p.fabric_id ? (fabricNameMap.get(p.fabric_id) ?? null) : null,
    isAvailable: pageAvailability.get(p.id) ?? null,
  }));

  return {
    items,
    totalCount,
    page,
    pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    filterOptions,
  };
}
