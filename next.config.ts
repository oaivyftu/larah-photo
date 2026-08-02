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
    // Photographs are replaced by re-uploading in Sanity, which mints a new
    // asset URL, so an optimised variant is never stale. The default 4h TTL
    // just makes the optimiser redo work it already did.
    minimumCacheTTL: 31_536_000,
    // Allowlist, not a preference: an unlisted `quality` is rejected, which
    // stops the optimiser being driven through arbitrary variants. No caller
    // overrides `quality`, so the single default is all that is reachable.
    qualities: [75],
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
