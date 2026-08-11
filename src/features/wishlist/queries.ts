import "server-only";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAvailabilityMap } from "@/features/products/availability";

export type WishlistLine = {
  wishlistItemId: string;
  productId: string;
  slug: string;
  name: string;
  fabricName: string | null;
  sellingPrice: number;
  originalPrice: number;
  isAvailable: boolean | null;
};

// Wishlist requires an account (spec §24 lives under /account/wishlist) —
// returns empty for a signed-out visitor rather than erroring, so callers
// can render an empty state without special-casing auth.
export async function getWishlistItems(): Promise<WishlistLine[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!wishlist) return [];

  const { data: wishlistItems } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("wishlist_id", wishlist.id)
    .order("created_at", { ascending: false });
  if (!wishlistItems || wishlistItems.length === 0) return [];

  const productIds = wishlistItems.map((wi) => wi.product_id);
  const [{ data: products }, fabrics, availMap] = await Promise.all([
    supabase.from("products").select("*").in("id", productIds),
    supabase.from("fabrics").select("id, name"),
    getAvailabilityMap(supabase, productIds),
  ]);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const fabricNameMap = new Map(
    (fabrics.data ?? []).map((f) => [f.id, f.name]),
  );

  const items: WishlistLine[] = [];
  for (const wi of wishlistItems) {
    const product = productMap.get(wi.product_id);
    if (!product) continue;
    items.push({
      wishlistItemId: wi.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      fabricName: product.fabric_id
        ? (fabricNameMap.get(product.fabric_id) ?? null)
        : null,
      sellingPrice: product.selling_price,
      originalPrice: product.original_price,
      isAvailable: availMap.get(product.id) ?? null,
    });
  }
  return items;
}
