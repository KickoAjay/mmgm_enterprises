export type RefundStatus = "REQUESTED" | "APPROVED" | "INITIATED" | "PROCESSING" | "COMPLETED";

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  INITIATED: "Initiated",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};
