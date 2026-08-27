import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getAdminEnquiries } from "@/features/enquiries/admin-queries";
import { formatOrderDate } from "@/features/orders/format";

export const metadata = {
  title: "Enquiries",
};

export default async function AdminEnquiriesPage() {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"]);
  const enquiries = await getAdminEnquiries();
  const unreadCount = enquiries.filter((e) => !e.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">Enquiries</h1>
        {unreadCount > 0 ? (
          <span className="text-meta rounded-sm bg-primary px-2 py-1 font-semibold text-primary-foreground">
            {unreadCount} unread
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Messages submitted through the website&apos;s Contact page.
      </p>

      <div className="mt-6 overflow-x-auto border border-border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-meta text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">
                  <Link
                    href={`/admin/enquiries/${e.id}`}
                    className={e.isRead ? "hover:underline" : "font-semibold hover:underline"}
                  >
                    {e.fullName}
                  </Link>
                  <div className="text-meta text-muted-foreground">{e.email}</div>
                </td>
                <td className="max-w-md truncate px-4 py-3 text-muted-foreground">
                  {e.message}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatOrderDate(e.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {e.isRead ? "Read" : "Unread"}
                </td>
              </tr>
            ))}
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No enquiries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
