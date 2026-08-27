import "server-only";
import { createClient } from "@/lib/db/server";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
};

// Unlike the storefront's getShopByCategoryTiles (active-only, limited),
// this is the full admin view — every category regardless of is_active,
// ordered for editing rather than display.
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  if (!categories || categories.length === 0) return [];

  const { data: products } = await supabase.from("products").select("category_id");
  const countByCategory = new Map<string, number>();
  for (const p of products ?? []) {
    if (!p.category_id) continue;
    countByCategory.set(p.category_id, (countByCategory.get(p.category_id) ?? 0) + 1);
  }

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.image_url,
    isActive: c.is_active,
    sortOrder: c.sort_order,
    productCount: countByCategory.get(c.id) ?? 0,
  }));
}

export async function getAdminCategory(categoryId: string): Promise<AdminCategory | null> {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return null;

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    imageUrl: category.image_url,
    isActive: category.is_active,
    sortOrder: category.sort_order,
    productCount: count ?? 0,
  };
}
