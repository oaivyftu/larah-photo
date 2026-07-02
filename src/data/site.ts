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
  location: "London, ON, Canada",
  footerStatement:
    "READY TO PLAN SOMETHING BEAUTIFUL? INSTAGRAM IS THE FASTEST WAY TO START YOUR SESSION.",
};
