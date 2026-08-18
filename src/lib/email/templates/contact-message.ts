import { COLORS, emailShell, escapeHtml, summaryRow } from "@/lib/email/templates/shared";
import type { ContactFields } from "@/validations/contact";

// Sent to the company's own inbox (COMPANY_EMAIL), not the customer —
// this is the "someone submitted the contact form" notification, not a
// receipt. replyTo is set to the customer's own address by the caller so
// a reply from Gmail goes straight back to them.
export function buildContactMessageEmail(data: ContactFields): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New contact form message from ${data.fullName}`;

  const body = `
      <h1 style="color:${COLORS.BRAND};font-size:20px;margin:0 0 12px;">New Contact Message</h1>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        ${summaryRow("Name", escapeHtml(data.fullName))}
        ${summaryRow("Email", escapeHtml(data.email))}
        ${data.phone ? summaryRow("Phone", escapeHtml(data.phone)) : ""}
      </table>
      <p style="color:${COLORS.TEXT};font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0;">${escapeHtml(data.message)}</p>`;

  const text = `New contact form message\n\nName: ${data.fullName}\nEmail: ${data.email}${data.phone ? `\nPhone: ${data.phone}` : ""}\n\n${data.message}`;

  return { subject, html: emailShell(body), text };
}
