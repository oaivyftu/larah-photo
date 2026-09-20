import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/constants/seo";
import {
  getJournalPage,
  getJournalPosts,
  getSiteSettings,
} from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import {
  buildBreadcrumbSchema,
  buildJournalCollectionSchema,
} from "@/utils/structuredData";
import { JournalListClient } from "./JournalListClient";

export async function generateMetadata(): Promise<Metadata> {
  const [posts, settings] = await Promise.all([
    getJournalPosts(),
    getSiteSettings(),
  ]);
  const [newest] = posts;

  return pageMetadata({
    title: "Journal",
    description:
      `Stories, location guides and behind-the-scenes notes from Larah Photo ` +
      `in ${settings.location} — where to shoot, what to expect, and ` +
      "sessions from start to finish.",
    path: "/journal",
    // With no post there is no photograph of our own to use, so the image is
    // left to the site-wide default rather than guessed at (spec 008 FR-010).
    images: newest ? [toOpenGraphImage(newest.coverImage)] : undefined,
  });
}

export default async function JournalPage() {
  const [content, posts] = await Promise.all([
    getJournalPage(),
    getJournalPosts(),
  ]);

  return (
    <PageShell variant="journal">
      <JsonLd data={buildJournalCollectionSchema(posts)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
        ])}
      />
      <JournalListClient content={content} posts={posts} />
    </PageShell>
  );
}
