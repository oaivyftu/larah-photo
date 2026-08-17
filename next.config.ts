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
    // AVIF encoding is the most expensive part of the optimiser and roughly
    // doubles cache writes for marginal savings over WebP on photographs —
    // dropped after the free-tier Image Optimization quota was exceeded.
    formats: ["image/webp"],
    // Trimmed from Next's 8-value default to the breakpoints this app's
    // `sizes` props actually land on, merging pairs close enough (~10% or
    // less apart) to be visually indistinguishable. 3840 is kept: the
    // lightbox (`WorkProjectGalleryClient`) renders up to 74vw, which on a
    // 2560px 2x-DPR display needs ~3788px — cutting this mark would upscale
    // the app's largest, closest-viewed images.
    deviceSizes: [640, 828, 1080, 1200, 1920, 3840],
    // Only consumer is the 70px lightbox filmstrip thumbnail (a fixed px
    // `sizes`, not vw, so it draws from this array rather than deviceSizes).
    // 64/96 bracket 70px at 1x, 128 covers ~2x DPR.
    imageSizes: [64, 96, 128],
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
