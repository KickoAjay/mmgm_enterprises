import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/client";
import { logEmailDelivery } from "@/lib/email/log";
import { buildTestEmail } from "@/lib/email/templates/test-email";

const bodySchema = z.object({ to: z.email() });

// Dev-only verification utility for the Resend wiring — not a general
// "send any email" endpoint. Recipient is the only caller-supplied field
// (validated), subject/body are fixed, and `from` always comes from
// EMAIL_FROM inside sendEmail() — never something a caller can choose.
// Disabled outright in production so it can never become an open relay;
// there's no admin panel yet to gate it behind real auth instead (that's
// a later phase), so environment is the gate for now.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Provide a valid "to" email address' },
      { status: 400 },
    );
  }

  const { subject, html, text } = buildTestEmail();
  const result = await sendEmail({ to: parsed.data.to, subject, html, text });
  await logEmailDelivery(
    subject,
    `Test email to ${parsed.data.to}`,
    result.success ? "SENT" : "FAILED",
    result.success ? undefined : result.error,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
