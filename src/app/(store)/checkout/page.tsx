import { redirect } from "next/navigation";
import { getCartSummary } from "@/features/cart/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { CheckoutForm } from "@/components/store/checkout/checkout-form";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const [{ items, subtotal }, user] = await Promise.all([
    getCartSummary(),
    getCurrentUser(),
  ]);

  if (items.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Checkout</h1>
      <div className="mt-8">
        <CheckoutForm items={items} subtotal={subtotal} userEmail={user?.email ?? null} />
      </div>
    </main>
  );
}
