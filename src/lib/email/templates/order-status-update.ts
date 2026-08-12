import { COLORS, emailShell, escapeHtml, summaryRow } from "@/lib/email/templates/shared";

export type OrderStatusUpdateEmailData = {
  orderNumber: string;
  status: "SHIPPED" | "DELIVERED" | "CANCELLED";
  trackingNumber?: string | null;
  courierName?: string | null;
  cancellationReason?: string | null;
};

const STATUS_COPY: Record<OrderStatusUpdateEmailData["status"], { subject: string; heading: string }> = {
  SHIPPED: { subject: "Your Order Has Shipped", heading: "Your order is on its way" },
  DELIVERED: { subject: "Your Order Has Been Delivered", heading: "Your order was delivered" },
  CANCELLED: { subject: "Your Order Has Been Cancelled", heading: "Your order was cancelled" },
};

export function buildOrderStatusUpdateEmail(data: OrderStatusUpdateEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const copy = STATUS_COPY[data.status];
  const subject = `${copy.subject} — ${data.orderNumber}`;

  const details: string[] = [];
  if (data.status === "SHIPPED") {
    if (data.courierName) details.push(summaryRow("Courier", escapeHtml(data.courierName)));
    if (data.trackingNumber) details.push(summaryRow("Tracking Number", escapeHtml(data.trackingNumber)));
  }
  if (data.status === "CANCELLED" && data.cancellationReason) {
    details.push(summaryRow("Reason", escapeHtml(data.cancellationReason)));
  }

  const body = `
      <h1 style="color:${COLORS.BRAND};font-size:20px;margin:0 0 12px;">MMGM Enterprises</h1>
      <p style="color:${COLORS.TEXT};font-size:16px;margin:0 0 4px;">${copy.heading}</p>
      <p style="color:${COLORS.MUTED};font-size:13px;margin:0 0 20px;">
        Order <strong style="color:${COLORS.TEXT};">${escapeHtml(data.orderNumber)}</strong>
      </p>
      ${details.length > 0 ? `<table style="width:100%;border-collapse:collapse;border-top:1px solid ${COLORS.BORDER};padding-top:8px;">${details.join("")}</table>` : ""}`;

  const textLines = [
    `${copy.subject} — ${data.orderNumber}`,
    "",
    copy.heading,
    ...(data.status === "SHIPPED" && data.courierName ? [`Courier: ${data.courierName}`] : []),
    ...(data.status === "SHIPPED" && data.trackingNumber ? [`Tracking Number: ${data.trackingNumber}`] : []),
    ...(data.status === "CANCELLED" && data.cancellationReason ? [`Reason: ${data.cancellationReason}`] : []),
  ];

  return { subject, html: emailShell(body), text: textLines.join("\n") };
}
