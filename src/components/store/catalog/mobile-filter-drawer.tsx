"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Wraps the (Server Component) FilterSidebar so it can render inside a
// client-side slide-over on mobile — Server Components can be passed as
// `children` into a Client Component without themselves becoming client.
export function MobileFilterDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <SlidersHorizontal className="size-4" />
        Filter
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <span className="text-meta font-semibold tracking-wide text-foreground uppercase">
              Filters
            </span>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setOpen(false)}
              className="flex size-9 items-center justify-center text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          <div className="border-t border-border px-6 py-4">
            <Button
              onClick={() => setOpen(false)}
              className="w-full tracking-wide uppercase"
            >
              Show Results
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
