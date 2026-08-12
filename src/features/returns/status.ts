export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "INFO_REQUESTED"
  | "PICKUP_SCHEDULED"
  | "RETURNED";

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  INFO_REQUESTED: "Information Requested",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  RETURNED: "Returned",
};

// Spec §36's fixed reason list.
export const RETURN_REASONS = [
  "Damaged Product",
  "Wrong Product",
  "Product Not as Described",
  "Quality Issue",
  "Other",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];
