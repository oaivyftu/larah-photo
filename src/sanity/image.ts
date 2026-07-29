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
