import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getAdminEnquiry } from "@/features/enquiries/admin-queries";
import { markEnquiryReadAction } from "@/features/enquiries/admin-actions";
import { formatOrderDate } from "@/features/orders/format";
import { ToggleEnquiryReadButton } from "@/components/admin/toggle-enquiry-read-button";
import { DeleteEnquiryButton } from "@/components/admin/delete-enquiry-button";

export const metadata = {
  title: "Enquiry",
};

export default async function AdminEnquiryDetailPage({
  params,
}: {
  params: Promise<{ enquiryId: string }>;
}) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"]);
  const { enquiryId } = await params;
  const enquiry = await getAdminEnquiry(enquiryId);
  if (!enquiry) notFound();

  // Opening the detail page is what "reading" it means here, same as
  // any inbox — only flips it server-side the first time, not on every
  // subsequent visit (so re-opening an already-unread-marked message
  // doesn't fight the admin's own "Mark Unread" click).
  if (!enquiry.isRead) {
    await markEnquiryReadAction(enquiryId, true);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-foreground">{enquiry.fullName}</h1>
        <div className="flex items-center gap-4">
          <ToggleEnquiryReadButton enquiryId={enquiry.id} isRead={true} />
          <DeleteEnquiryButton enquiryId={enquiry.id} />
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Received {formatOrderDate(enquiry.createdAt)}
      </p>

      <div className="mt-6 flex flex-col gap-2 border-b border-border pb-6">
        <a
          href={`mailto:${enquiry.email}`}
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
        >
          <Mail className="size-4" /> {enquiry.email}
        </a>
        {enquiry.phone ? (
          <a
            href={`tel:${enquiry.phone}`}
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
          >
            <Phone className="size-4" /> {enquiry.phone}
          </a>
        ) : null}
      </div>

      <p className="mt-6 whitespace-pre-wrap text-sm text-foreground">{enquiry.message}</p>
    </div>
  );
}
