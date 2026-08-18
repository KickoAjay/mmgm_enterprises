import type { NextConfig } from "next";

// script-src/style-src keep 'unsafe-inline' rather than a nonce-based
// policy — Framer Motion animates via inline `style` attributes
// throughout the storefront, and tightening this to a nonce would need
// per-request nonce plumbing through every Script tag (including
// Cashfree's own SDK below) that isn't worth the risk of silently
// breaking checkout, the highest-stakes flow in the app, without a
// browser available in this environment to verify against. Everything
// else here (default-src, frame-ancestors, object-src, connect-src) is a
// real restriction with no such tradeoff.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://sdk.cashfree.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://images.pexels.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.cashfree.com",
  "frame-src https://*.cashfree.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Allows the dev server to be reached from other devices on the LAN —
  // Next.js blocks cross-origin dev asset requests by default, which
  // otherwise silently breaks hydration: the initial HTML still renders
  // (so the page looks present), but every JS chunk request gets
  // blocked, so React never hydrates and nothing below the first
  // server-rendered paint (or anything CSS-in-JS/client-only) works —
  // this is what "homepage shows only the hero image" and "nav isn't
  // sticky" actually were, confirmed via the `next dev` console showing
  // "Blocked cross-origin request to Next.js dev resource" for a LAN IP
  // not on this list. DHCP reassigns this machine's LAN IP over time
  // (this file has already needed updating once), so if this starts
  // happening again after a network change, check the terminal for the
  // actual blocked origin and add it here.
  allowedDevOrigins: ["192.168.1.14", "10.151.170.33"],
  images: {
    remotePatterns: [
      // Supabase Storage — admin-uploaded product/return-evidence media.
      { protocol: "https", hostname: "**.supabase.co" },
      // Pexels — source of the seeded saree photography (free-license
      // stock photos) until real product photography exists.
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    const headers = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    // CSP and HSTS only in production — the CSP's connect-src has no
    // allowance for `ws:`/the LAN-IP origin Next's dev server's HMR
    // socket needs, so applying it in dev breaks hot-reload even after
    // fixing allowedDevOrigins above; HSTS is meaningless (and actively
    // unhelpful for local http:// testing) outside a real deployed
    // domain anyway.
    if (process.env.NODE_ENV === "production") {
      headers.push(
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "Content-Security-Policy", value: CSP },
      );
    }

    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
