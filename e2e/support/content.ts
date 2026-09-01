import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Content discovery, so no journey contains a slug, a title, or a count.
 *
 * Every string on this site comes from Sanity (constitution Principle I), which
 * means an editor can rename a project or reorder a gallery without touching
 * code. A test asserting `/work/coastal-morning` has six photographs is a test
 * that fails on an edit -- a failure that says nothing about the software. So
 * journeys ask the page what is there (spec 012 research.md §5).
 */

/** The work index, with its project cards. */
export async function openWorkIndex(page: Page) {
  await page.goto("/work");

  const cards = page.locator("[data-work-card]");

  await expect(
    cards.first(),
    "the work index should render at least one project card",
  ).toBeVisible();

  return cards;
}

/**
 * The standalone project page, reached by reading the first card's href rather
 * than by clicking it -- clicking opens the intercepting `@modal` route, which
 * is a different surface with its own journeys (J3, J7).
 */
export async function openFirstProjectPage(page: Page) {
  const cards = await openWorkIndex(page);
  const href = await cards.first().getByRole("link").getAttribute("href");

  expect(href, "the first project card should link to a project").toBeTruthy();

  await page.goto(href as string);

  return href as string;
}

/** Album items on a project page, one button per photograph. */
export function photographButtons(scope: Page | Locator) {
  return scope.getByRole("button", { name: /^Open image \d+:/ });
}

// Memoised for the run. Workers are 1 (playwright.config.ts), so the walk below
// is paid once and every later journey goes straight to the project it found.
let projectWithSeveralPhotographs: string | null = null;

/**
 * A project that actually has photographs to move between.
 *
 * Not "the first card": `workProject`'s `images` array carries no minimum in
 * `src/sanity/schemaTypes/workProject.ts`, so a project with one photograph --
 * or none -- is a permitted content state, and an editor reordering the index
 * could put one first tomorrow. The gallery journeys would then fail in setup
 * while gallery navigation worked perfectly, which is a test reporting on the
 * dataset rather than on the software.
 *
 * So the suite asks the site for a project that meets the precondition, and
 * says so plainly if the dataset has none. It checks every project on the
 * index, not a truncated prefix -- an early cap here just moves the same
 * content-order fragility further down the list rather than removing it: five
 * single-photograph projects placed first would still fail the search even
 * though a sixth qualifies. The dataset is small enough (dozens of projects,
 * not thousands) that walking all of it costs seconds, not minutes.
 */
export async function openProjectWithSeveralPhotographs(page: Page) {
  if (projectWithSeveralPhotographs) {
    await page.goto(projectWithSeveralPhotographs);

    return projectWithSeveralPhotographs;
  }

  await openWorkIndex(page);

  const hrefs = (
    await page
      .locator("[data-work-card] a[href]")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      )
  ).filter(Boolean);

  for (const href of hrefs) {
    await page.goto(href);

    if ((await photographButtons(page).count()) > 1) {
      projectWithSeveralPhotographs = href;

      return href;
    }
  }

  throw new Error(
    `None of the ${hrefs.length} projects on the work index has more than ` +
      "one photograph. The gallery journeys need one that does — add " +
      "photographs to a project in Sanity.",
  );
}

/** The project preview: click a card, let the intercepting route take over. */
export async function openFirstProjectPreview(page: Page) {
  const cards = await openWorkIndex(page);

  await cards.first().getByRole("link").click();

  const preview = page.locator("[data-work-modal]");

  await expect(
    preview,
    "clicking a project card should open the project preview",
  ).toBeVisible();

  return preview;
}

/**
 * Open a photograph full-screen from an album, which is what puts the carousel
 * on screen. `scope` is the album's container -- the page for J1/J2, the
 * preview dialog for J3.
 */
export async function openPhotographFullScreen(scope: Page | Locator) {
  const zoom = photographButtons(scope);

  await expect(
    zoom.first(),
    "the album should offer at least one photograph to open",
  ).toBeVisible();

  await zoom.first().click();
}

/**
 * How many photographs this project has, read from the gallery's own live
 * region ("Image 1 of 6") rather than from anything a test knows in advance.
 */
export async function readPosition(page: Page) {
  const status = page.getByText(/^Image \d+ of \d+$/);

  await expect(
    status,
    "the gallery should announce which photograph is showing",
  ).toBeAttached();

  const text = (await status.textContent()) ?? "";
  const [, current, total] = text.match(/^Image (\d+) of (\d+)$/) ?? [];

  return { current: Number(current), total: Number(total) };
}
