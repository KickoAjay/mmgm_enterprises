// Shared between the desktop nav (header.tsx) and the mobile drawer
// (mobile-nav.tsx). Targets routes owned by later phases (Phase 4's /shop
// and /sarees, etc.) — those 404 until built, which is expected during
// phased development.
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Sarees", href: "/sarees" },
  { label: "Categories", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?sort=best-selling" },
  { label: "Collections", href: "/collections" },
  { label: "Offers", href: "/offers" },
];
