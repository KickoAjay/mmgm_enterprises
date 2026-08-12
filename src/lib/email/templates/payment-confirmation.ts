import { formatINR } from "@/features/products/format";
import { COLORS, emailShell, escapeHtml, summaryRow } from "@/lib/email/templates/shared";

// Only ever amount/status/ids — never card numbers, CVV, or other raw
// payment instrument data (spec §42 "never expose... API secrets", and
// general PCI hygiene: this app never touches card data at all, Cashfree's
// hosted checkout does).
export type PaymentConfirmationEmailData = {
  orderNumber: string;
  cashfreePaymentId: string | null;
  amount: number;
  paymentStatus: string;
  transactionDate: string;
};

export function buildPaymentConfirmationEmail(data: PaymentConfirmationEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Payment Received — ${data.orderNumber}`;

  const body = `
      <h1 style="color:${COLORS.BRAND};font-size:20px;margin:0 0 12px;">MMGM Enterprises</h1>
      <p style="color:${COLORS.TEXT};font-size:16px;margin:0 0 4px;">Payment confirmed</p>
      <p style="color:${COLORS.MUTED};font-size:13px;margin:0 0 20px;">
        We've received payment for order <strong style="color:${COLORS.TEXT};">${escapeHtml(data.orderNumber)}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${COLORS.BORDER};padding-top:8px;">
        ${summaryRow("Order ID", escapeHtml(data.orderNumber))}
        ${data.cashfreePaymentId ? summaryRow("Payment ID", escapeHtml(data.cashfreePaymentId)) : ""}
        ${summaryRow("Amount", formatINR(data.amount))}
        ${summaryRow("Status", escapeHtml(data.paymentStatus))}
        ${summaryRow("Date", escapeHtml(data.transactionDate))}
      </table>`;

  const textLines = [
    `Payment Received — ${data.orderNumber}`,
    "",
    "We've received payment for your order.",
    "",
    `Order ID: ${data.orderNumber}`,
    ...(data.cashfreePaymentId ? [`Payment ID: ${data.cashfreePaymentId}`] : []),
    `Amount: ${formatINR(data.amount)}`,
    `Status: ${data.paymentStatus}`,
    `Date: ${data.transactionDate}`,
  ];

  return { subject, html: emailShell(body), text: textLines.join("\n") };
}
