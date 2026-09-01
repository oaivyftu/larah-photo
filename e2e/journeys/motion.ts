import { expect, type Page } from "@playwright/test";
import { openWorkIndex } from "../support/content";
import {
  expectIntroStartState,
  expectPageContentAtRest,
  expectPointerLabelActive,
  expectPointerSnapsWithoutTrailing,
  glassPointer,
  watchIntroStartState,
} from "../support/observables";

/**
 * User Story 3: motion respects the visitor's stated preference.
 *
 * The unit suite can only reach the reduced-motion branches by replacing
 * `window.matchMedia`, which asserts that the code reads a preference, not that
 * the browser answers it. Here the preference is set on the browser context, so
 * `gsap.matchMedia()` in `usePageIntro` and the `(prefers-reduced-motion:
 * reduce)` branch in `GlassPointer` resolve as they would for a visitor who set
 * it in their operating system.
 *
 * J8 and J9 are the two journeys whose endings genuinely differ by preference,
 * so both are written out separately rather than shared. J9 first shipped
 * inside the shared wrapper with the same body for both variants -- the label
 * showing up was checked, but nothing distinguished "trailing follow enabled"
 * from "trailing follow disabled", so a `GlassPointer` regression that ignored
 * `prefers-reduced-motion` entirely would still have passed both halves.
 */

/** J8, default motion -- the entrance animation runs and completes (US3 AS3). */
export async function pageEntryAnimationCompletes(page: Page) {
  await watchIntroStartState(page);
  await page.goto("/about");

  // Both halves are needed, and the first earns its keep: the heading was
  // parked at opacity 0 when the page announced itself ready, which is only
  // true if a timeline was built -- delete the reveal and this reads "1". Then
  // it finishes at rest, which is the animation completing rather than
  // stalling half way.
  await expectIntroStartState(page, "0");
  await expectPageContentAtRest(page);
  await expect(
    page.locator("[data-page-heading]"),
    "the page heading should be on screen once the intro has run",
  ).toBeVisible();
}

/**
 * J8, reduced motion -- the content is there immediately (US3 AS1).
 *
 * This is the ending that catches a real regression. `usePageIntro` never builds
 * the timeline under `reduce`, so nothing is parked at `opacity: 0`. If that
 * guard breaks, a reduced-motion visitor gets a permanently invisible page --
 * and today nothing notices.
 */
export async function pageArrivesWithoutAnimation(page: Page) {
  await watchIntroStartState(page);
  await page.goto("/about");

  // Never parked: under `reduce` the timeline is not built at all, so the
  // heading was already at rest when the page announced itself ready. This is
  // what distinguishes the two variants by evidence rather than by the name on
  // the describe block -- and it fails loudly if the browser never actually
  // received the preference.
  await expectIntroStartState(page, "1");
  await expectPageContentAtRest(page);
}

/** J9, default motion -- hover a labelled target (US3 AS2, default half). */
export async function pointerLabelAppears(page: Page) {
  const cards = await openWorkIndex(page);
  const card = cards.first();

  await expect(
    glassPointer(page),
    "the pointer label should start inactive",
  ).not.toHaveAttribute("data-active", "");

  await card.hover();

  await expectPointerLabelActive(page, "View");
}

/**
 * J9, reduced motion -- the label appears, and the pill has no trailing
 * catch-up frame (US3 AS2, reduced half).
 *
 * A single move cannot show this: `GlassPointer` snaps to the pointer on the
 * very first move regardless of preference, specifically to avoid an initial
 * fly-in from the origin. The difference only appears on a *second* move,
 * which is why this journey moves the mouse twice rather than once.
 */
export async function pointerLabelAppearsWithoutTrailing(page: Page) {
  const cards = await openWorkIndex(page);
  const card = cards.first();
  const box = await card.boundingBox();

  expect(box, "the target card should have a bounding box").not.toBeNull();

  const firstPoint = {
    x: box!.x + box!.width / 3,
    y: box!.y + box!.height / 2,
  };
  const secondPoint = {
    x: box!.x + (box!.width * 2) / 3,
    y: box!.y + box!.height / 2,
  };

  await page.mouse.move(firstPoint.x, firstPoint.y);
  await expectPointerLabelActive(page, "View");

  await page.mouse.move(secondPoint.x, secondPoint.y);
  await expectPointerSnapsWithoutTrailing(page, secondPoint.x, secondPoint.y);
}
