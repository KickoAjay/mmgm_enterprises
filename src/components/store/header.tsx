import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/features/cart/queries";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { MobileNav } from "@/components/store/mobile-nav";
import { NAV_LINKS } from "@/components/store/nav-links";

export async function Header() {
  const [user, cartItemCount] = await Promise.all([
    getCurrentUser(),
    getCartItemCount(),
  ]);
  const isLoggedIn = Boolean(user);

  return (
    <header>
      <AnnouncementBar />
      <div className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <MobileNav isLoggedIn={isLoggedIn} />
            <Link
              href="/"
              className="font-serif text-lg tracking-wide text-foreground"
            >
              MMGM ENTERPRISES
            </Link>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Search box lives on /sarees itself (Phase 4); autocomplete/
                recent/trending suggestions are explicitly deferred. */}
            <Link
              href="/sarees"
              aria-label="Search"
              className="text-foreground transition-colors hover:text-primary"
            >
              <Search className="size-5" />
            </Link>
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              className="hidden text-foreground transition-colors hover:text-primary sm:block"
            >
              <Heart className="size-5" />
            </Link>
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              aria-label="Account"
              className="text-foreground transition-colors hover:text-primary"
            >
              <User className="size-5" />
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-foreground transition-colors hover:text-primary"
            >
              <ShoppingBag className="size-5" />
              {cartItemCount > 0 ? (
                <span className="text-meta absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
