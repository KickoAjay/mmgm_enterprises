import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Cashfree webhook signature: base64(HMAC-SHA256(timestamp + rawBody, secret)),
// sent as `x-webhook-signature` alongside `x-webhook-timestamp`. Must be
// computed over the exact raw request bytes — never over a re-serialized
// JSON.parse(body) result, which can differ byte-for-byte from what was
// signed. Re-verify header/algorithm names against the dashboard once real
// credentials exist (see src/lib/cashfree/client.ts header comment).
export function verifyCashfreeWebhookSignature(params: {
  rawBody: string;
  timestamp: string;
  signature: string;
}): boolean {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac("sha256", secret)
    .update(params.timestamp + params.rawBody)
    .digest("base64");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(params.signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
