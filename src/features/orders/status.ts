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
