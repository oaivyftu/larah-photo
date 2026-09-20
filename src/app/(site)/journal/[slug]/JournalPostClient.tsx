"use client";

import { usePageIntro } from "@/utils/usePageIntro";
import styles from "./post.module.scss";

type JournalPostClientProps = {
  children: React.ReactNode;
};

/**
 * The post's entry animation, and nothing else. The article itself is
 * rendered on the server and arrives as `children`, so the Portable Text
 * renderer never ships to the client — this wrapper is the only part of the
 * page that needs the browser.
 *
 * No `PageHeading` here: a long article headline is not a short section title
 * (research.md §7), so the header rises in as one piece rather than being
 * mask-revealed word by word. `usePageIntro` skips everything under reduced
 * motion (FR-027).
 */
export function JournalPostClient({ children }: JournalPostClientProps) {
  const rootRef = usePageIntro<HTMLElement>((intro) => {
    intro.from("[data-journal-intro]", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.09,
      ease: "power3.out",
    });
  });

  return (
    <article className={styles["post"]} ref={rootRef}>
      {children}
    </article>
  );
}
