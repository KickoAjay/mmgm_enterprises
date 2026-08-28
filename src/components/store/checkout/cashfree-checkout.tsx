"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { getCashfreeHostedCheckoutUrl } from "@/lib/cashfree/checkout-url";

type CashfreeCheckoutResult = {
  error?: { message?: string; type?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
        returnUrl?: string;
      }) => Promise<CashfreeCheckoutResult>;
    };
  }
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

export function CashfreeCheckout({
  paymentSessionId,
  mode,
  returnUrl,
  productionSiteUrl,
}: {
  paymentSessionId: string;
  mode: "sandbox" | "production";
  returnUrl: string;
  productionSiteUrl?: string;
}) {
  const sdkAttempted = useRef(false);
  const redirected = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);

  const redirectToHostedCheckout = useCallback(() => {
    if (redirected.current) return;
    redirected.current = true;
    window.location.assign(
      getCashfreeHostedCheckoutUrl(paymentSessionId, mode),
    );
  }, [mode, paymentSessionId]);

  const launchSdkCheckout = useCallback(async () => {
    if (redirected.current) return;

    if (mode === "production" && typeof window !== "undefined") {
      const { hostname, protocol } = window.location;
      if (isLocalOrPrivateHost(hostname)) {
        setError(
          `Cashfree production checkout cannot open from ${window.location.origin}. Use sandbox/test keys for local development, or open checkout from ${productionSiteUrl ?? "your production domain"}.`,
        );
        setWaiting(false);
        return;
      }
      if (protocol !== "https:") {
        setError(
          `Cashfree production requires HTTPS. Open checkout from ${productionSiteUrl ?? "your production domain"}.`,
        );
        setWaiting(false);
        return;
      }
    }

    if (!window.Cashfree) {
      return;
    }

    sdkAttempted.current = true;
    setWaiting(true);
    setError(null);

    try {
      const cashfree = window.Cashfree({ mode });
      const result = await cashfree.checkout({
        paymentSessionId,
        returnUrl,
        redirectTarget: "_top",
      });

      if (result?.error) {
        console.error("[cashfree] checkout returned error", result.error);
        setError(
          result.error.message ??
            (mode === "production"
              ? "Cashfree could not open the payment page. Make sure this domain is whitelisted in your Cashfree merchant dashboard."
              : "Cashfree could not open the payment page. Please try again."),
        );
        setWaiting(false);
        return;
      }

      // SDK resolved without navigating — fall back to the hosted URL.
      if (!redirected.current) {
        console.warn("[cashfree] SDK resolved without redirect, using hosted URL");
        redirectToHostedCheckout();
      }
    } catch (err) {
      console.error("[cashfree] checkout launch failed", err);
      setError(
        mode === "production"
          ? "Cashfree could not open the payment page. Make sure this domain is whitelisted in your Cashfree merchant dashboard, or use sandbox keys for local testing."
          : "Cashfree could not open the payment page. Please try again.",
      );
      setWaiting(false);
    }
  }, [
    mode,
    paymentSessionId,
    productionSiteUrl,
    redirectToHostedCheckout,
    returnUrl,
  ]);

  const payNow = useCallback(() => {
    redirected.current = false;
    sdkAttempted.current = false;
    if (window.Cashfree) {
      void launchSdkCheckout();
      return;
    }
    redirectToHostedCheckout();
  }, [launchSdkCheckout, redirectToHostedCheckout]);

  useEffect(() => {
    if (window.Cashfree) void launchSdkCheckout();
  }, [launchSdkCheckout]);

  // If the SDK never loads or checkout hangs, offer a direct hosted-page link.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!redirected.current) {
        setWaiting(false);
        if (!sdkAttempted.current) {
          setError(
            "Cashfree is taking longer than expected to load. Click Pay Now to continue.",
          );
        } else {
          setError(
            "Cashfree did not redirect automatically. Click Pay Now to open the payment page.",
          );
        }
      }
    }, 6000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => void launchSdkCheckout()}
        onError={() => {
          sdkAttempted.current = false;
          setWaiting(false);
          setError(
            "Could not load the Cashfree payment SDK. Click Pay Now to open checkout directly.",
          );
        }}
      />

      {error ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" onClick={payNow}>
            Pay Now
          </Button>
        </div>
      ) : waiting ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Redirecting you to Cashfree to complete payment…
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            If you were not redirected, click below to open Cashfree checkout.
          </p>
          <Button type="button" onClick={payNow}>
            Pay Now
          </Button>
        </div>
      )}
    </>
  );
}
