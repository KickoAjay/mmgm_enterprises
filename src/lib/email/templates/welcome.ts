import { COLORS, emailShell, escapeHtml, ctaButton } from "@/lib/email/templates/shared";

export function buildWelcomeEmail(data: { fullName: string; siteUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Welcome to MMGM Enterprises";

  const body = `
      <h1 style="color:${COLORS.BRAND};font-size:20px;margin:0 0 12px;">MMGM Enterprises</h1>
      <p style="color:${COLORS.TEXT};font-size:16px;margin:0 0 4px;">Welcome, ${escapeHtml(data.fullName)}</p>
      <p style="color:${COLORS.MUTED};font-size:13px;line-height:1.6;margin:0;">
        Your account has been created. Explore our collection of premium handcrafted sarees.
      </p>
      ${ctaButton("Shop Sarees", `${data.siteUrl}/sarees`)}`;

  const text = `Welcome to MMGM Enterprises, ${data.fullName}\n\nYour account has been created. Explore our collection of premium handcrafted sarees:\n${data.siteUrl}/sarees`;

  return { subject, html: emailShell(body), text };
}
