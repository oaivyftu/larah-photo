import { JOURNAL_PAGE_SIZE } from "@/constants/journal";

/**
 * Pure paging helpers for the journal listing (spec 013 FR-016). Kept apart
 * from the routes so the rules — which numbers are pages, which address a page
 * has — are one thing that is tested, not two copies that drift.
 */

/** Pages needed for `total` posts. Never below 1: an empty journal is still a page. */
export function pageCount(total: number, size = JOURNAL_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / size));
}

/** The posts on `page` (1-based). Empty beyond the last page, never an error. */
export function paginate<T>(
  items: T[],
  page: number,
  size = JOURNAL_PAGE_SIZE,
) {
  return items.slice((page - 1) * size, page * size);
}

/**
 * A URL segment as a page number, or `null` when it is not one. Only a plain
 * positive integer qualifies: `"02"` and `"2.0"` would be second addresses for
 * page 2, and FR-016a gives every page exactly one.
 */
export function parsePageNumber(segment: string) {
  if (!/^[1-9]\d*$/.test(segment)) {
    return null;
  }

  const page = Number(segment);

  return Number.isSafeInteger(page) ? page : null;
}

/** Page 1 keeps the journal's own address; later pages live under `/journal/page/`. */
export function journalPagePath(page: number) {
  return page <= 1 ? "/journal" : `/journal/page/${page}`;
}
