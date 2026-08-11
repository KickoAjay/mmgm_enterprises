"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/db/server";
import { getCurrentUser } from "@/lib/auth/session";
import { addToCartAction } from "@/features/cart/actions";

export type WishlistActionResult =
  | { success: true; inWishlist: boolean }
  | { error: string }
  | { requiresLogin: true };

async function getOrCreateWishlistId(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("wishlists")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// Not logged in? Not add-or-remove — just tell the caller to send the user
// to /login, matching how the header's wishlist icon already behaves for
// signed-out visitors.
export async function toggleWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  const user = await getCurrentUser();
  if (!user) return { requiresLogin: true };

  const supabase = await createClient();
  const wishlistId = await getOrCreateWishlistId(user.id);

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("wishlist_id", wishlistId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: "Unable to update wishlist" };
    revalidatePath("/", "layout");
    return { success: true, inWishlist: false };
  }

  const { error } = await supabase
    .from("wishlist_items")
    .insert({ wishlist_id: wishlistId, product_id: productId });
  // Unique (wishlist_id, product_id) — a race with another tab landing
  // here first is a harmless no-op, not a real error.
  if (error && error.code !== "23505") {
    return { error: "Unable to update wishlist" };
  }
  revalidatePath("/", "layout");
  return { success: true, inWishlist: true };
}

export async function removeFromWishlistAction(
  wishlistItemId: string,
): Promise<WishlistActionResult> {
  const user = await getCurrentUser();
  if (!user) return { requiresLogin: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", wishlistItemId);
  if (error) return { error: "Unable to remove item" };
  revalidatePath("/", "layout");
  return { success: true, inWishlist: false };
}

export async function moveToCartAction(
  wishlistItemId: string,
  productId: string,
): Promise<{ success: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in" };

  const cartResult = await addToCartAction(productId, 1);
  if ("error" in cartResult) return cartResult;

  const supabase = await createClient();
  await supabase.from("wishlist_items").delete().eq("id", wishlistItemId);
  revalidatePath("/", "layout");
  return { success: true };
}
