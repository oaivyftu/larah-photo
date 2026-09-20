"use client";

import { JournalCard } from "@/components/journal/JournalCard/JournalCard";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import type { JournalPageContent, JournalPostSummary } from "@/types/journal";
import { usePageIntro } from "@/utils/usePageIntro";
import styles from "./journal.module.scss";

type JournalListClientProps = {
  content: JournalPageContent;
  posts: JournalPostSummary[];
};

/** How many cards load eagerly: the first row on a laptop, which is what a
 *  visitor sees without scrolling. The rest are lazy (FR-028). */
const EAGER_CARDS = 3;

export function JournalListClient({ content, posts }: JournalListClientProps) {
  const rootRef = usePageIntro<HTMLDivElement>((intro) => {
    intro.from(
      "[data-journal-card], [data-journal-empty]",
      {
        y: 28,
        opacity: 0,
        duration: 0.74,
        stagger: 0.06,
        ease: "power3.out",
      },
      "-=0.42",
    );
  });

  return (
    <div className={styles["journal"]} ref={rootRef}>
      <PageHeading
        className={styles["journal__heading"]}
        id="journal-title"
        words={content.titleWords}
      />

      {posts.length ? (
        <div
          aria-labelledby="journal-title"
          className={styles["journal__grid"]}
          data-journal-list
          role="list"
        >
          {posts.map((post, index) => (
            <div key={post.slug} role="listitem">
              <JournalCard eager={index < EAGER_CARDS} post={post} />
            </div>
          ))}
        </div>
      ) : (
        // Zero live posts is a valid state, not a content error: the editor's
        // own message, never a blank area (spec 013 FR-015).
        <p className={styles["journal__empty"]} data-journal-empty>
          {content.emptyStateMessage}
        </p>
      )}
    </div>
  );
}
