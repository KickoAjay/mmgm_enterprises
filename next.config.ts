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
  // Allows the dev server to be reached from other devices on the LAN
  // (e.g. http://192.168.1.14:3000) — Next.js blocks cross-origin dev
  // asset requests by default, which otherwise silently breaks hydration.
  allowedDevOrigins: ["192.168.1.14"],
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
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
