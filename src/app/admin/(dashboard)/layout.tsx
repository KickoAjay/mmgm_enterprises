import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Returns", href: "/admin/returns" },
  { label: "Refunds", href: "/admin/refunds" },
  { label: "Customers", href: "/admin/customers" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await requireAdmin();
  const canManageTeam = membership.roleName === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background px-4 py-6">
        <span className="text-meta px-2 font-semibold tracking-[0.15em] text-primary uppercase">
          MMGM Admin
        </span>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm px-2 py-2 text-sm text-foreground hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          {canManageTeam ? (
            <Link
              href="/admin/team"
              className="rounded-sm px-2 py-2 text-sm text-foreground hover:bg-secondary"
            >
              Team
            </Link>
          ) : null}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-meta px-2 text-muted-foreground">
            {membership.fullName}
            <br />
            {membership.roleName}
          </p>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full uppercase tracking-wide"
            >
              Log Out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
