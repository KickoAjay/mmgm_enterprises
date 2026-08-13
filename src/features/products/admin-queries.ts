import "server-only";
import { createClient } from "@/lib/db/server";

export type AdminProductListItem = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  status: string;
  sellingPrice: number;
  stockQuantity: number | null;
};

// Admin sees every status (RLS: "status='ACTIVE' or is_admin()" already
// unlocks this on the same session-scoped client used everywhere else —
// no service-role needed for reads here).
export async function getAdminProducts(search?: string): Promise<AdminProductListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  const { data: products } = await query;
  if (!products || products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const { data: inventory } = await supabase
    .from("inventory")
    .select("product_id, quantity")
    .in("product_id", productIds);
  const stockMap = new Map((inventory ?? []).map((i) => [i.product_id, i.quantity]));

  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    status: p.status,
    sellingPrice: p.selling_price,
    stockQuantity: stockMap.get(p.id) ?? null,
  }));
}

export type ProductFormOptions = {
  categories: { id: string; name: string }[];
  fabrics: { id: string; name: string }[];
  materials: { id: string; name: string }[];
  patterns: { id: string; name: string }[];
  colors: { id: string; name: string }[];
  occasions: { id: string; name: string }[];
};

export async function getProductFormOptions(): Promise<ProductFormOptions> {
  const supabase = await createClient();
  const [categories, fabrics, materials, patterns, colors, occasions] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("fabrics").select("id, name").order("name"),
    supabase.from("materials").select("id, name").order("name"),
    supabase.from("patterns").select("id, name").order("name"),
    supabase.from("colors").select("id, name").order("name"),
    supabase.from("occasions").select("id, name").order("name"),
  ]);
  return {
    categories: categories.data ?? [],
    fabrics: fabrics.data ?? [],
    materials: materials.data ?? [],
    patterns: patterns.data ?? [],
    colors: colors.data ?? [],
    occasions: occasions.data ?? [],
  };
}

export type AdminProductDetail = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string | null;
  fabricId: string | null;
  materialId: string | null;
  brand: string;
  description: string | null;
  shortDescription: string | null;
  originalPrice: number;
  sellingPrice: number;
  sareeLengthMeters: number | null;
  blousePieceIncluded: boolean;
  blouseLengthMeters: number | null;
  primaryColorId: string | null;
  secondaryColorId: string | null;
  patternId: string | null;
  design: string | null;
  borderType: string | null;
  borderColor: string | null;
  palluType: string | null;
  workType: string | null;
  weaveType: string | null;
  washCare: string | null;
  countryOfOrigin: string;
  weightGrams: number | null;
  returnEligible: boolean;
  returnPeriodDays: number;
  status: string;
  occasionIds: string[];
  stockQuantity: number;
  lowStockThreshold: number;
  images: { id: string; url: string; altText: string | null; isPrimary: boolean; sortOrder: number }[];
  videos: { id: string; url: string; sortOrder: number }[];
};

export async function getAdminProductDetail(productId: string): Promise<AdminProductDetail | null> {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return null;

  const [{ data: occasionRows }, { data: inventoryRow }, { data: images }, { data: videos }] =
    await Promise.all([
      supabase.from("product_occasions").select("occasion_id").eq("product_id", product.id),
      supabase
        .from("inventory")
        .select("quantity, low_stock_threshold")
        .eq("product_id", product.id)
        .maybeSingle(),
      supabase
        .from("product_images")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("product_videos")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
    ]);

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    categoryId: product.category_id,
    fabricId: product.fabric_id,
    materialId: product.material_id,
    brand: product.brand,
    description: product.description,
    shortDescription: product.short_description,
    originalPrice: product.original_price,
    sellingPrice: product.selling_price,
    sareeLengthMeters: product.saree_length_meters,
    blousePieceIncluded: product.blouse_piece_included,
    blouseLengthMeters: product.blouse_length_meters,
    primaryColorId: product.primary_color_id,
    secondaryColorId: product.secondary_color_id,
    patternId: product.pattern_id,
    design: product.design,
    borderType: product.border_type,
    borderColor: product.border_color,
    palluType: product.pallu_type,
    workType: product.work_type,
    weaveType: product.weave_type,
    washCare: product.wash_care,
    countryOfOrigin: product.country_of_origin,
    weightGrams: product.weight_grams,
    returnEligible: product.return_eligible,
    returnPeriodDays: product.return_period_days,
    status: product.status,
    occasionIds: (occasionRows ?? []).map((r) => r.occasion_id),
    stockQuantity: inventoryRow?.quantity ?? 0,
    lowStockThreshold: inventoryRow?.low_stock_threshold ?? 5,
    images: (images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.alt_text,
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
    })),
    videos: (videos ?? []).map((v) => ({ id: v.id, url: v.url, sortOrder: v.sort_order })),
  };
}
