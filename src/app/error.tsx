"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Root boundary — catches errors anywhere in the storefront tree,
// including (store)/layout.tsx itself (a same-segment error.tsx can't
// catch errors from its own layout, only a parent one can). Deliberately
// never renders `error.message`/`error.stack` — spec §49: "never show
// technical stack traces to customers." Server-side, Next already
// redacts the real message from the client for unhandled errors in
// production; this is the client-side half of that same rule.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Nothing sent anywhere yet — no error-tracking service is wired up
    // in this project. Kept as a single, obvious place to add one later.
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
        MMGM Enterprises
      </span>
      <h1 className="mt-4 font-serif text-section text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We hit a snag loading this page. Please try again, or head back to the homepage.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} className="uppercase tracking-wide">
          Try Again
        </Button>
        <Button asChild variant="outline" className="uppercase tracking-wide">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </main>
  );
}
