import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminCustomers } from "@/features/customers/queries";
import { formatOrderDate } from "@/features/orders/format";
import { Input } from "@/components/ui/input";
import { ToggleCustomerActiveButton } from "@/components/admin/toggle-customer-active-button";

export const metadata = {
  title: "Customers | MMGM Admin",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"]);
  const { q } = await searchParams;
  const customers = await getAdminCustomers(q);

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Customers</h1>

      <form className="mt-6" action="/admin/customers">
        <Input name="q" defaultValue={q} placeholder="Search by name or email" className="max-w-xs" />
      </form>

      <div className="mt-6 overflow-x-auto border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-meta text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  <Link href={`/admin/customers/${c.id}`} className="hover:underline">
                    {c.fullName ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatOrderDate(c.createdAt)}</td>
                <td className="px-4 py-3 text-foreground">{c.isActive ? "Active" : "Disabled"}</td>
                <td className="px-4 py-3">
                  <ToggleCustomerActiveButton userId={c.id} isActive={c.isActive} />
                </td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
