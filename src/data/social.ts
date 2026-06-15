export const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/larahatelier.photography";

export const instagramDisplayUrl = instagramUrl.replace(/^https?:\/\//, "");

export const instagramHandle = `@${
  instagramDisplayUrl
    .replace(/^www\./, "")
    .replace(/^instagram\.com\//, "")
    .replace(/\/$/, "") || "larahphoto"
}`;
