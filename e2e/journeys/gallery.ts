import { expect, type Page } from "@playwright/test";
import {
  openPhotographFullScreen,
  openPreviewOfProjectWithPhotograph,
  openProjectPageWithPhotograph,
  openProjectWithSeveralPhotographs,
  readPosition,
} from "../support/content";
import { swipeHorizontally } from "../support/gestures";
import {
  carousel,
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

  // A fine pointer gets the crossfade, which is the mode this control exists
  // to drive -- there is no drag here to move a photograph with. `is-fade` is
  // flickity-fade's own statement that it is on.
  await expect(
    carousel(page),
    "a fine pointer should get the crossfading carousel",
  ).toHaveClass(/is-fade/);

  // Wake the controls first, the way a visitor reaching for them does. They
  // recede when the pointer idles (J4) and a receded nav is `pointer-events:
  // none`, so a click aimed at it lands on the photograph instead -- and the
  // reveal only fires on a pointer that actually moved, which a retried click
  // at unchanged coordinates is not.
  await page.mouse.move(400, 400);
  await page.mouse.move(420, 420);
  await expectControlsVisible(page);

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
 * J10 -- swipe to the next photograph on a touch device (US1 AS5, SC-009).
 *
 * What this proves, stated narrowly because it was measured rather than
 * assumed: a finger dragged across the photograph moves the gallery on, and the
 * carousel a coarse pointer gets is the sliding one rather than the crossfade.
 * Both fail if touch dragging is switched off or the modes are swapped.
 *
 * What it does not prove, and what was checked by reintroducing each bug and
 * watching this journey pass anyway:
 *
 *   - **Where the slider comes to rest.** `handleDragEnd` calls `select()`
 *     regardless, so the selected cell and the live region advance even when
 *     `freeScroll` leaves the slider itself parked between two photographs.
 *     Seeing that needs the slider's offset, and a transform is exactly what
 *     FR-009 rules out. `freeScroll: false` is asserted in the unit suite
 *     instead, and the visible result of getting it wrong -- the opacity pop at
 *     the end of a fade -- is a device check.
 *   - **The gesture surviving the browser.** Synthetic touch events dispatched
 *     through CDP do not reproduce a real scroll claiming the gesture, so this
 *     passes with `touch-action: pan-y` restored. That fix is verified on a
 *     device, not here.
 */
export async function swipeToNextPhotograph(page: Page) {
  await openProjectWithSeveralPhotographs(page);
  await openPhotographFullScreen(page);
  await expectCarouselReady(page);

  const { current: start, total } = await readPosition(page);

  expect(
    total,
    "this journey needs a project with several photographs",
  ).toBeGreaterThan(1);

  // A coarse pointer gets the sliding carousel, not the crossfade.
  await expect(
    carousel(page),
    "a touch device should get the sliding carousel",
  ).not.toHaveClass(/is-fade/);

  const before = await selectedPhotograph(page);
  const box = await carousel(page).boundingBox();

  // Right to left: forwards, the way the counter reads.
  await swipeHorizontally(page, carousel(page), {
    distance: -Math.round((box?.width ?? 320) * 0.6),
  });

  await expectPhotographChangedFrom(page, before);

  // The next photograph specifically, not merely a different one: a swipe that
  // flings several slides on is as wrong as one that does not move.
  const expected = start === total ? 1 : start + 1;

  await expect
    .poll(() => readPosition(page).then((position) => position.current), {
      message: `the swipe should settle on photograph ${expected}`,
    })
    .toBe(expected);
  await selectedPhotograph(page);
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
