import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows the dev server to be reached from other devices on the LAN
  // (e.g. http://192.168.1.14:3000) — Next.js blocks cross-origin dev
  // asset requests by default, which otherwise silently breaks hydration.
  allowedDevOrigins: ["192.168.1.14"],
  images: {
    // No real product photography exists yet (see MediaPlaceholder), but
    // spec §33 puts uploads in Supabase Storage — pre-configuring this now
    // means next/image won't silently reject real image URLs once
    // product_images rows start pointing at Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
