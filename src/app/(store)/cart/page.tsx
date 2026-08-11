import Link from "next/link";
import { getCartSummary } from "@/features/cart/queries";
import { CartLineItem } from "@/components/store/cart/cart-line-item";
import { formatINR } from "@/features/products/format";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Shopping Bag | MMGM Enterprises",
};

export default async function CartPage() {
  const { items, subtotal } = await getCartSummary();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-section text-foreground">
          Your shopping bag is empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover beautiful sarees for every occasion.
        </p>
        <Button asChild className="mt-6 tracking-wide uppercase">
          <Link href="/sarees">Shop Sarees</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Shopping Bag</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {items.map((item) => (
            <CartLineItem key={item.cartItemId} item={item} />
          ))}
        </div>

        <div className="h-fit border border-border p-6">
          <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Order Summary
          </h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">
              {formatINR(subtotal)}
            </span>
          </div>
          <p className="text-meta mt-2 text-muted-foreground">
            Shipping, taxes, and coupons calculated at checkout.
          </p>
          <Button asChild className="mt-6 w-full tracking-wide uppercase">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
