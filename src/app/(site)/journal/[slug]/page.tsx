import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalBody } from "@/components/journal/JournalBody/JournalBody";
import { JournalCta } from "@/components/journal/JournalCta/JournalCta";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/constants/seo";
import {
  getJournalPage,
  getJournalPostBySlug,
  getJournalPostSlugs,
} from "@/sanity/fetchers";
import { toOpenGraphImage } from "@/sanity/image";
import { formatJournalDate } from "@/utils/journalDate";
import {
  buildBreadcrumbSchema,
  buildJournalPostSchema,
} from "@/utils/structuredData";
import { JournalPostClient } from "./JournalPostClient";
import styles from "./post.module.scss";

type JournalPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/** Matches `--journal-figure-measure` (64rem), as the body's figures do. */
const COVER_SIZES = "(max-width: 1024px) 100vw, 1024px";

export async function generateMetadata({
  params,
}: JournalPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPostBySlug(slug);

  if (!post) {
    // The page itself 404s; a crawler reading only the head would otherwise
    // file the 404 under a plausible title. Scheduled posts land here too.
    return { title: "Post not found", robots: { index: false } };
  }

  return pageMetadata({
    // The fetcher has already turned blank overrides into `undefined`, so a
    // whitespace-only override falls through to the fallback (spec 013
    // FR-017).
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/journal/${post.slug}`,
    images: [toOpenGraphImage(post.coverImage)],
  });
}

/**
 * Live slugs only — the query's schedule filter decides that. `dynamicParams`
 * is left at its default, so a post whose date arrives after the build renders
 * on its first request instead of 404ing until the next deploy
 * (research.md §6).
 */
export async function generateStaticParams() {
  const slugs = await getJournalPostSlugs();

  return slugs.map((slug) => ({ slug }));
}

export default async function JournalPostPage({
  params,
}: JournalPostPageProps) {
  const { slug } = await params;
  const post = await getJournalPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // After the 404 check, so an unknown slug never pays for the settings read,
  // and before rendering, so missing settings raise rather than rendering a
  // post with no way on (FR-025).
  const journalPage = await getJournalPage();

  return (
    <PageShell variant="journalPost">
      <JsonLd data={buildJournalPostSchema(post)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
          { name: post.title, path: `/journal/${post.slug}` },
        ])}
      />
      <JournalPostClient>
        <header className={styles["post__header"]}>
          <p className={styles["post__category"]} data-journal-intro>
            {post.category}
          </p>
          <h1 className={styles["post__title"]} data-journal-intro>
            {post.title}
          </h1>
          <p className={styles["post__meta"]} data-journal-intro>
            <time dateTime={post.publishedAt}>
              {formatJournalDate(post.publishedAt)}
            </time>
            <span>{post.location}</span>
          </p>
        </header>

        <figure className={styles["post__cover"]} data-journal-intro>
          <LarahImage
            alt={post.coverImage.alt}
            blurDataURL={post.coverImage.blurDataURL}
            className={styles["post__cover-image"]}
            height={post.coverImage.height}
            preload
            sizes={COVER_SIZES}
            src={post.coverImage.src}
            width={post.coverImage.width}
          />
        </figure>

        <JournalBody body={post.body} />
        <JournalCta cta={journalPage.cta} />
      </JournalPostClient>
    </PageShell>
  );
}
