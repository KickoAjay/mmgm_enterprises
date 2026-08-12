import "server-only";

// Cashfree Orders API (v2023-08-01) — https://docs.cashfree.com/reference/pg-new-apis-endpoint
// Written against the documented request/response shape; there are no
// sandbox credentials in this environment yet (see docs/architecture.md
// §9), so this has not been exercised against a live Cashfree order.
// Re-verify field names against the current dashboard/docs the first time
// real credentials are added, per spec §28 "use the current official
// Cashfree documentation".
const CASHFREE_API_VERSION = "2023-08-01";

function getConfig() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const apiUrl = process.env.CASHFREE_API_URL;
  if (!appId || !secretKey || !apiUrl) {
    throw new Error(
      "Cashfree is not configured — set CASHFREE_APP_ID, CASHFREE_SECRET_KEY, and CASHFREE_API_URL in .env.local",
    );
  }
  return { appId, secretKey, apiUrl };
}

function authHeaders(): Record<string, string> {
  const { appId, secretKey } = getConfig();
  return {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": CASHFREE_API_VERSION,
    "Content-Type": "application/json",
  };
}

export type CreateCashfreeOrderParams = {
  orderId: string; // sent as Cashfree's own order_id — our orders.order_number
  amount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
};

export type CashfreeOrderSession = {
  cfOrderId: string;
  paymentSessionId: string;
};

export async function createCashfreeOrder(
  params: CreateCashfreeOrderParams,
): Promise<CashfreeOrderSession> {
  const { apiUrl } = getConfig();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(`${apiUrl}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customerId,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
      },
      order_meta: {
        return_url: params.returnUrl,
        notify_url: `${siteUrl}/api/webhooks/cashfree`,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cashfree order creation failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return { cfOrderId: data.cf_order_id, paymentSessionId: data.payment_session_id };
}

export type CashfreeOrder = {
  // "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED"
  orderStatus: string;
  paymentSessionId: string | null;
};

// Server-to-server lookup — used both to resume an in-progress session
// (reuse payment_session_id rather than creating a second Cashfree order
// for the same order_number on page refresh) and, on the return page, as
// the immediate best-effort confirmation. Never trust the return
// redirect's query params alone (spec §56.7); this hits Cashfree directly.
// Returns null for a 404 (no Cashfree order created yet).
export async function getCashfreeOrder(
  cashfreeOrderId: string,
): Promise<CashfreeOrder | null> {
  const { apiUrl } = getConfig();
  const res = await fetch(`${apiUrl}/orders/${encodeURIComponent(cashfreeOrderId)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cashfree order lookup failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return {
    orderStatus: data.order_status,
    paymentSessionId: data.payment_session_id ?? null,
  };
}

export function isCashfreeConfigured(): boolean {
  return Boolean(
    process.env.CASHFREE_APP_ID &&
      process.env.CASHFREE_SECRET_KEY &&
      process.env.CASHFREE_API_URL,
  );
}
