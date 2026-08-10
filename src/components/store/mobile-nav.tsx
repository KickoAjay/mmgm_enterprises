"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/components/store/nav-links";

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center text-foreground"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <span className="text-meta font-semibold tracking-[0.2em] text-primary uppercase">
              MMGM Enterprises
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex size-9 items-center justify-center text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col px-6 py-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-base text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              onClick={() => setOpen(false)}
              className="py-3 text-base text-foreground"
            >
              {isLoggedIn ? "My Account" : "Login / Register"}
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
