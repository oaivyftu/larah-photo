/**
 * The journal's dates are calendar days, not instants (spec 013 FR-010).
 *
 * Two traps this module exists to keep out of the rest of the code:
 *
 * - `new Date("2026-09-15")` parses as UTC midnight, which is still the 14th
 *   for every reader west of Greenwich. Anything that parses the stored date
 *   and formats it in local time shows the wrong day. So the display date is
 *   built from the string's own parts and nothing here ever localises it.
 * - "Today" means today in the studio's time zone — the day the editor
 *   thinks it is — not the server's and not UTC. The schedule (FR-007a) is
 *   decided against that, and DST is Intl's job rather than a fixed offset.
 */

export const STUDIO_TIME_ZONE = "America/Toronto";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// `en-CA` because its numeric date format is already ISO order, which makes
// the result directly comparable with the stored `YYYY-MM-DD` as a string.
const studioDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: STUDIO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in the studio's time zone, as `YYYY-MM-DD`. */
export function todayInStudioTimeZone(): string {
  return studioDateFormat.format(new Date());
}

/** A real calendar date in `YYYY-MM-DD` form — not just the right shape. */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  // Date.UTC rolls 2026-02-30 over into March; a real date survives the trip.
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** "September 15, 2026" — the same for every reader, wherever they are. */
export function formatJournalDate(value: string): string {
  if (!isIsoDate(value)) {
    throw new Error(`Expected a YYYY-MM-DD date, received "${value}".`);
  }

  const [year, month, day] = value.split("-").map(Number);

  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/**
 * Whether a post dated `publishedAt` is visible on `today`. ISO dates order
 * correctly as strings, which is also what the GROQ predicate relies on.
 */
export function isLive(publishedAt: string, today: string): boolean {
  return publishedAt <= today;
}
