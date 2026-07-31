import type { NextConfig } from "next";

const isIndexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.5"],
  // Covers responses the HTML <meta> tag cannot reach — most importantly the
  // optimised images under /_next/image, which Google Images indexes on its own.
  async headers() {
    if (isIndexable) return [];

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noimageindex, noarchive",
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
