import { expect, type Page } from "@playwright/test";
import {
  openPhotographFullScreen,
  openPreviewOfProjectWithPhotograph,
  openProjectPageWithPhotograph,
  openProjectWithSeveralPhotographs,
  readPosition,
} from "../support/content";
import {
  expectCarouselReady,
  expectControlsReceded,
  expectControlsVisible,
  expectPhotographChangedFrom,
  lightbox,
  projectPreview,
  selectedPhotograph,
} from "../support/observables";

/**
 * User Story 1: the gallery is proven to work, not proven to be called.
 *
 * The existing unit tests assert the contract between the app and Flickity.
 * They cannot assert that Flickity then does anything, because in a headless
 * DOM it does not -- which is how a test can pass while the gallery is broken.
 * These four journeys assert what a visitor would see instead.
 *
 * Journey bodies live here and are imported by the spec file, which runs each
 * under both motion preferences. One definition, two call sites -- the rule
 * FR-007 applies to the app, applied to the suite.
 */

/** J1 -- advance the gallery with the next control (US1 AS1, SC-001). */
export async function advanceWithControl(page: Page) {
  await openProjectWithSeveralPhotographs(page);
  await openPhotographFullScreen(page);
  await expectCarouselReady(page);

  const { total } = await readPosition(page);

  // A one-photograph project would make "the next photograph" meaningless.
  // Every project in the dataset today has several; if one ever does not, this
  // says so rather than failing on a missing control.
  expect(
    total,
    "this journey needs a project with several photographs",
  ).toBeGreaterThan(1);

  const before = await selectedPhotograph(page);

  await page.getByRole("button", { name: "Next image" }).click();

  await expectPhotographChangedFrom(page, before);
  await expect(
    page.getByText(/^Image 2 of \d+$/),
    "the gallery should announce the second photograph",
  ).toBeAttached();
}

/** J2 -- move the gallery with the arrow keys (US1 AS2, SC-001). */
export async function moveWithArrowKeys(page: Page) {
  await openProjectWithSeveralPhotographs(page);
  await openPhotographFullScreen(page);
  await expectCarouselReady(page);

  const { current: start, total } = await readPosition(page);

  expect(
    total,
    "this journey needs a project with several photographs",
  ).toBeGreaterThan(1);

  const first = await selectedPhotograph(page);

  // wrapAround is on (WorkProjectGalleryClient's Flickity options), so moving
  // right from the last slide wraps to the first rather than stalling.
  // "Moves in the pressed direction" only means something if the expected
  // index accounts for that.
  const nextIndex = start === total ? 1 : start + 1;

  await page.keyboard.press("ArrowRight");
  await expectPhotographChangedFrom(page, first);

  // Not just "a different photo" -- the specific one ArrowRight should have
  // produced. Swapping the ArrowLeft/ArrowRight handlers would still change
  // and return to the start with a change-only assertion; only checking the
  // actual index catches that (AS2 says "moves in that direction", not
  // merely "moves").
  await expect
    .poll(() => readPosition(page).then((p) => p.current), {
      message: `ArrowRight should advance to photograph ${nextIndex}`,
    })
    .toBe(nextIndex);

  const second = await selectedPhotograph(page);

  await page.keyboard.press("ArrowLeft");
  await expectPhotographChangedFrom(page, second);

  // ArrowLeft undoes the ArrowRight: from `nextIndex`, moving left always
  // returns to `start`, wraparound boundary included -- last-then-right wraps
  // to first, and first-then-left wraps back to last, correctly landing on
  // whichever slide `start` was.
  await expect
    .poll(() => readPosition(page).then((p) => p.current), {
      message: `ArrowLeft should move back to photograph ${start}`,
    })
    .toBe(start);
  await expect
    .poll(() => selectedPhotograph(page), {
      message: "pressing ArrowLeft should return to the previous photograph",
    })
    .toBe(first);
}

/**
 * J3 -- dismiss a photograph opened full-screen inside the project preview
 * (US1 AS3, SC-002).
 *
 * The nested case specifically, because it is where this fails: two dialogs are
 * stacked, and an Escape that closes both drops the visitor back to the work
 * index instead of the preview they were reading.
 */
export async function dismissFullScreenInsidePreview(page: Page) {
  const preview = await openPreviewOfProjectWithPhotograph(page);
  const projectUrl = page.url();

  await openPhotographFullScreen(preview);
  await expectCarouselReady(page);
  await expect(lightbox(page), "the lightbox should be open").toBeVisible();

  await page.keyboard.press("Escape");

  await expect(
    lightbox(page),
    "Escape should close the full-screen photograph",
  ).toBeHidden();
  await expect(
    projectPreview(page),
    "the project preview should still be open behind it",
  ).toBeVisible();
  expect(page.url(), "Escape should not have navigated anywhere").toBe(
    projectUrl,
  );
}

/** J4 -- the controls recede when the pointer idles, and return (US1 AS4). */
export async function controlsRecedeWhenPointerIdles(page: Page) {
  await openProjectPageWithPhotograph(page);
  await openPhotographFullScreen(page);
  await expectCarouselReady(page);

  // Wake them, so what follows is a transition rather than an initial state.
  await page.mouse.move(400, 400);
  await page.mouse.move(420, 420);
  await expectControlsVisible(page);

  // No sleep here: the idle timer is 1.6s and this waits for the state it
  // produces, with the config's 10s assertion timeout as the bound. Waiting for
  // a state with generous headroom is not the same as sleeping for a guessed
  // duration (research.md §12).
  await expectControlsReceded(page);

  await page.mouse.move(300, 300);
  await page.mouse.move(320, 320);
  await expectControlsVisible(page);
}
