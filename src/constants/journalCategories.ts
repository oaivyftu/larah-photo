/**
 * The journal's category vocabulary, and the single source for it: the Sanity
 * schema offers exactly this list and the fetcher rejects anything outside it,
 * so the Studio and the running site cannot disagree (spec 013 FR-003,
 * research.md §10). Adding a category is a code change and a deploy.
 *
 * The first five share their names with the work gallery's categories by
 * convention only. `workProject.category` stays free text and derives its
 * filters from the data (spec 002 FR-002); this list deliberately does not
 * constrain it.
 */
export const JOURNAL_CATEGORIES = [
  "Portrait",
  "Wedding",
  "Engagement",
  "Family",
  "Graduation",
  "Location Guide",
  "Behind the Scenes",
] as const;

export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];

export function isJournalCategory(value: string): value is JournalCategory {
  return (JOURNAL_CATEGORIES as readonly string[]).includes(value);
}
