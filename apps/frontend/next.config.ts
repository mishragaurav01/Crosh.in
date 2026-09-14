import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploads are already compressed client-side (WebP). Skipping the
    // on-the-fly optimizer avoids invoking a Netlify function per image
    // request (function-budget + latency cost). The src is served as-is.
    unoptimized: true,
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
