import { test, type Page } from "@playwright/test";

export type Journey = (page: Page) => Promise<void>;

/**
 * Run a set of journeys under both motion preferences (SC-004).
 *
 * A reduced-motion variant is the same journey with a different expected
 * ending, so the body is written once and called twice rather than copied --
 * the rule FR-007 applies to the app, applied to the suite itself.
 *
 * This exists as a helper rather than as a convention because of how the
 * convention fails. `test.use({ reducedMotion })` written at file scope applies
 * to every test in the file: all of them would run under `reduce`, the report
 * would still show two groups, and SC-004 would still read as satisfied. That
 * is a silent failure of exactly the requirement it is meant to prove. Here the
 * `test.use` is inside the describe by construction, so a spec file cannot get
 * it wrong.
 *
 * Journeys whose ending genuinely differs by preference -- J8, the page entry
 * animation -- do not use this and write their two endings out instead.
 */
export function underBothMotionPreferences(
  suite: string,
  journeys: Record<string, Journey>,
) {
  const entries = Object.entries(journeys);

  test.describe(suite, () => {
    for (const [name, journey] of entries) {
      test(name, ({ page }) => journey(page));
    }
  });

  // "reduce" in the title so quickstart.md scenario 6 can select this half with
  // `--grep "reduce"`.
  test.describe(`${suite} under reduce`, () => {
    // Under `contextOptions`, not as a top-level option. The top-level form is
    // what most examples show and it is out of date for this Playwright
    // version: it type-errors, and -- worse -- an unknown key here is ignored
    // at runtime rather than rejected, so the reduced-motion half would run
    // with motion fully on while the report still said "under reduce". The
    // version's own types are the source (constitution Principle VI, applied to
    // a dependency other than Next).
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    for (const [name, journey] of entries) {
      test(name, ({ page }) => journey(page));
    }
  });
}
