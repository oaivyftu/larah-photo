import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  journalPagePath,
  pageCount,
  paginate,
} from "@/utils/journalPagination";
import {
  buildBreadcrumbSchema,
  buildJournalCollectionSchema,
} from "@/utils/structuredData";
import { JournalListClient } from "./JournalListClient";

/**
 * What `/journal` and `/journal/page/<n>` share (spec 013 FR-016): one place
 * decides what a page of the listing is, so the two routes cannot drift into
 * disagreeing about it. They differ only in how they read the page number.
 */

export async function journalIndexMetadata(
  pageNumber: number,
): Promise<Metadata> {
  const [posts, settings] = await Promise.all([
    getJournalPosts(),
    getSiteSettings(),
  ]);
  const totalPages = pageCount(posts.length);

  if (pageNumber > totalPages) {
    // The route 404s; a crawler reading only the head would otherwise file the
    // 404 under a plausible title (the same care as a post that is not live).
    return { title: "Page not found", robots: { index: false } };
  }

  const [newest] = paginate(posts, pageNumber);
  const description =
    `Stories, location guides and behind-the-scenes notes from Larah Photo ` +
    `in ${settings.location} — where to shoot, what to expect, and ` +
    "sessions from start to finish.";

  return pageMetadata({
    title: pageNumber === 1 ? "Journal" : `Journal — Page ${pageNumber}`,
    description:
      pageNumber === 1
        ? description
        : `${description} Page ${pageNumber} of ${totalPages}.`,
    // Each page names itself as canonical: a later page is its own list of
    // posts, not a duplicate of page 1 (FR-018).
    path: journalPagePath(pageNumber),
    // With no post there is no photograph of our own to use, so the image is
    // left to the site-wide default rather than guessed at (spec 008 FR-010).
    images: newest ? [toOpenGraphImage(newest.coverImage)] : undefined,
  });
}

export async function journalIndexView(pageNumber: number) {
  const posts = await getJournalPosts();
  const totalPages = pageCount(posts.length);

  if (pageNumber > totalPages) {
    notFound();
  }

  // After the range check, so a page that does not exist never pays for the
  // settings read, and before rendering, so missing settings raise rather than
  // rendering a heading-less page (FR-025).
  const content = await getJournalPage();
  const pagePosts = paginate(posts, pageNumber);

  return (
    <PageShell variant="journal">
      <JsonLd
        data={buildJournalCollectionSchema(pagePosts, { page: pageNumber })}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
          ...(pageNumber > 1
            ? [
                {
                  name: `Page ${pageNumber}`,
                  path: journalPagePath(pageNumber),
                },
              ]
            : []),
        ])}
      />
      <JournalListClient
        content={content}
        currentPage={pageNumber}
        posts={pagePosts}
        totalPages={totalPages}
      />
    </PageShell>
  );
}
