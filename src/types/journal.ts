import type { PortableTextBlock } from "next-sanity";
import type { JournalCategory } from "@/constants/journalCategories";
import type { ProjectImage } from "@/types/project";

export type EmbedProvider = "google-maps" | "youtube" | "vimeo";

/** A body image, resolved. `caption` is shown to every reader; `alt` is for
 *  assistive technology, and the one never stands in for the other. */
export type JournalBodyImage = {
  _type: "bodyImage";
  _key: string;
  image: ProjectImage;
  caption?: string;
};

/** An embed, already matched to an allowed provider and normalised to its
 *  no-tracking URL (contracts/embed-providers.md). */
export type JournalEmbed = {
  _type: "embed";
  _key: string;
  provider: EmbedProvider;
  src: string;
  title: string;
};

export type JournalBodyBlock =
  PortableTextBlock | JournalBodyImage | JournalEmbed;

export type JournalPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  /** `YYYY-MM-DD`, exactly as the editor chose it. */
  publishedAt: string;
  category: JournalCategory;
  location: string;
  coverImage: ProjectImage;
  /** ISO timestamp of the post's last edit. */
  updatedAt: string;
  /** Flattened for the sitemap and structured data. */
  bodyImages: ProjectImage[];
};

export type JournalPost = JournalPostSummary & {
  body: JournalBodyBlock[];
  seoTitle?: string;
  seoDescription?: string;
};

export type JournalPageContent = {
  titleWords: string[];
  emptyStateMessage: string;
  cta: {
    heading: string;
    body: string;
    contactLabel: string;
    workLabel: string;
  };
};
