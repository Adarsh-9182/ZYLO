import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/order/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  images: {
    // Vercel's image optimizer answers 402 once the plan's monthly quota is
    // spent, and every <Image> on the site then renders as an empty box — which
    // is what shoppers saw on product pages. The photos are already sized JPEGs
    // served from the CDN, so they are sent as they are rather than depending
    // on a metered transform that can switch off.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com" }],
  },
};

export default nextConfig;
