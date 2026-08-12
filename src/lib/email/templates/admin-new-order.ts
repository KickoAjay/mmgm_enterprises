import { formatINR } from "@/features/products/format";
import { COLORS, emailShell, escapeHtml, summaryRow } from "@/lib/email/templates/shared";

export type AdminNewOrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { name: string; sku: string; quantity: number; lineTotal: number }[];
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
  placedAt: string;
};

export function buildAdminNewOrderEmail(data: AdminNewOrderEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New Paid Order — ${data.orderNumber}`;
  const address = data.shippingAddress;

  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;color:${COLORS.TEXT};font-size:13px;">${escapeHtml(item.name)} (${escapeHtml(item.sku)}) × ${item.quantity}</td>
          <td style="padding:6px 0;color:${COLORS.TEXT};font-size:13px;text-align:right;">${formatINR(item.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const body = `
      <h1 style="color:${COLORS.BRAND};font-size:20px;margin:0 0 12px;">New Paid Order</h1>
      <table style="width:100%;border-collapse:collapse;padding-top:8px;">
        ${summaryRow("Order ID", escapeHtml(data.orderNumber))}
        ${summaryRow("Placed", escapeHtml(data.placedAt))}
        ${summaryRow("Customer", escapeHtml(data.customerName))}
        ${summaryRow("Email", escapeHtml(data.customerEmail))}
        ${summaryRow("Phone", escapeHtml(data.customerPhone))}
      </table>

      <p style="color:${COLORS.MUTED};font-size:12px;letter-spacing:0.05em;text-transform:uppercase;margin:20px 0 8px;">Items</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${COLORS.BORDER};padding-top:4px;">
        ${rows}
      </table>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${COLORS.BORDER};margin-top:8px;padding-top:8px;">
        <tr>
          <td style="padding:6px 0;color:${COLORS.TEXT};font-size:14px;font-weight:bold;">Grand Total</td>
          <td style="padding:6px 0;color:${COLORS.TEXT};font-size:14px;font-weight:bold;text-align:right;">${formatINR(data.grandTotal)}</td>
        </tr>
      </table>

      ${
        address
          ? `
      <div style="margin-top:20px;">
        <p style="color:${COLORS.MUTED};font-size:12px;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 8px;">Ship To</p>
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
    `New Paid Order — ${data.orderNumber}`,
    "",
    `Placed: ${data.placedAt}`,
    `Customer: ${data.customerName}`,
    `Email: ${data.customerEmail}`,
    `Phone: ${data.customerPhone}`,
    "",
    "Items:",
    ...data.items.map((item) => `${item.name} (${item.sku}) x${item.quantity} — ${formatINR(item.lineTotal)}`),
    "",
    `Grand Total: ${formatINR(data.grandTotal)}`,
    "",
    ...(address
      ? [
          "Ship To:",
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
