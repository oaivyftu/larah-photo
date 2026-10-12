/**
 * The single definition of what a service landing page must contain and how
 * its address is shaped (spec 014, research.md §4). The Studio validators,
 * `assessLandingPageQuality`, the fetcher guards and the tests all read these,
 * so retuning a number moves every one of them together.
 *
 * The minimums are tunable defaults. They measure length, not quality — a page
 * can clear every one and still be poor — and are the owner's call to raise.
 *
 * No imports, on purpose: the Studio bundle loads this file and cannot read
 * the `@/` alias.
 */
export const LANDING_QUALITY = {
  /** Words across the whole introduction. */
  introMinWords: 50,
  /** Content sections on the page. */
  minSections: 3,
  /** Words in each section's body. */
  sectionMinWords: 60,
  /** Questions on the page. */
  minFaqs: 5,
  /** Words in each answer. */
  faqAnswerMinWords: 30,
  /** Editorial words in total: introduction, sections, questions and answers. */
  totalMinWords: 400,
} as const;

/**
 * Marks a fact only the studio can supply. The Studio refuses to switch a page
 * on while any text holds one, and the fetcher refuses to render one, so a
 * placeholder cannot reach a visitor (research.md §10).
 */
export const LANDING_CONFIRM_MARKER = "[[CONFIRM";

/** Lower-case letters and digits in hyphen-separated runs. */
export const LANDING_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** What follows the service name in the slug the Studio suggests. */
export const LANDING_SLUG_SUFFIX = "photographer-london-ontario";

/** The placeholders `headingPattern` must hold. */
export const HEADING_PLACEHOLDERS = {
  service: "{service}",
  city: "{city}",
} as const;
