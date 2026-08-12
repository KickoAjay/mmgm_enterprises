import { formatINR } from "@/features/products/format";
import { COLORS, emailShell, escapeHtml, summaryRow } from "@/lib/email/templates/shared";

export type OrderConfirmationEmailData = {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  orderStatus: string;
  items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  } | null;
};

export function buildOrderConfirmationEmail(data: OrderConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Order Confirmed — ${data.orderNumber}`;

  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:${COLORS.TEXT};font-size:14px;">${escapeHtml(item.name)}<br /><span style="color:${COLORS.MUTED};font-size:12px;">Qty ${item.quantity} × ${formatINR(item.unitPrice)}</span></td>
          <td style="padding:8px 0;color:${COLORS.TEXT};font-size:14px;text-align:right;vertical-align:top;">${formatINR(item.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const address = data.shippingAddress;

  const body = `
      <h1 style="color:${COLORS.BRAND};font-size:20px;margin:0 0 8px;">MMGM Enterprises</h1>
      <p style="color:${COLORS.TEXT};font-size:16px;margin:0 0 4px;">Hi ${escapeHtml(data.customerName)}, thank you for your order</p>
      <p style="color:${COLORS.MUTED};font-size:13px;margin:0 0 24px;">
        Order <strong style="color:${COLORS.TEXT};">${escapeHtml(data.orderNumber)}</strong> —
        placed ${escapeHtml(data.orderDate)} — status: ${escapeHtml(data.orderStatus)}
      </p>

      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${COLORS.BORDER};padding-top:8px;">
        ${rows}
      </table>

      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${COLORS.BORDER};margin-top:12px;padding-top:8px;">
        ${summaryRow("Subtotal", formatINR(data.subtotal))}
        ${data.productDiscount > 0 ? summaryRow("Product Discount", `−${formatINR(data.productDiscount)}`) : ""}
        ${data.couponDiscount > 0 ? summaryRow("Coupon Discount", `−${formatINR(data.couponDiscount)}`) : ""}
        ${summaryRow("Shipping", data.shippingFee === 0 ? "Free" : formatINR(data.shippingFee))}
        ${summaryRow("GST", formatINR(data.taxAmount))}
      </table>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${COLORS.BORDER};margin-top:8px;padding-top:8px;">
        <tr>
          <td style="padding:8px 0;color:${COLORS.TEXT};font-size:15px;font-weight:bold;">Grand Total</td>
          <td style="padding:8px 0;color:${COLORS.TEXT};font-size:15px;font-weight:bold;text-align:right;">${formatINR(data.grandTotal)}</td>
        </tr>
      </table>

      ${
        address
          ? `
      <div style="margin-top:24px;">
        <p style="color:${COLORS.MUTED};font-size:12px;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 8px;">Shipping To</p>
        <p style="color:${COLORS.TEXT};font-size:13px;margin:0;line-height:1.5;">
          ${escapeHtml(address.fullName)}<br />
          ${escapeHtml(address.line1)}${address.line2 ? `<br />${escapeHtml(address.line2)}` : ""}<br />
          ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.pincode)}<br />
          ${escapeHtml(address.phone)}
        </p>
      </div>`
          : ""
      }`;

  const textLines = [
    `Order Confirmed — ${data.orderNumber}`,
    "",
    `Hi ${data.customerName}, thank you for your order.`,
    `Placed ${data.orderDate} — status: ${data.orderStatus}`,
    "",
    ...data.items.map(
      (item) => `${item.name} x${item.quantity} (${formatINR(item.unitPrice)} each) — ${formatINR(item.lineTotal)}`,
    ),
    "",
    `Subtotal: ${formatINR(data.subtotal)}`,
    ...(data.productDiscount > 0 ? [`Product Discount: -${formatINR(data.productDiscount)}`] : []),
    ...(data.couponDiscount > 0 ? [`Coupon Discount: -${formatINR(data.couponDiscount)}`] : []),
    `Shipping: ${data.shippingFee === 0 ? "Free" : formatINR(data.shippingFee)}`,
    `GST: ${formatINR(data.taxAmount)}`,
    `Grand Total: ${formatINR(data.grandTotal)}`,
    "",
    ...(address
      ? [
          "Shipping To:",
          address.fullName,
          address.line1,
          ...(address.line2 ? [address.line2] : []),
          `${address.city}, ${address.state} ${address.pincode}`,
          address.phone,
        ]
      : []),
  ];

  return { subject, html: emailShell(body), text: textLines.join("\n") };
}
