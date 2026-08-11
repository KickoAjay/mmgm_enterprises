"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCartContext } from "@/features/cart/cart-session";
import { createServiceClient } from "@/lib/db/service";

export type CartActionResult = { success: true } | { error: string };

// Stock is always read via the service-role client regardless of cart
// type — `inventory` stays admin-only per Phase 2's RLS, and this is a
// server-side enforcement check, not a value returned to the browser
// verbatim (spec §56.2: customers can never buy more than available).
async function getAvailableStock(productId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("inventory")
    .select("quantity, is_available")
    .eq("product_id", productId)
    .maybeSingle();
  if (!data || !data.is_available) return 0;
  return data.quantity;
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<CartActionResult> {
  if (quantity < 1) return { error: "Invalid quantity" };

  const stock = await getAvailableStock(productId);
  if (stock <= 0) return { error: "This saree is currently out of stock" };

  const { cartId, supabase } = await getOrCreateCartContext();

  const [{ data: existing }, { data: product }] = await Promise.all([
    supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle(),
    supabase
      .from("products")
      .select("selling_price")
      .eq("id", productId)
      .maybeSingle(),
  ]);
  if (!product) return { error: "Product not found" };

  const desiredQuantity = (existing?.quantity ?? 0) + quantity;
  const clampedQuantity = Math.min(desiredQuantity, stock);

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: clampedQuantity })
      .eq("id", existing.id);
    if (error) return { error: "Unable to update cart" };
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      quantity: clampedQuantity,
      unit_price_snapshot: product.selling_price,
    });
    if (error) return { error: "Unable to add to cart" };
  }

  revalidatePath("/", "layout");

  if (clampedQuantity < desiredQuantity) {
    return { error: `Only ${stock} left in stock — added what's available` };
  }
  return { success: true };
}

export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number,
): Promise<CartActionResult> {
  const { cartId, supabase } = await getOrCreateCartContext();

  const { data: item } = await supabase
    .from("cart_items")
    .select("cart_id, product_id")
    .eq("id", cartItemId)
    .maybeSingle();
  // Ownership check matters most for guest carts: those go through the
  // service-role client (bypasses RLS), so this is the only thing
  // stopping one guest session from mutating another's cart item by ID.
  // Logged-in carts are already scoped by RLS; this is a harmless
  // defense-in-depth duplicate there.
  if (!item || item.cart_id !== cartId) return { error: "Item not found" };

  if (quantity < 1) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);
    if (error) return { error: "Unable to remove item" };
    revalidatePath("/", "layout");
    return { success: true };
  }

  const stock = await getAvailableStock(item.product_id);
  const clampedQuantity = Math.min(quantity, stock);

  if (clampedQuantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", cartItemId);
    revalidatePath("/", "layout");
    return {
      error: "This saree just went out of stock and was removed from your cart",
    };
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: clampedQuantity })
    .eq("id", cartItemId);
  if (error) return { error: "Unable to update cart" };

  revalidatePath("/", "layout");
  if (clampedQuantity < quantity)
    return { error: `Only ${stock} left in stock` };
  return { success: true };
}

export async function removeCartItemAction(
  cartItemId: string,
): Promise<CartActionResult> {
  const { cartId, supabase } = await getOrCreateCartContext();

  const { data: item } = await supabase
    .from("cart_items")
    .select("cart_id")
    .eq("id", cartItemId)
    .maybeSingle();
  if (!item || item.cart_id !== cartId) return { error: "Item not found" };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);
  if (error) return { error: "Unable to remove item" };

  revalidatePath("/", "layout");
  return { success: true };
}
