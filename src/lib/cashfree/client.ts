import "server-only";
import { getCashfreeConfig, getConfiguredSiteUrl } from "@/lib/cashfree/config";

// Cashfree Orders API (v2023-08-01) — https://docs.cashfree.com/reference/pg-new-apis-endpoint
// Verified working against a real Cashfree production order (200,
// real payment_session_id returned) — see docs/architecture.md §39.
// order_meta.return_url must be https; Cashfree's production API
// rejects anything else outright (confirmed directly, same doc).
const CASHFREE_API_VERSION = "2023-08-01";

function authHeaders(): Record<string, string> {
  const { appId, secretKey } = getCashfreeConfig();
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
  customerName: string;
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
  const { apiUrl } = getCashfreeConfig();
  const siteUrl = getConfiguredSiteUrl();
  const notifyUrl = `${siteUrl}/api/webhooks/cashfree`;
  const method = "POST";
  const url = `${apiUrl}/orders`;

  // Safe by construction — never includes x-client-secret (authHeaders()
  // is never logged) or any customer PII beyond what's already visible
  // in the admin order itself. Lets a failure be diagnosed from server
  // logs alone instead of another blind live-API investigation.
  console.log("[cashfree] creating order", {
    method,
    url,
    order_id: params.orderId,
    order_amount: params.amount,
    order_currency: "INR",
    return_url: params.returnUrl,
    notify_url: notifyUrl,
  });

  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customerId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
      },
      order_meta: {
        return_url: params.returnUrl,
        notify_url: notifyUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[cashfree] order creation failed", {
      status: res.status,
      order_id: params.orderId,
      response: body,
    });
    throw new Error(`Cashfree order creation failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.log("[cashfree] order created", {
    status: res.status,
    order_id: params.orderId,
    cf_order_id: data.cf_order_id,
    has_payment_session_id: Boolean(data.payment_session_id),
  });
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
// Returns null when no resumable session exists (404), or when lookup
// cannot authenticate (401 — wrong credentials/URL or a stale order_id
// from a different Cashfree environment).
export async function getCashfreeOrder(
  cashfreeOrderId: string,
): Promise<CashfreeOrder | null> {
  const { apiUrl } = getCashfreeConfig();
  const res = await fetch(`${apiUrl}/orders/${encodeURIComponent(cashfreeOrderId)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 401) {
    if (res.status === 401) {
      console.warn(
        "[cashfree] order lookup returned 401 — no resumable session under current credentials",
        { cashfreeOrderId, apiUrl },
      );
    }
    return null;
  }
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

export { isCashfreeConfigured, getCashfreeConfig, getConfiguredSiteUrl, getProductionCheckoutBlockReason } from "@/lib/cashfree/config";
