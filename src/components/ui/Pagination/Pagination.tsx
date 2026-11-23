import Link from "next/link";
import styles from "./Pagination.module.scss";

type PaginationProps = {
  /** 1-based. */
  currentPage: number;
  totalPages: number;
  /** The address of a page. Every page must be a real link, so crawlers and keyboards reach it. */
  hrefForPage: (page: number) => string;
  /** The landmark's accessible name, e.g. "Journal pages". */
  label: string;
  className?: string;
};

type Entry = number | "gap-start" | "gap-end";

/** Up to this many pages are all listed; beyond it the middle collapses. */
const LISTED_IN_FULL = 7;

/**
 * Which numbers to show. The first and last page are always there so a reader
 * can jump to either end; the current page keeps a neighbour each side; every
 * run that is left out becomes one ellipsis.
 */
function entriesFor(current: number, total: number): Entry[] {
  if (total <= LISTED_IN_FULL) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "gap-end", total];
  }

  if (current >= total - 2) {
    return [1, "gap-start", total - 3, total - 2, total - 1, total];
  }

  return [1, "gap-start", current - 1, current, current + 1, "gap-end", total];
}

/**
 * Page links for a paginated list. Renders nothing for a single page, so a
 * caller can always mount it. The current page is marked with `aria-current`
 * and is not a link; every other page is an ordinary internal link, so it takes
 * the site's page transition and focus handling like any other navigation.
 */
export function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
  label,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label={label}
      className={[styles["pagination"], className].filter(Boolean).join(" ")}
      data-pagination
    >
      <ul className={styles["pagination__list"]}>
        {hasPrevious ? (
          <li>
            <Link
              aria-label="Previous page"
              className={styles["pagination__link"]}
              href={hrefForPage(currentPage - 1)}
              rel="prev"
            >
              Previous
            </Link>
          </li>
        ) : null}

        {entriesFor(currentPage, totalPages).map((entry) =>
          typeof entry === "string" ? (
            <li aria-hidden="true" key={entry}>
              <span className={styles["pagination__gap"]}>…</span>
            </li>
          ) : (
            <li key={entry}>
              {entry === currentPage ? (
                <span
                  aria-current="page"
                  aria-label={`Page ${entry}, current page`}
                  className={`${styles["pagination__link"]} ${styles["pagination__link--current"]}`}
                >
                  {entry}
                </span>
              ) : (
                <Link
                  aria-label={`Page ${entry}`}
                  className={styles["pagination__link"]}
                  href={hrefForPage(entry)}
                >
                  {entry}
                </Link>
              )}
            </li>
          ),
        )}

        {hasNext ? (
          <li>
            <Link
              aria-label="Next page"
              className={styles["pagination__link"]}
              href={hrefForPage(currentPage + 1)}
              rel="next"
            >
              Next
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
