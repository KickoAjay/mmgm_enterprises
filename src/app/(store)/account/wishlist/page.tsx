import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getWishlistItems } from "@/features/wishlist/queries";
import { WishlistLineItem } from "@/components/store/wishlist/wishlist-line-item";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Wishlist",
};

export default async function WishlistPage() {
  await requireUser();
  const items = await getWishlistItems();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-section text-foreground">
          Your wishlist is empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save your favourite sarees here.
        </p>
        <Button asChild className="mt-6 tracking-wide uppercase">
          <Link href="/sarees">Shop Sarees</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Wishlist</h1>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <WishlistLineItem key={item.wishlistItemId} item={item} />
        ))}
      </div>
    </main>
  );
}
