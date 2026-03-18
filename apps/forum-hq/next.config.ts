import type { NextConfig } from "next";

const SPRINT_HQ_URL = "https://sprint-hq.vercel.app";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async rewrites() {
    return {
      afterFiles: [
        // Sprint cohort pages (e.g. /mar-2-2026)
        {
          source: "/:slug([a-z]+-\\d+-\\d{4})",
          destination: `${SPRINT_HQ_URL}/:slug`,
        },
        // Sprint submit page
        {
          source: "/submit",
          destination: `${SPRINT_HQ_URL}/submit`,
        },
        // Sprint resources (namespaced to avoid conflict with Forum HQ /resources)
        {
          source: "/sprint-resources/:path*",
          destination: `${SPRINT_HQ_URL}/resources/:path*`,
        },
        // Sprint admin
        {
          source: "/sprint/admin/:path*",
          destination: `${SPRINT_HQ_URL}/admin/:path*`,
        },
        // Sprint auth
        {
          source: "/sprint/login",
          destination: `${SPRINT_HQ_URL}/login`,
        },
        {
          source: "/sprint/auth/:path*",
          destination: `${SPRINT_HQ_URL}/auth/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
