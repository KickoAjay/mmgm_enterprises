"use server";

import { contactSchema } from "@/validations/contact";
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

  if (!result.success) {
    return { error: "Something went wrong sending your message. Please try again." };
  }
  return { success: true };
}
