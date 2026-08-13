import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminReturns } from "@/features/returns/admin-queries";
import { RETURN_STATUS_LABELS, type ReturnStatus } from "@/features/returns/status";
import { formatOrderDate } from "@/features/orders/format";

export const metadata = {
  title: "Returns | MMGM Admin",
};

export default async function AdminReturnsPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "CUSTOMER_SUPPORT"]);
  const returns = await getAdminReturns();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Returns</h1>

      <div className="mt-6 overflow-x-auto border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-meta text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  <Link href={`/admin/returns/${r.id}`} className="hover:underline">
                    {r.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.customerEmail}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatOrderDate(r.requestedAt)}</td>
                <td className="px-4 py-3 text-foreground">
                  {RETURN_STATUS_LABELS[r.status as ReturnStatus] ?? r.status}
                </td>
              </tr>
            ))}
            {returns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No return requests.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
