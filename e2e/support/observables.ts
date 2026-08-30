import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The vocabulary of endings, one function per row of the "How each state is
 * read" table in specs/012-browser-e2e-tests/contracts/test-surface.md.
 *
 * Two rules hold throughout, and both are requirements rather than taste:
 *
 *   - Selectors are role-and-name first, `data-*` identity attributes second,
 *     library-set global classes third. Never a CSS-module class name -- those
 *     are hashed in a production build, so `styles["...--visible"]` is not what
 *     is in the DOM.
 *   - No `page.waitForTimeout`. Every wait is a retrying assertion that names
 *     what it is waiting for, so a failure says what did not arrive rather than
 *     timing out anonymously (FR-005).
 */

/** The carousel region, named by the project it belongs to. */
export function carousel(page: Page) {
  return page.getByRole("region", { name: /image gallery$/ });
}

/** Flickity's own statement that it booted. Nothing else works until it has. */
export async function expectCarouselReady(page: Page) {
  await expect(
    carousel(page),
    "Flickity should have initialised the carousel",
  ).toHaveClass(/flickity-enabled/);
}

/**
 * Which photograph is on screen, as the carousel reports it: the accessible
 * name of the cell Flickity marked selected. Content-shaped but count-driven,
 * so a journey can assert movement without knowing what it is looking at.
 */
export async function selectedPhotograph(page: Page) {
  const selected = carousel(page).locator("figure.is-selected");

  await expect(
    selected,
    "exactly one slide should be marked selected",
  ).toHaveCount(1);

  return (await selected.getAttribute("aria-label")) ?? "";
}

/** The end state of J1 and J2: a different photograph, whichever it is. */
export async function expectPhotographChangedFrom(
  page: Page,
  previous: string,
) {
  await expect(
    carousel(page).locator("figure.is-selected"),
    `the photograph on screen should have changed from "${previous}"`,
  ).not.toHaveAttribute("aria-label", previous);
}

export function galleryControls(page: Page) {
  return page.locator("[data-gallery-controls]");
}

/**
 * The controls' visibility is opacity plus `pointer-events`, so this is the
 * difference between a control that works and one that does not -- not an
 * appearance question, and so not excluded by FR-009.
 */
export async function expectControlsVisible(page: Page) {
  await expect(
    galleryControls(page),
    "the gallery controls should be visible",
  ).toHaveCSS("opacity", "1");
}

export async function expectControlsReceded(page: Page) {
  await expect(
    galleryControls(page),
    "the gallery controls should have receded after the pointer went idle",
  ).toHaveCSS("opacity", "0");
}

/** The project preview, which J3 must find still open behind the lightbox. */
export function projectPreview(page: Page) {
  return page.locator("[data-work-modal]");
}

/**
 * The curtain lifted. `PageTransition` sets this on <html>, and a transition
 * that covers and never reveals is the failure this journey exists for.
 */
export async function expectNavigationSettled(page: Page) {
  await expect(
    page.locator("html"),
    "the page transition curtain should have lifted",
  ).toHaveAttribute("data-page-transition", "ready");
}

/**
 * Focus was moved into the page content by the navigation itself.
 *
 * `PageTransition` does this deliberately: Next leaves focus on `<body>` after
 * a client-side navigation, so without it a keyboard visitor resumes tabbing
 * from the top of the document with no signal that the page changed
 * (constitution Principle II).
 */
export async function expectFocusMovedToPageContent(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.activeElement?.id ?? document.activeElement?.tagName,
        ),
      { message: "the navigation should move focus into the page content" },
    )
    .toBe("main-content");
}

/**
 * Tab continues from the page content rather than restarting above it.
 *
 * Deliberately not "the next focused element is inside <main>": several pages
 * have no focusable element in their content at all, so the correct next stop
 * is the footer -- which is still continuing forwards. What must never happen
 * is landing back in the header, which is what "back at the top of the
 * document" means and what the missing focus call would cause.
 */
export async function expectTabContinuesFromPageContent(page: Page) {
  await page.keyboard.press("Tab");

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const active = document.activeElement;
          const main = document.getElementById("main-content");

          if (!active || active === document.body) return "lost to <body>";
          if (!main) return "no page content";
          if (active === main) return "continues";

          const position = main.compareDocumentPosition(active);
          const inside = Boolean(
            position & Node.DOCUMENT_POSITION_CONTAINED_BY,
          );
          const after = Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING);

          return inside || after ? "continues" : "restarted above the content";
        }),
      {
        message:
          "Tab should continue from the page content, not restart above it",
      },
    )
    .toBe("continues");
}

/**
 * The page arrived. `usePageIntro` parks the heading at `opacity: 0` until the
 * page is ready; the failure this guards is content that never becomes visible
 * at all, which is a can-the-visitor-see-it question rather than an appearance
 * one.
 */
export async function expectPageContentAtRest(page: Page) {
  await expect(
    page.locator("[data-page-heading] > span").first(),
    "the page heading should have arrived at its finished state",
  ).toHaveCSS("opacity", "1");
}

const INTRO_START_KEY = "__larahHeadingOpacityAtPageReady";

/**
 * Record what the heading's opacity was at the moment the page announced
 * itself ready. Must be called before `page.goto`.
 *
 * J8's first draft asserted only the finished state, and a finished state is
 * exactly what a page with no entrance animation has: delete the reveal and the
 * heading sits at opacity 1 from the start, so the test passed while proving
 * nothing. That is this feature's own failure mode -- a test that stays green
 * while the thing it names is gone -- so it needed an observable from *during*
 * the cycle rather than after it.
 *
 * `larah:page-ready` is that moment. `usePageIntro` parks the heading at its
 * `from` state (opacity 0) when it builds the timeline, and plays it in a
 * listener for that event. This listener is registered from an init script, so
 * it runs before the app's and sees the parked value:
 *
 *   - no-preference: "0" -- a timeline exists and has not played yet
 *   - reduce:        "1" -- no timeline was built, nothing was ever parked
 *
 * Which makes the two variants distinguishable by evidence rather than by the
 * label on the describe block.
 */
export async function watchIntroStartState(page: Page) {
  await page.addInitScript((key: string) => {
    const store = window as unknown as Record<string, string | undefined>;

    window.addEventListener("larah:page-ready", () => {
      // First cycle only; a later navigation must not overwrite it.
      if (store[key] !== undefined) {
        return;
      }

      const span = document.querySelector("[data-page-heading] > span");

      store[key] = span
        ? getComputedStyle(span).opacity
        : "no page heading found";
    });
  }, INTRO_START_KEY);
}

/** The value `watchIntroStartState` recorded. */
export async function expectIntroStartState(page: Page, expected: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          (key: string) =>
            (window as unknown as Record<string, string | undefined>)[key],
          INTRO_START_KEY,
        ),
      {
        message:
          expected === "0"
            ? "the heading should have been parked, ready to animate in"
            : "the heading should never have been parked under reduced motion",
      },
    )
    .toBe(expected);
}

export function glassPointer(page: Page) {
  return page.locator("[data-glass-pointer]");
}

export async function expectPointerLabelActive(page: Page, label: string) {
  await expect(
    glassPointer(page),
    `the pointer label should read "${label}"`,
  ).toHaveAttribute("data-active", "");
  await expect(glassPointer(page)).toContainText(label);
}

/** Used by J3: the lightbox stacked on top of the preview. */
export function lightbox(page: Page): Locator {
  return page.getByRole("dialog", { name: /gallery$/ });
}
