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
        source: "/terms-conditions",
        destination: "/terms-of-service",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
