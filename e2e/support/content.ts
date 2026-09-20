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
 * A project with a photograph to open full-screen (J3, J4). Not "several" --
 * that precondition is `openProjectWithSeveralPhotographs`'s, above; this one
 * is the weaker "at least one", shared by both journeys that only ever open a
 * photograph and don't need to move between several.
 */
async function ensureProjectWithAPhotograph(page: Page) {
  projectWithAPhotograph ??= await findProjectHref(
    page,
    (count) => count >= 1,
    "even one photograph",
  );

  return projectWithAPhotograph;
}

/**
 * The standalone page of a project with a photograph to open full-screen
 * (J4). The first card cannot guarantee that -- an empty `images` array is a
 * permitted content state (see `openProjectWithSeveralPhotographs`) -- so this
 * shares `ensureProjectWithAPhotograph`'s search with the preview variant
 * below rather than assuming.
 */
export async function openProjectPageWithPhotograph(page: Page) {
  const href = await ensureProjectWithAPhotograph(page);

  await page.goto(href);

  return href;
}

/**
 * The preview of a project that has a photograph to open full-screen (J3).
 *
 * Distinct from `openFirstProjectPreview`: J7 (which uses that one) only ever
 * opens and closes the preview itself, so the first card is fine regardless of
 * its gallery. J3 opens a photograph *inside* the preview, which the first
 * card cannot guarantee.
 */
export async function openPreviewOfProjectWithPhotograph(page: Page) {
  const href = await ensureProjectWithAPhotograph(page);

  const cards = await openWorkIndex(page);

  await cards.locator(`a[href="${href}"]`).click();

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

/**
 * The journal index (spec 013), with whichever of its two states is showing:
 * the list of posts, or the editor's empty-state message.
 *
 * Both are legitimate. The day the journal ships the dataset has no post, and
 * `.husky/pre-push` runs this suite -- so a journey that required a post would
 * block every push for a content reason, the exact "test reporting on the
 * dataset" failure this file exists to prevent
 * (specs/013-journal-section/contracts/test-surface.md).
 */
export async function openJournalIndex(page: Page) {
  await page.goto("/journal");

  const cards = page.locator("[data-journal-card]");
  const empty = page.locator("[data-journal-empty]");

  await expect(
    cards.or(empty).first(),
    "the journal index should show either its posts or its empty state",
  ).toBeVisible();

  return { cards, empty };
}

/**
 * The first post's href in index order, or `null` when no post is live.
 * Journeys that need a post skip on `null`; they do not fail.
 */
export async function firstJournalPostHref(page: Page) {
  const { cards } = await openJournalIndex(page);

  if (!(await cards.count())) {
    return null;
  }

  return cards.first().getByRole("link").getAttribute("href");
}
