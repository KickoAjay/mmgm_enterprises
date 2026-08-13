export type RefundStatus = "REQUESTED" | "APPROVED" | "INITIATED" | "PROCESSING" | "COMPLETED";

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  INITIATED: "Initiated",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};

const ORDERED_STATUSES: RefundStatus[] = [
  "REQUESTED",
  "APPROVED",
  "INITIATED",
  "PROCESSING",
  "COMPLETED",
];

// Lives here rather than admin-actions.ts — a "use server" file may only
// export async functions, and this needs to be called from a Client
// Component to render the "advance to next stage" button's label.
export function getNextRefundStatus(current: string): RefundStatus | null {
  const index = ORDERED_STATUSES.indexOf(current as RefundStatus);
  if (index === -1 || index === ORDERED_STATUSES.length - 1) return null;
  return ORDERED_STATUSES[index + 1];
}
