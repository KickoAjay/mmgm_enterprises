import "server-only";

export const CASHFREE_SANDBOX_API_URL = "https://sandbox.cashfree.com/pg";
export const CASHFREE_PRODUCTION_API_URL = "https://api.cashfree.com/pg";

// Sandbox App IDs start with TEST; sandbox secret keys contain _test_.
// Production keys must always use https://api.cashfree.com/pg — mixing
// production keys with the sandbox URL (or the reverse) returns 401 on
// every API call, which is the recurring failure mode documented in
// docs/architecture.md §41.
export function isSandboxCredential(appId: string, secretKey: string): boolean {
  const normalizedId = appId.toUpperCase();
  const normalizedSecret = secretKey.toLowerCase();
  return (
    normalizedId.startsWith("TEST") ||
    normalizedSecret.includes("_test_") ||
    normalizedSecret.includes("_ma_test_")
  );
}

export type CashfreeConfig = {
  appId: string;
  secretKey: string;
  apiUrl: string;
  mode: "sandbox" | "production";
};

export function getCashfreeConfig(): CashfreeConfig {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const configuredUrl = process.env.CASHFREE_API_URL?.replace(/\/$/, "");

  if (!appId || !secretKey) {
    throw new Error(
      "Cashfree is not configured — set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env.local",
    );
  }

  const sandbox = isSandboxCredential(appId, secretKey);
  const expectedUrl = sandbox
    ? CASHFREE_SANDBOX_API_URL
    : CASHFREE_PRODUCTION_API_URL;

  let apiUrl = configuredUrl ?? expectedUrl;
  if (configuredUrl && configuredUrl !== expectedUrl) {
    console.warn(
      `[cashfree] CASHFREE_API_URL (${configuredUrl}) does not match ${sandbox ? "sandbox" : "production"} credentials — using ${expectedUrl} instead`,
    );
    apiUrl = expectedUrl;
  }

  return {
    appId,
    secretKey,
    apiUrl,
    mode: sandbox ? "sandbox" : "production",
  };
}

export function isCashfreeConfigured(): boolean {
  return Boolean(
    process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY,
  );
}

export function normalizeSiteUrl(url?: string): string {
  const fallback = "http://localhost:3000";
  const trimmed = (url ?? fallback).trim().replace(/\/+$/, "");
  return trimmed || fallback;
}

export function getConfiguredSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

// Production Cashfree only allows checkout from whitelisted https domains.
// Sandbox is fine on localhost/LAN. Returns a user-facing message when
// the current page origin is not suitable for production checkout.
export function getProductionCheckoutBlockReason(
  requestOrigin: string | null,
  mode: "sandbox" | "production",
): string | null {
  if (mode === "sandbox" || !requestOrigin) {
    if (mode === "production" && !requestOrigin) {
      return `Cannot verify where checkout was opened. For production payments, open ${getConfiguredSiteUrl()} directly instead of localhost.`;
    }
    return null;
  }

  try {
    const url = new URL(requestOrigin);
    const host = url.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return `Cashfree production payments cannot run from ${requestOrigin}. Open the site from your approved domain (${getConfiguredSiteUrl()}) or use sandbox/test API keys for local development.`;
    }

    if (url.protocol !== "https:") {
      return `Cashfree production requires HTTPS. You opened ${requestOrigin}, but production checkout must run on ${getConfiguredSiteUrl()}.`;
    }

    const configuredHost = new URL(getConfiguredSiteUrl()).hostname.toLowerCase();
    if (host !== configuredHost) {
      return `Cashfree production is not enabled for ${requestOrigin}. Open checkout from ${getConfiguredSiteUrl()} or whitelist this domain in the Cashfree merchant dashboard.`;
    }
  } catch {
    return "Cashfree production checkout cannot start from this URL. Use your approved production domain or sandbox keys for local testing.";
  }

  return null;
}
