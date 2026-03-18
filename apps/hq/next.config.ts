import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve static assets from Sprint HQ's own domain so they load correctly
  // when sprint pages are proxied through Forum HQ at hq.frameworkfriday.ai
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? "https://sprint-hq.vercel.app"
      : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
