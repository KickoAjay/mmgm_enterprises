import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree/webhook";
import { confirmPayment } from "@/features/payments/confirm";
import { createServiceClient } from "@/lib/db/service";

// Cashfree's authoritative confirmation path — the payment-return page
// (src/app/(store)/checkout/pay/[orderId]/return) does its own immediate
// check, but this is the one that's guaranteed to eventually fire even if
// the customer closes the browser mid-payment (spec §28's flow diagram).
// Must read the raw body for signature verification before any JSON
// parsing — re-serializing a JSON.parse'd body can differ byte-for-byte
// from what Cashfree actually signed.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }
  if (!verifyCashfreeWebhookSignature({ rawBody, timestamp, signature })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    type?: string;
    data?: {
      order?: { order_id?: string };
      payment?: { cf_payment_id?: string };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cashfreeOrderId = payload.data?.order?.order_id;
  const eventType = payload.type ?? "UNKNOWN";
  if (!cashfreeOrderId) {
    return NextResponse.json({ error: "Missing order id in payload" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("cashfree_order_id", cashfreeOrderId)
    .maybeSingle();
  if (!payment) {
    // No matching order — acknowledge so Cashfree stops retrying rather
    // than erroring on something we have no record of.
    return NextResponse.json({ received: true });
  }

  // Idempotency key derived from the exact payload bytes: a retried
  // delivery resends the identical body, so it hashes to the same
  // cashfree_event_id and the unique constraint below rejects the
  // duplicate insert before any side effect re-runs (spec §56.9).
  const eventId = createHash("sha256").update(rawBody).digest("hex");
  const { error: insertError } = await supabase.from("payment_transactions").insert({
    payment_id: payment.id,
    cashfree_event_id: eventId,
    event_type: eventType,
    raw_payload: payload,
  });
  if (insertError) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
    await confirmPayment(cashfreeOrderId, payload.data?.payment?.cf_payment_id);
  } else if (
    eventType === "PAYMENT_FAILED_WEBHOOK" ||
    eventType === "PAYMENT_USER_DROPPED_WEBHOOK"
  ) {
    await supabase
      .from("payments")
      .update({ status: "FAILED" })
      .eq("id", payment.id)
      .neq("status", "SUCCESS");
  }

  return NextResponse.json({ received: true });
}
