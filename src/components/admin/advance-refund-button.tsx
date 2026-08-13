"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceRefundStatusAction } from "@/features/refunds/admin-actions";
import {
  REFUND_STATUS_LABELS,
  getNextRefundStatus,
  type RefundStatus,
} from "@/features/refunds/status";

export function AdvanceRefundButton({ refundId, status }: { refundId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = getNextRefundStatus(status);

  if (!next) return <span className="text-meta text-muted-foreground">—</span>;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await advanceRefundStatusAction(refundId);
          router.refresh();
        })
      }
      className="text-meta text-primary hover:underline"
    >
      {isPending ? "Updating…" : `Mark ${REFUND_STATUS_LABELS[next as RefundStatus]}`}
    </button>
  );
}
