"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markEnquiryReadAction } from "@/features/enquiries/admin-actions";

export function ToggleEnquiryReadButton({
  enquiryId,
  isRead,
}: {
  enquiryId: string;
  isRead: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await markEnquiryReadAction(enquiryId, !isRead);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-meta text-primary hover:underline"
    >
      {isPending ? "Saving…" : isRead ? "Mark Unread" : "Mark Read"}
    </button>
  );
}
