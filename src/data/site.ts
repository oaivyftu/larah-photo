import type { SiteSettings } from "@/types/site";

export const siteConfig = {
  name: "Larah Photo",
};

const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
  "https://www.instagram.com/larahatelier.photography";

const instagramDisplayUrl = instagramUrl.replace(/^https?:\/\//, "");

export const fallbackSiteSettings: SiteSettings = {
  name: siteConfig.name,
  instagramUrl,
  instagramDisplayUrl,
  instagramHandle: `@${
    instagramDisplayUrl
      .replace(/^www\./, "")
      .replace(/^instagram\.com\//, "")
      .replace(/\/$/, "") || "larahphoto"
  }`,
  email: "hoanglanmotor@gmail.com",
  phone: "+1 (226) 977-2845",
  location: "680 Wonderland Road North",
  footerStatement:
    "WE BELIEVE IN THE POWER OF DIGITAL, AND WE LOVE COLLABORATING WITH BRANDS THAT FEEL THE SAME. LET'S CONNECT.",
};
