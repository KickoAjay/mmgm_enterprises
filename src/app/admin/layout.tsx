import type { Metadata } from "next";

// Deliberately no header/footer import from the storefront — spec §31
// wants "a completely separate premium admin dashboard". Auth gating
// lives in (dashboard)/layout.tsx, not here, since /admin/login and
// /admin/setup must stay reachable without already being an admin.
export const metadata: Metadata = {
  title: "MMGM Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-secondary">{children}</div>;
}
