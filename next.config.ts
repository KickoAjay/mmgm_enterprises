import type { NextConfig } from "next";

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
};

export default nextConfig;
