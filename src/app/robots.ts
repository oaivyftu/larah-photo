import type { MetadataRoute } from "next";

import { isIndexable, siteUrl } from "@/constants/seo";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The Sanity Studio and the contact endpoint are working surfaces, not
      // pages: neither belongs in an index, and `/studio` in particular is a
      // login screen that would otherwise rank for the brand name.
      disallow: ["/studio", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
