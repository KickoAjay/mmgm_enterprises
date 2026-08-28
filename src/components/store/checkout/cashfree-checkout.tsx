"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { Button } from "@/components/ui/button";

type CashfreeCheckoutResult = {
  error?: { message?: string; type?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

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
  const launching = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);

  const launchCheckout = useCallback(async () => {
    if (launching.current) return;

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

    launching.current = true;
    setWaiting(true);
    setError(null);

    try {
      const cashfree = await load({ mode });
      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

      if (result?.error) {
        console.error("[cashfree] checkout returned error", result.error);
        launching.current = false;
        setError(
          result.error.message ??
            (mode === "production"
              ? "Cashfree could not open checkout. Whitelist your domain in the Cashfree merchant dashboard (Developers → Whitelisting), then try again."
              : "Cashfree could not open the payment page. Please try again."),
        );
        setWaiting(false);
        return;
      }

      if (result?.redirect) {
        // Navigation is in progress — keep the loading state.
        return;
      }

      launching.current = false;
      setWaiting(false);
      setError(
        "Cashfree did not open the payment page. Click Pay Now to try again.",
      );
    } catch (err) {
      console.error("[cashfree] checkout launch failed", err);
      launching.current = false;
      setError(
        mode === "production"
          ? "Cashfree could not open checkout. Whitelist your domain in the Cashfree merchant dashboard (Developers → Whitelisting), then try again."
          : "Cashfree could not open the payment page. Please try again.",
      );
      setWaiting(false);
    }
  }, [mode, paymentSessionId, productionSiteUrl]);

  useEffect(() => {
    void launchCheckout();
  }, [launchCheckout]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (waiting && !error) {
        launching.current = false;
        setWaiting(false);
        setError(
          "Cashfree is taking longer than expected. Click Pay Now to try again.",
        );
      }
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [error, waiting]);

  return (
    <>
      {error ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            onClick={() => {
              launching.current = false;
              void launchCheckout();
            }}
          >
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
          <Button
            type="button"
            onClick={() => {
              launching.current = false;
              void launchCheckout();
            }}
          >
            Pay Now
          </Button>
        </div>
      )}
    </>
  );
}
