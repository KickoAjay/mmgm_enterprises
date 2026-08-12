import "server-only";
import { getCartContext } from "@/features/cart/cart-session";
import { getAvailabilityMap } from "@/features/products/availability";

export type CartLine = {
  cartItemId: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  fabricName: string | null;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  lineTotal: number;
  isAvailable: boolean | null;
};

export type CartSummary = {
  items: CartLine[];
  subtotal: number;
  itemCount: number;
};

const EMPTY_CART: CartSummary = { items: [], subtotal: 0, itemCount: 0 };

// Always prices from the live `products` row, never the
// `cart_items.unit_price_snapshot` — cart totals must be server-computed
// from current data (spec §56.3), the snapshot is written at insert time
// only as a reference for a future "price changed since you added this"
// notice, not implemented yet.
export async function getCartSummary(): Promise<CartSummary> {
  const { cartId, supabase } = await getCartContext();
  if (!cartId) return EMPTY_CART;

  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!cartItems || cartItems.length === 0) return EMPTY_CART;

  const productIds = cartItems.map((ci) => ci.product_id);
  const [{ data: products }, fabrics, availMap] = await Promise.all([
    supabase.from("products").select("*").in("id", productIds),
    supabase.from("fabrics").select("id, name"),
    getAvailabilityMap(supabase, productIds),
  ]);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const fabricNameMap = new Map(
    (fabrics.data ?? []).map((f) => [f.id, f.name]),
  );

  const items: CartLine[] = [];
  for (const ci of cartItems) {
    const product = productMap.get(ci.product_id);
    // Product was archived/deleted after being added — drop it from the
    // visible cart rather than showing a broken line item.
    if (!product) continue;

    items.push({
      cartItemId: ci.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      fabricName: product.fabric_id
        ? (fabricNameMap.get(product.fabric_id) ?? null)
        : null,
      unitPrice: product.selling_price,
      originalPrice: product.original_price,
      quantity: ci.quantity,
      lineTotal: product.selling_price * ci.quantity,
      isAvailable: availMap.get(product.id) ?? null,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, subtotal, itemCount };
}

export async function getCartItemCount(): Promise<number> {
  const { cartId, supabase } = await getCartContext();
  if (!cartId) return 0;

  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cartId);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}
