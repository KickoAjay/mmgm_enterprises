import "server-only";
import { sendEmail } from "@/lib/email/client";
import { logEmailDelivery } from "@/lib/email/log";
import { buildWelcomeEmail } from "@/lib/email/templates/welcome";

// Sent immediately at signUpAction, not gated on email verification —
// Supabase Auth sends its own separate confirmation-link email, this is
// just the brand welcome. Never throws: registration must succeed
// regardless of email delivery.
export async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { subject, html, text } = buildWelcomeEmail({ fullName, siteUrl });
    const result = await sendEmail({ to: email, subject, html, text });
    await logEmailDelivery(
      subject,
      `Welcome email for ${email}`,
      result.success ? "SENT" : "FAILED",
      result.success ? undefined : result.error,
    );
  } catch {
    // Best-effort.
  }
}
