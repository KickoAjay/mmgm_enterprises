import "server-only";
import { createClient } from "@/lib/db/server";
import { getAvailabilityMap } from "@/features/products/availability";
import { getPrimaryImageMap } from "@/features/products/images";
import type { ProductListItem } from "@/features/products/queries";

export type ProductImage = { id: string; url: string; altText: string | null };

export type ProductDetail = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  brand: string;
  originalPrice: number;
  sellingPrice: number;
  discountPercent: number;
  avgRating: number;
  reviewCount: number;
  isAvailable: boolean | null;
  returnEligible: boolean;
  returnPeriodDays: number;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  fabricName: string | null;
  materialName: string | null;
  primaryColorName: string | null;
  secondaryColorName: string | null;
  patternName: string | null;
  design: string | null;
  borderType: string | null;
  borderColor: string | null;
  palluType: string | null;
  workType: string | null;
  weaveType: string | null;
  washCare: string | null;
  countryOfOrigin: string;
  weightGrams: number | null;
  sareeLengthMeters: number | null;
  blousePieceIncluded: boolean;
  blouseLengthMeters: number | null;
  occasions: string[];
  images: ProductImage[];
};

export async function getProductDetail(
  slug: string,
): Promise<ProductDetail | null> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!product) return null;

  const lookupIds = {
    category: product.category_id,
    fabric: product.fabric_id,
    material: product.material_id,
    primaryColor: product.primary_color_id,
    secondaryColor: product.secondary_color_id,
    pattern: product.pattern_id,
  };

  const [category, fabric, material, primaryColor, secondaryColor, pattern] =
    await Promise.all([
      lookupIds.category
        ? supabase
            .from("categories")
            .select("name, slug")
            .eq("id", lookupIds.category)
            .maybeSingle()
        : null,
      lookupIds.fabric
        ? supabase
            .from("fabrics")
            .select("name")
            .eq("id", lookupIds.fabric)
            .maybeSingle()
        : null,
      lookupIds.material
        ? supabase
            .from("materials")
            .select("name")
            .eq("id", lookupIds.material)
            .maybeSingle()
        : null,
      lookupIds.primaryColor
        ? supabase
            .from("colors")
            .select("name")
            .eq("id", lookupIds.primaryColor)
            .maybeSingle()
        : null,
      lookupIds.secondaryColor
        ? supabase
            .from("colors")
            .select("name")
            .eq("id", lookupIds.secondaryColor)
            .maybeSingle()
        : null,
      lookupIds.pattern
        ? supabase
            .from("patterns")
            .select("name")
            .eq("id", lookupIds.pattern)
            .maybeSingle()
        : null,
    ]);

  const [{ data: occasionRows }, { data: imageRows }, availMap] =
    await Promise.all([
      supabase
        .from("product_occasions")
        .select("occasion_id")
        .eq("product_id", product.id),
      supabase
        .from("product_images")
        .select("id, url, alt_text")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
      getAvailabilityMap(supabase, [product.id]),
    ]);

  let occasionNames: string[] = [];
  const occasionIds = (occasionRows ?? []).map((r) => r.occasion_id);
  if (occasionIds.length > 0) {
    const { data: occasions } = await supabase
      .from("occasions")
      .select("name")
      .in("id", occasionIds);
    occasionNames = (occasions ?? []).map((o) => o.name);
  }

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.short_description,
    brand: product.brand,
    originalPrice: product.original_price,
    sellingPrice: product.selling_price,
    discountPercent: product.discount_percent,
    avgRating: product.avg_rating,
    reviewCount: product.review_count,
    isAvailable: availMap.get(product.id) ?? null,
    returnEligible: product.return_eligible,
    returnPeriodDays: product.return_period_days,
    categoryId: product.category_id,
    categoryName: category?.data?.name ?? null,
    categorySlug: category?.data?.slug ?? null,
    fabricName: fabric?.data?.name ?? null,
    materialName: material?.data?.name ?? null,
    primaryColorName: primaryColor?.data?.name ?? null,
    secondaryColorName: secondaryColor?.data?.name ?? null,
    patternName: pattern?.data?.name ?? null,
    design: product.design,
    borderType: product.border_type,
    borderColor: product.border_color,
    palluType: product.pallu_type,
    workType: product.work_type,
    weaveType: product.weave_type,
    washCare: product.wash_care,
    countryOfOrigin: product.country_of_origin,
    weightGrams: product.weight_grams,
    sareeLengthMeters: product.saree_length_meters,
    blousePieceIncluded: product.blouse_piece_included,
    blouseLengthMeters: product.blouse_length_meters,
    occasions: occasionNames,
    images: (imageRows ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.alt_text,
    })),
  };
}

export async function getSimilarProducts(
  product: ProductDetail,
  limit = 8,
): Promise<ProductListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "ACTIVE")
    .neq("id", product.id)
    .limit(limit);

  query = product.categoryId
    ? query.eq("category_id", product.categoryId)
    : query;

  const { data } = await query;
  let rows = data ?? [];

  // Fall back to same-fabric matches if the category had too few others.
  if (rows.length < limit && product.fabricName) {
    const { data: fabricRow } = await supabase
      .from("fabrics")
      .select("id")
      .eq("name", product.fabricName)
      .maybeSingle();
    if (fabricRow) {
      const excludeIds = [product.id, ...rows.map((r) => r.id)];
      const { data: more } = await supabase
        .from("products")
        .select("*")
        .eq("status", "ACTIVE")
        .eq("fabric_id", fabricRow.id)
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(limit - rows.length);
      rows = [...rows, ...(more ?? [])];
    }
  }

  const fabricIds = [
    ...new Set(rows.map((p) => p.fabric_id).filter((id): id is string => !!id)),
  ];
  const [fabricsResult, imageMap] = await Promise.all([
    fabricIds.length > 0
      ? supabase.from("fabrics").select("id, name").in("id", fabricIds)
      : Promise.resolve({ data: [] }),
    getPrimaryImageMap(
      supabase,
      rows.map((p) => p.id),
    ),
  ]);
  const fabricMap = new Map<string, string>();
  for (const f of fabricsResult.data ?? []) fabricMap.set(f.id, f.name);

  return rows.map((p) => ({
    ...p,
    fabricName: p.fabric_id ? (fabricMap.get(p.fabric_id) ?? null) : null,
    imageUrl: imageMap.get(p.id) ?? null,
  }));
}

export type ProductReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
};

// No reviewer name shown — RLS only lets a customer read their own
// `users` row, not other reviewers', and there's no public-safe display
// name to join against yet. Every review is a verified purchase by
// definition (spec §56.16), so a "Verified Buyer" badge is enough context.
export async function getProductReviews(
  productId: string,
): Promise<ProductReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, body, is_verified_purchase, created_at")
    .eq("product_id", productId)
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.is_verified_purchase,
    createdAt: r.created_at,
  }));
}
