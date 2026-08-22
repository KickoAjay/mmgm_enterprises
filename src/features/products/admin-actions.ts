"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { requireRole } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/auth/audit";
import { productFormSchema } from "@/validations/admin-product";

export type ProductActionState = { error: string } | { success: true } | null;

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

function parseProductForm(formData: FormData) {
  // An unchecked checkbox submits nothing at all — formData.get() returns
  // null, not an empty string — for blousePieceIncluded/returnEligible.
  // The schema's `.optional()` only accepts undefined, so null fails
  // Zod's base type check with a generic, unhelpful message before any
  // custom one runs (found via the same bug in checkout's placeOrderAction).
  const field = (name: string) => formData.get(name) ?? undefined;
  return productFormSchema.safeParse({
    sku: field("sku"),
    name: field("name"),
    slug: field("slug"),
    categoryId: field("categoryId"),
    fabricId: field("fabricId"),
    materialId: field("materialId"),
    brand: formData.get("brand") || "MMGM Enterprises",
    description: field("description"),
    shortDescription: field("shortDescription"),
    originalPrice: field("originalPrice"),
    sellingPrice: field("sellingPrice"),
    sareeLengthMeters: field("sareeLengthMeters"),
    blousePieceIncluded: field("blousePieceIncluded"),
    blouseLengthMeters: field("blouseLengthMeters"),
    primaryColorId: field("primaryColorId"),
    secondaryColorId: field("secondaryColorId"),
    patternId: field("patternId"),
    design: field("design"),
    borderType: field("borderType"),
    borderColor: field("borderColor"),
    palluType: field("palluType"),
    workType: field("workType"),
    weaveType: field("weaveType"),
    washCare: field("washCare"),
    countryOfOrigin: formData.get("countryOfOrigin") || "India",
    weightGrams: field("weightGrams"),
    returnEligible: field("returnEligible"),
    returnPeriodDays: formData.get("returnPeriodDays") || "7",
    status: field("status"),
    stockQuantity: formData.get("stockQuantity") || "0",
    lowStockThreshold: formData.get("lowStockThreshold") || "5",
  });
}

async function syncOccasions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  occasionIds: string[],
) {
  await supabase.from("product_occasions").delete().eq("product_id", productId);
  if (occasionIds.length > 0) {
    await supabase
      .from("product_occasions")
      .insert(occasionIds.map((occasionId) => ({ product_id: productId, occasion_id: occasionId })));
  }
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const input = parsed.data;
  const occasionIds = formData.getAll("occasionIds").map(String);

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      sku: input.sku,
      name: input.name,
      slug: input.slug,
      category_id: input.categoryId,
      fabric_id: input.fabricId,
      material_id: input.materialId,
      brand: input.brand,
      description: input.description,
      short_description: input.shortDescription,
      original_price: input.originalPrice,
      selling_price: input.sellingPrice,
      discount_amount: Math.max(0, input.originalPrice - input.sellingPrice),
      saree_length_meters: input.sareeLengthMeters,
      blouse_piece_included: input.blousePieceIncluded === "on",
      blouse_length_meters: input.blouseLengthMeters,
      primary_color_id: input.primaryColorId,
      secondary_color_id: input.secondaryColorId,
      pattern_id: input.patternId,
      design: input.design,
      border_type: input.borderType,
      border_color: input.borderColor,
      pallu_type: input.palluType,
      work_type: input.workType,
      weave_type: input.weaveType,
      wash_care: input.washCare,
      country_of_origin: input.countryOfOrigin,
      weight_grams: input.weightGrams,
      return_eligible: input.returnEligible === "on",
      return_period_days: input.returnPeriodDays,
      status: input.status,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "That SKU or slug is already in use" };
    return { error: "Could not create the product. Please try again." };
  }

  await supabase.from("inventory").insert({
    product_id: product.id,
    quantity: input.stockQuantity,
    low_stock_threshold: input.lowStockThreshold,
  });
  await syncOccasions(supabase, product.id, occasionIds);

  await logAdminAction({
    adminUserId: membership.id,
    action: "PRODUCT_CREATED",
    entityType: "products",
    entityId: product.id,
    metadata: { sku: input.sku, name: input.name },
  });

  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { error: "Missing product" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const input = parsed.data;
  const occasionIds = formData.getAll("occasionIds").map(String);

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      sku: input.sku,
      name: input.name,
      slug: input.slug,
      category_id: input.categoryId,
      fabric_id: input.fabricId,
      material_id: input.materialId,
      brand: input.brand,
      description: input.description,
      short_description: input.shortDescription,
      original_price: input.originalPrice,
      selling_price: input.sellingPrice,
      discount_amount: Math.max(0, input.originalPrice - input.sellingPrice),
      saree_length_meters: input.sareeLengthMeters,
      blouse_piece_included: input.blousePieceIncluded === "on",
      blouse_length_meters: input.blouseLengthMeters,
      primary_color_id: input.primaryColorId,
      secondary_color_id: input.secondaryColorId,
      pattern_id: input.patternId,
      design: input.design,
      border_type: input.borderType,
      border_color: input.borderColor,
      pallu_type: input.palluType,
      work_type: input.workType,
      weave_type: input.weaveType,
      wash_care: input.washCare,
      country_of_origin: input.countryOfOrigin,
      weight_grams: input.weightGrams,
      return_eligible: input.returnEligible === "on",
      return_period_days: input.returnPeriodDays,
      status: input.status,
    })
    .eq("id", productId);
  if (error) {
    if (error.code === "23505") return { error: "That SKU or slug is already in use" };
    return { error: "Could not update the product. Please try again." };
  }

  await supabase
    .from("inventory")
    .update({
      quantity: input.stockQuantity,
      low_stock_threshold: input.lowStockThreshold,
    })
    .eq("product_id", productId);
  await syncOccasions(supabase, productId, occasionIds);

  await logAdminAction({
    adminUserId: membership.id,
    action: "PRODUCT_UPDATED",
    entityType: "products",
    entityId: productId,
  });

  return { success: true };
}

// Never a hard DELETE — order_items.product_id is ON DELETE RESTRICT by
// design (a sold product's history must survive), and archiving is the
// established pattern throughout this app for "removing" a product.
export async function archiveProductAction(productId: string): Promise<void> {
  const membership = await requireRole(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"]);
  const supabase = await createClient();
  await supabase.from("products").update({ status: "ARCHIVED" }).eq("id", productId);
  await logAdminAction({
    adminUserId: membership.id,
    action: "PRODUCT_ARCHIVED",
    entityType: "products",
    entityId: productId,
  });
}
