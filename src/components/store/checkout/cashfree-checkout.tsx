"use client";

import { useRef } from "react";
import Script from "next/script";

// Cashfree's hosted checkout UI can only be loaded from their CDN — it's
// the actual PCI-compliant payment collection surface, not something an
// npm package replicates. Required per spec §28's direction to follow
// Cashfree's official integration.
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

export function CashfreeCheckout({
  paymentSessionId,
  mode,
}: {
  paymentSessionId: string;
  mode: "sandbox" | "production";
}) {
  const launched = useRef(false);

  function launch() {
    if (launched.current || !window.Cashfree) return;
    launched.current = true;
    const cashfree = window.Cashfree({ mode });
    cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
  }

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={launch}
      />
      <p className="mt-6 text-sm text-muted-foreground">
        Redirecting you to Cashfree to complete payment…
      </p>
    </>
  );
}
