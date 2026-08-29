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
  const zoom = scope.getByRole("button", { name: /^Open image \d+:/ });

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
