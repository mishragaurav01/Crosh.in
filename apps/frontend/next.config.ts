import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product/collection image URLs are derived from backend S3_PUBLIC_BASE_URL
      // at DTO-mapping time, so the host is deployment-dependent. Hosts are only
      // ever taken from our own API responses, never user input.
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;
