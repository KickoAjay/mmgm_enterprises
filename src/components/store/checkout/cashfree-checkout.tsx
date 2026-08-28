"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_modal";
      }) => Promise<unknown>;
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
  productionSiteUrl,
}: {
  paymentSessionId: string;
  mode: "sandbox" | "production";
  productionSiteUrl?: string;
}) {
  const launched = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);

  const launch = useCallback(async () => {
    if (launched.current) return;
    if (!window.Cashfree) return;

    if (mode === "production" && typeof window !== "undefined") {
      const { hostname, protocol } = window.location;
      if (isLocalOrPrivateHost(hostname)) {
        setError(
          `Cashfree production checkout cannot open from ${window.location.origin}. Use sandbox/test keys for local development, or open checkout from ${productionSiteUrl ?? "your production domain"}.`,
        );
        setWaiting(false);
        launched.current = true;
        return;
      }
      if (protocol !== "https:") {
        setError(
          `Cashfree production requires HTTPS. Open checkout from ${productionSiteUrl ?? "your production domain"}.`,
        );
        setWaiting(false);
        launched.current = true;
        return;
      }
    }

    launched.current = true;
    setWaiting(true);
    setError(null);

    try {
      const cashfree = window.Cashfree({ mode });
      await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
    } catch (err) {
      console.error("[cashfree] checkout launch failed", err);
      launched.current = false;
      setError(
        mode === "production"
          ? "Cashfree could not open the payment page. Make sure this domain is whitelisted in your Cashfree merchant dashboard, or use sandbox keys for local testing."
          : "Cashfree could not open the payment page. Please try again.",
      );
      setWaiting(false);
    }
  }, [mode, paymentSessionId, productionSiteUrl]);

  useEffect(() => {
    if (window.Cashfree) void launch();
  }, [launch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!launched.current) {
        setWaiting(false);
        setError(
          "Cashfree is taking longer than expected to load. Click Pay Now to try again.",
        );
      }
    }, 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => void launch()}
        onError={() => {
          launched.current = false;
          setWaiting(false);
          setError(
            "Could not load the Cashfree payment SDK. Check your internet connection and try again.",
          );
        }}
      />

      {error ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" onClick={() => void launch()}>
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
          <Button type="button" onClick={() => void launch()}>
            Pay Now
          </Button>
        </div>
      )}
    </>
  );
}
