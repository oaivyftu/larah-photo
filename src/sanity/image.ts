import type { ProjectImage } from "@/types/project";

export type SanityImageValue = {
  asset?: {
    url?: string;
    metadata?: {
      lqip?: string;
      dimensions?: {
        width?: number;
        height?: number;
      };
    };
  };
  alt?: string;
};

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * Social cards are a fixed 1.91:1, which no photograph in the library happens
 * to be. Sanity's CDN crops on the fly, so the card gets a correctly framed
 * image instead of one the platform letterboxes or centre-crops itself.
 */
export function toOpenGraphImage(image: Pick<ProjectImage, "src" | "alt">) {
  const url = new URL(image.src);

  url.searchParams.set("w", String(OG_IMAGE_WIDTH));
  url.searchParams.set("h", String(OG_IMAGE_HEIGHT));
  url.searchParams.set("fit", "crop");
  url.searchParams.set("auto", "format");

  return {
    url: url.toString(),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: image.alt,
  };
}

export function resolveSanityImage(
  image: SanityImageValue | null | undefined,
  field: string,
): ProjectImage {
  const src = image?.asset?.url;
  const alt = image?.alt?.trim();
  const width = image?.asset?.metadata?.dimensions?.width;
  const height = image?.asset?.metadata?.dimensions?.height;

  if (!src || !alt || !width || !height) {
    throw new Error(
      `Sanity image "${field}" requires an asset, alt text, and dimensions.`,
    );
  }

  return {
    src,
    alt,
    width,
    height,
    blurDataURL: image.asset?.metadata?.lqip,
  };
}
