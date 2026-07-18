import type { ProjectImage } from "@/types/project";

export type SanityImageValue = {
  asset?: {
    url?: string;
    metadata?: {
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
  fallback: ProjectImage,
): ProjectImage {
  const dimensions = image?.asset?.metadata?.dimensions;

  return {
    src: image?.asset?.url ?? fallback.src,
    alt: image?.alt ?? fallback.alt,
    width: dimensions?.width ?? fallback.width,
    height: dimensions?.height ?? fallback.height,
  };
}
