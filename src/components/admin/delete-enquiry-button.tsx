"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEnquiryAction } from "@/features/enquiries/admin-actions";

export function DeleteEnquiryButton({ enquiryId }: { enquiryId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this enquiry permanently?")) return;
    startTransition(async () => {
      await deleteEnquiryAction(enquiryId);
      router.push("/admin/enquiries");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-meta text-destructive hover:underline"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
