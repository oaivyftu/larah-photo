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

/**
 * Every project's href from the work index, in the order the index renders
 * them -- what the search functions below walk.
 */
async function allProjectHrefs(page: Page) {
  await openWorkIndex(page);

  return (
    await page
      .locator("[data-work-card] a[href]")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      )
  ).filter(Boolean);
}

/**
 * The first project (by index order) whose standalone page's photograph count
 * satisfies `predicate`, found by visiting each project page and counting.
 *
 * Not "the first card": `workProject`'s `images` array carries no minimum in
 * `src/sanity/schemaTypes/workProject.ts`, so a project with one photograph --
 * or none -- is a permitted content state, and an editor reordering the index
 * could put one first tomorrow. Whichever journey assumed otherwise would then
 * fail in setup while the behaviour it exists to test worked perfectly, which
 * is a test reporting on the dataset rather than on the software.
 *
 * Checks every project on the index, not a truncated prefix -- an early cap
 * here just moves the same content-order fragility further down the list
 * rather than removing it: five projects that fail `predicate` placed first
 * would still fail the search even though a sixth qualifies. The dataset is
 * small enough (dozens of projects, not thousands) that walking all of it
 * costs seconds, not minutes.
 */
async function findProjectHref(
  page: Page,
  predicate: (photographCount: number) => boolean,
  whatItNeeds: string,
) {
  const hrefs = await allProjectHrefs(page);

  for (const href of hrefs) {
    await page.goto(href);

    if (predicate(await photographButtons(page).count())) {
      return href;
    }
  }

  throw new Error(
    `None of the ${hrefs.length} projects on the work index has ${whatItNeeds}. ` +
      "Add photographs to a project in Sanity.",
  );
}

// Memoised for the run, one cache per precondition. Workers are 1
// (playwright.config.ts), so each search is paid once and every later journey
// needing the same precondition goes straight to the project already found.
let projectWithSeveralPhotographs: string | null = null;
let projectWithAPhotograph: string | null = null;

/** A project that actually has photographs to move between (J1, J2). */
export async function openProjectWithSeveralPhotographs(page: Page) {
  projectWithSeveralPhotographs ??= await findProjectHref(
    page,
    (count) => count > 1,
    "more than one photograph",
  );

  await page.goto(projectWithSeveralPhotographs);

  return projectWithSeveralPhotographs;
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
 * The preview of a project that has a photograph to open full-screen (J3).
 *
 * Distinct from `openFirstProjectPreview`: J7 (which uses that one) only ever
 * opens and closes the preview itself, so the first card is fine regardless of
 * its gallery. J3 opens a photograph *inside* the preview, which the first
 * card cannot guarantee -- the same precondition `openProjectWithSeveralPhotographs`
 * exists for, just needing one photograph rather than several.
 */
export async function openPreviewOfProjectWithPhotograph(page: Page) {
  projectWithAPhotograph ??= await findProjectHref(
    page,
    (count) => count >= 1,
    "even one photograph",
  );

  const cards = await openWorkIndex(page);

  await cards.locator(`a[href="${projectWithAPhotograph}"]`).click();

  const preview = page.locator("[data-work-modal]");

  await expect(
    preview,
    "clicking the project card should open the project preview",
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
