export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "ORDER_CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "RETURN_PICKUP"
  | "RETURNED"
  | "REFUND_INITIATED"
  | "REFUND_COMPLETED"
  | "EXCHANGE_REQUESTED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Payment Pending",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  ORDER_CONFIRMED: "Order Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURN_APPROVED: "Return Approved",
  RETURN_PICKUP: "Return Pickup Scheduled",
  RETURNED: "Returned",
  REFUND_INITIATED: "Refund Initiated",
  REFUND_COMPLETED: "Refund Completed",
  EXCHANGE_REQUESTED: "Exchange Requested",
};

// The linear happy-path timeline (spec §30). CANCELLED and the
// RETURN_*/REFUND_*/EXCHANGE_REQUESTED statuses are deliberately not on
// this path — they're shown as a distinct banner instead of forced onto a
// straight line (return/refund handling itself is Phase 10).
export const TIMELINE_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "ORDER_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const TIMELINE_STEP_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  ORDER_CONFIRMED: "Order Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export function isOffTimelineStatus(status: string): boolean {
  return !TIMELINE_STATUSES.includes(status as OrderStatus);
}

// The "happy path" an admin can move an order through by hand.
// PENDING_PAYMENT → ORDER_CONFIRMED is the payment flow's job (Phase 8's
// confirm_order_payment), not this — admin only takes over from
// ORDER_CONFIRMED onward, plus CANCELLED as an escape hatch. RETURN_*/
// REFUND_*/EXCHANGE_REQUESTED are deliberately not reachable from here:
// those are driven by the separate returns/refunds workflow (Phase 10),
// not by hand-picking an order_status value.
//
// Lives here rather than admin-actions.ts — a "use server" file may only
// export async functions, and this needs to be called from a Client
// Component to render the status dropdown's options.
const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_CONFIRMED: ["ORDER_CONFIRMED", "CANCELLED"],
  ORDER_CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

export function getAllowedNextStatuses(current: string): OrderStatus[] {
  return ALLOWED_TRANSITIONS[current as OrderStatus] ?? [];
}
