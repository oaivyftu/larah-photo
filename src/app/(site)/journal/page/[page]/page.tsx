import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getJournalPosts } from "@/sanity/fetchers";
import { pageCount, parsePageNumber } from "@/utils/journalPagination";
import { journalIndexMetadata, journalIndexView } from "../../journalIndex";

type JournalListPageProps = {
  params: Promise<{
    page: string;
  }>;
};

const NOT_FOUND: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * Pages 2 to the last one that exists now. `dynamicParams` keeps its default,
 * so a page that appears later, when scheduled posts reach their date, renders
 * on its first request instead of 404ing until the next deploy (FR-016c).
 */
export async function generateStaticParams() {
  const posts = await getJournalPosts();

  return Array.from({ length: pageCount(posts.length) - 1 }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({
  params,
}: JournalListPageProps): Promise<Metadata> {
  const pageNumber = parsePageNumber((await params).page);

  // Page 1 redirects and a non-number is a 404; neither should read as a page.
  if (pageNumber === null || pageNumber === 1) {
    return NOT_FOUND;
  }

  return journalIndexMetadata(pageNumber);
}

export default async function JournalListPage({
  params,
}: JournalListPageProps) {
  const pageNumber = parsePageNumber((await params).page);

  if (pageNumber === null) {
    notFound();
  }

  if (pageNumber === 1) {
    // Page 1 already has an address; /journal/page/1 must not be a second one
    // (FR-016a).
    permanentRedirect("/journal");
  }

  return journalIndexView(pageNumber);
}
