// Hosted checkout URLs — used as a fallback when the JS SDK cannot redirect
// (e.g. CSP blocked a form POST, SDK returned result.error, or script load failed).
export function getCashfreeHostedCheckoutUrl(
  paymentSessionId: string,
  mode: "sandbox" | "production",
): string {
  const sessionId = encodeURIComponent(paymentSessionId);
  if (mode === "sandbox") {
    return `https://sandbox.cashfree.com/pg/view/sessions/checkout?session_id=${sessionId}`;
  }
  return `https://payments.cashfree.com/order/#/${sessionId}`;
}
