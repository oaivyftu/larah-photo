import Link from "next/link";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import type { JournalPostSummary } from "@/types/journal";
import { formatJournalDate } from "@/utils/journalDate";
import styles from "./JournalCard.module.scss";

type JournalCardProps = {
  post: JournalPostSummary;
  /**
   * The first row loads straight away; the rest wait for the scroll (spec 013
   * FR-028). `loading="eager"`, not `preload`: Next's image docs reserve
   * `preload` for the one image that is the page's largest paint, and advise
   * against it when several images could be — which a row of cards is.
   */
  eager?: boolean;
};

/** Matches the index grid: one column on a phone, two on a tablet, three. */
const CARD_SIZES = "(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw";

/**
 * One post on the journal index. Only the title is a link; the whole card is
 * made clickable by stretching that link's hit area over it in CSS. Wrapping
 * the card in a link instead would give it an accessible name made of the
 * alt text, date, title and excerpt run together — and a second link per post
 * for keyboard users to tab through.
 */
export function JournalCard({ post, eager = false }: JournalCardProps) {
  return (
    <article className={styles["journal-card"]} data-journal-card>
      <div className={styles["journal-card__media"]}>
        <LarahImage
          alt={post.coverImage.alt}
          blurDataURL={post.coverImage.blurDataURL}
          className={styles["journal-card__image"]}
          height={post.coverImage.height}
          loading={eager ? "eager" : "lazy"}
          sizes={CARD_SIZES}
          src={post.coverImage.src}
          width={post.coverImage.width}
        />
      </div>
      <p className={styles["journal-card__meta"]}>
        <time dateTime={post.publishedAt}>
          {formatJournalDate(post.publishedAt)}
        </time>
        <span>{post.category}</span>
      </p>
      <h2 className={styles["journal-card__title"]}>
        <Link
          className={styles["journal-card__link"]}
          href={`/journal/${post.slug}`}
        >
          {post.title}
        </Link>
      </h2>
      <p className={styles["journal-card__excerpt"]}>{post.excerpt}</p>
    </article>
  );
}
