import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows the dev server to be reached from other devices on the LAN
  // (e.g. http://192.168.1.14:3000) — Next.js blocks cross-origin dev
  // asset requests by default, which otherwise silently breaks hydration.
  allowedDevOrigins: ["192.168.1.14"],
};

export default nextConfig;
