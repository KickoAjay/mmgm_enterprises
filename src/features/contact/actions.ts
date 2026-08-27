"use server";

import { contactSchema } from "@/validations/contact";
import { createServiceClient } from "@/lib/db/service";
import { sendEmail } from "@/lib/email/client";
import { logEmailDelivery } from "@/lib/email/log";
import { buildContactMessageEmail } from "@/lib/email/templates/contact-message";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { COMPANY_EMAIL } from "@/lib/constants";

export type ContactActionState = { error: string } | { success: true } | null;

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function sendContactMessageAction(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const ip = await getClientIp();
  const { allowed } = checkRateLimit(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) return { error: "Too many messages sent. Please try again in a while." };

  // Saved first, independent of the email below — the submitter is
  // anonymous (no auth.uid() for RLS to check), same as guest checkout
  // writing orders/addresses via the service role. This is what an
  // admin actually reads (see /admin/enquiries); the email is a
  // best-effort notification on top of it, not the record of truth.
  // Matters right now specifically because Resend's sandbox sender can't
  // yet deliver to COMPANY_EMAIL (unverified domain) — without this, a
  // submission made during that outage would simply vanish.
  const supabase = createServiceClient();
  const { error: insertError } = await supabase.from("enquiries").insert({
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    message: parsed.data.message,
  });
  if (insertError) {
    return { error: "Something went wrong sending your message. Please try again." };
  }

  const { subject, html, text } = buildContactMessageEmail(parsed.data);
  const result = await sendEmail({
    to: COMPANY_EMAIL,
    subject,
    html,
    text,
    replyTo: parsed.data.email,
  });

  await logEmailDelivery(
    subject,
    `Contact form message from ${parsed.data.fullName} <${parsed.data.email}>`,
    result.success ? "SENT" : "FAILED",
    result.success ? undefined : result.error,
  );

  // The enquiry is safely saved either way — an email delivery failure
  // (e.g. Resend's unverified-domain restriction) is a notification
  // problem, not a "your message didn't go through" problem, so it
  // doesn't block the customer's success response or invite a retry
  // that would just create a duplicate row.
  return { success: true };
}
