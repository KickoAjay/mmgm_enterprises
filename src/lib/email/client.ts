import "server-only";
import { Resend } from "resend";
import { z } from "zod";

const emailAddressSchema = z.email();

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    client = new Resend(apiKey);
  }
  return client;
}

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendEmailResult = { success: true } | { success: false; error: string };

// Never throws — a failed email should never break the caller's flow
// (payment confirmation must still succeed even if delivery fails). The
// caller decides how/whether to record the failure. `from` is never a
// parameter here — every send uses the fixed EMAIL_FROM, never a
// caller-supplied address (spec §42's "API authorization" / don't let
// callers pick an arbitrary sender).
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { success: false, error: "Email is not configured (no RESEND_API_KEY)" };
  }
  if (!emailAddressSchema.safeParse(params.to).success) {
    return { success: false, error: "Invalid recipient email address" };
  }
  if (params.replyTo && !emailAddressSchema.safeParse(params.replyTo).success) {
    return { success: false, error: "Invalid reply-to email address" };
  }

  const from = process.env.EMAIL_FROM ?? "MMGM Enterprises <onboarding@resend.dev>";
  try {
    const { error } = await getClient().emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
