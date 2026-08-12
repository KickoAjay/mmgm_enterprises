import "server-only";
import { Resend } from "resend";

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
};

export type SendEmailResult = { success: true } | { success: false; error: string };

// Never throws — a failed email should never break the caller's flow
// (payment confirmation must still succeed even if delivery fails). The
// caller decides how/whether to record the failure.
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { success: false, error: "Email is not configured (no RESEND_API_KEY)" };
  }

  const from = process.env.EMAIL_FROM ?? "MMGM Enterprises <onboarding@resend.dev>";
  try {
    const { error } = await getClient().emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
