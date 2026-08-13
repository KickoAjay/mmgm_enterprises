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

// Lives here rather than admin-actions.ts — a "use server" file may only
// export async functions, and this needs to be called from a Client
// Component to render the action dropdown's options.
const ALLOWED_TRANSITIONS: Partial<Record<ReturnStatus, ReturnStatus[]>> = {
  REQUESTED: ["APPROVED", "REJECTED", "INFO_REQUESTED"],
  INFO_REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKUP_SCHEDULED", "REJECTED"],
  PICKUP_SCHEDULED: ["RETURNED"],
};

export function getAllowedReturnTransitions(current: string): ReturnStatus[] {
  return ALLOWED_TRANSITIONS[current as ReturnStatus] ?? [];
}
