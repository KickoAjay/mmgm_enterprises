import { COLORS, emailShell } from "@/lib/email/templates/shared";

export function buildTestEmail(): { subject: string; html: string; text: string } {
  const subject = "MMGM Enterprises - Resend Test Email";

  const body = `
      <h1 style="color:${COLORS.BRAND};font-size:20px;margin:0 0 12px;">MMGM Enterprises</h1>
      <p style="color:${COLORS.TEXT};font-size:14px;line-height:1.6;margin:0;">
        This is a professional test message confirming that the Resend integration
        for MMGM Enterprises is working successfully.
      </p>`;

  const text =
    "MMGM Enterprises\n\nThis is a professional test message confirming that the Resend integration for MMGM Enterprises is working successfully.";

  return { subject, html: emailShell(body), text };
}
