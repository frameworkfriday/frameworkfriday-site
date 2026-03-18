import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/decision-sprint",
        destination: "https://start.frameworkfriday.ai",
        permanent: false,
      },
      {
        source: "/academy",
        destination: "https://start.frameworkfriday.ai/academy",
        permanent: false,
      },
      {
        source: "/forum",
        destination: "https://start.frameworkfriday.ai/forum",
        permanent: false,
      },
      {
        source: "/terms-conditions",
        destination: "/terms-of-service",
        permanent: true,
      },
      // Legacy .com paths that don't exist on .ai
      {
        source: "/join",
        destination: "https://start.frameworkfriday.ai",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
