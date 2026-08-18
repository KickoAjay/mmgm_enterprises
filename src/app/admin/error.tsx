"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Admin-branded counterpart to the root error.tsx — catches errors
// anywhere under /admin except admin/layout.tsx itself (a trivial div
// wrapper with no data fetching, so unlikely to throw; if it ever did,
// the root boundary above still catches it). Same "no technical detail
// shown" rule as the storefront one.
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 text-center">
      <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
        MMGM Admin
      </span>
      <h1 className="mt-4 font-serif text-2xl text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page hit an error. Try again, or head back to the dashboard.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} className="uppercase tracking-wide">
          Try Again
        </Button>
        <Button asChild variant="outline" className="uppercase tracking-wide">
          <Link href="/admin">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
