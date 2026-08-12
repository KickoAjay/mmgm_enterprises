import { formatINR } from "@/features/products/format";

export type OrderConfirmationEmailData = {
  orderNumber: string;
  items: { name: string; quantity: number; lineTotal: number }[];
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

const BRAND = "#7A1830";
const TEXT = "#171717";
const MUTED = "#666666";
const BORDER = "#EAEAEA";
const SOFT_BG = "#F7F7F5";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
          <td style="padding:8px 0;color:${TEXT};font-size:14px;">${escapeHtml(item.name)} × ${item.quantity}</td>
          <td style="padding:8px 0;color:${TEXT};font-size:14px;text-align:right;">${formatINR(item.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const summaryRow = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 0;color:${MUTED};font-size:13px;">${label}</td>
      <td style="padding:4px 0;color:${TEXT};font-size:13px;text-align:right;">${value}</td>
    </tr>`;

  const address = data.shippingAddress;

  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;background:${SOFT_BG};padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid ${BORDER};padding:32px;">
      <h1 style="color:${BRAND};font-size:20px;margin:0 0 8px;">MMGM Enterprises</h1>
      <p style="color:${TEXT};font-size:16px;margin:0 0 4px;">Thank you for your order</p>
      <p style="color:${MUTED};font-size:13px;margin:0 0 24px;">
        Order <strong style="color:${TEXT};">${escapeHtml(data.orderNumber)}</strong> is confirmed.
      </p>

      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${BORDER};padding-top:8px;">
        ${rows}
      </table>

      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${BORDER};margin-top:12px;padding-top:8px;">
        ${summaryRow("Subtotal", formatINR(data.subtotal))}
        ${data.productDiscount > 0 ? summaryRow("Product Discount", `−${formatINR(data.productDiscount)}`) : ""}
        ${data.couponDiscount > 0 ? summaryRow("Coupon Discount", `−${formatINR(data.couponDiscount)}`) : ""}
        ${summaryRow("Shipping", data.shippingFee === 0 ? "Free" : formatINR(data.shippingFee))}
        ${summaryRow("GST", formatINR(data.taxAmount))}
      </table>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${BORDER};margin-top:8px;padding-top:8px;">
        <tr>
          <td style="padding:8px 0;color:${TEXT};font-size:15px;font-weight:bold;">Grand Total</td>
          <td style="padding:8px 0;color:${TEXT};font-size:15px;font-weight:bold;text-align:right;">${formatINR(data.grandTotal)}</td>
        </tr>
      </table>

      ${
        address
          ? `
      <div style="margin-top:24px;">
        <p style="color:${MUTED};font-size:12px;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 8px;">Shipping To</p>
        <p style="color:${TEXT};font-size:13px;margin:0;line-height:1.5;">
          ${escapeHtml(address.fullName)}<br />
          ${escapeHtml(address.line1)}${address.line2 ? `<br />${escapeHtml(address.line2)}` : ""}<br />
          ${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.pincode)}<br />
          ${escapeHtml(address.phone)}
        </p>
      </div>`
          : ""
      }

      <p style="color:${MUTED};font-size:12px;margin-top:32px;">MMGM Enterprises</p>
    </div>
  </div>`;

  const textLines = [
    `Order Confirmed — ${data.orderNumber}`,
    "",
    "Thank you for your order.",
    "",
    ...data.items.map((item) => `${item.name} x${item.quantity} — ${formatINR(item.lineTotal)}`),
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

  return { subject, html, text: textLines.join("\n") };
}
