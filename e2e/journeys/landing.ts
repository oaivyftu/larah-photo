import { expect, test, type Page } from "@playwright/test";
import {
  firstLandingPageHref,
  landingPageHrefs,
  landingPageShowsProjects,
} from "../support/content";
import { expectNavigationSettled } from "../support/observables";

/**
 * Spec 014: the service landing pages, in a real browser. What jsdom cannot
 * show is the real navigation from the services page and from a project to a
 * landing page, the contact route, and the HTTP status of a 404 -- `notFound()`
 * answers 200 when the response is streamed (research.md F6), which only a
 * request to a running server can tell apart.
 *
 * Nothing here names a slug, a title or any copy: every string on these pages
 * is the editor's (specs/014-service-landing-pages/contracts/test-surface.md).
 */

const NO_PAGE =
  "No live service landing page in the dataset -- publish one in Sanity to run this journey.";

const NO_PAGE_WITH_PROJECTS =
  "No live service landing page shows a project -- publish a project in a page's category to run this journey.";

async function requirePage(page: Page) {
  const href = await firstLandingPageHref(page);

  test.skip(href === null, NO_PAGE);

  return href as string;
}

/** L1 -- from the services page, a package's link reaches its landing page (FR-027, FR-011, FR-035). */
export async function servicesLeadsToLandingPage(page: Page) {
  await requirePage(page);

  await page.locator("[data-landing-link]").first().click();

  await expectNavigationSettled(page);
  await expect(
    page.locator("[data-landing-page]"),
    "the landing page should be showing, not a 404 or the curtain",
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1 }),
    "a landing page has exactly one level-1 heading",
  ).toHaveCount(1);
}

/** L2 -- the call to action reaches the contact page (FR-018, SC-007). */
export async function landingLeadsToContact(page: Page) {
  const href = await requirePage(page);

  await page.goto(href);

  await page
    .locator("[data-landing-cta]")
    .locator('a[href="/contact"]')
    .click();

  await expect(
    page,
    "the call to action should reach the contact page",
  ).toHaveURL(/\/contact$/);
  await expectNavigationSettled(page);
}

/**
 * L3 -- a project card leads to its project, which leads back (FR-014, FR-028, SC-006).
 *
 * The card opens the project as a preview over the landing page (the work
 * index's intercepting route), and the preview deliberately carries no landing
 * link. Reloading lands on the project's own page, which does.
 */
export async function projectLeadsBackToLandingPage(page: Page) {
  const hrefs = await landingPageHrefs(page);

  test.skip(hrefs.length === 0, NO_PAGE);

  let landingHref: string | null = null;

  for (const href of hrefs) {
    if (await landingPageShowsProjects(page, href)) {
      landingHref = href;
      break;
    }
  }

  test.skip(landingHref === null, NO_PAGE_WITH_PROJECTS);

  await page.goto(landingHref as string);
  await page.locator("[data-work-card] a[href]").first().click();

  await expect(page, "the card should open its project").toHaveURL(
    /\/work\/[^/]+$/,
  );

  // Out of the preview and onto the project's own page.
  await page.reload();

  const back = page.locator("[data-landing-link]");

  await expect(
    back,
    "the project's own page should offer its landing page",
  ).toHaveCount(1);
  await back.click();

  await expect(
    page,
    "following the link should return to the landing page",
  ).toHaveURL(new RegExp(`${landingHref}$`));
  await expectNavigationSettled(page);
  await expect(page.locator("[data-landing-page]")).toBeVisible();
}

/** L4 -- the package and the questions are on the page (FR-016, FR-017). */
export async function packageAndQuestionsArePresent(page: Page) {
  const href = await requirePage(page);

  await page.goto(href);

  for (const [name, selector] of [
    ["package block", "[data-landing-package]"],
    ["questions", "[data-landing-faq]"],
  ] as const) {
    const section = page.locator(selector);

    await expect(section, `the ${name} should be on the page`).toBeVisible();
    await expect(
      section,
      `the ${name} should hold text, not an empty frame`,
    ).not.toBeEmpty();
    expect(
      ((await section.textContent()) ?? "").trim().length,
      `the ${name} should hold text`,
    ).toBeGreaterThan(0);
  }
}

/**
 * L5 -- a root path that is no landing page is a real 404, and the static
 * routes beside the dynamic segment still answer for themselves (FR-019,
 * research.md §1, F6).
 *
 * Needs no live page: the unknown slug is built at run time so it cannot
 * collide with one an editor creates later.
 */
export async function unknownRootPathIsA404(page: Page) {
  const unknown = await page.request.get(`/unknown-${Date.now()}`);

  expect(
    unknown.status(),
    "a well-formed address no landing page owns should be a 404, not a streamed 200",
  ).toBe(404);

  for (const path of ["/work", "/service", "/sitemap.xml"]) {
    const response = await page.request.get(path);

    expect(
      response.status(),
      `${path} should still answer for itself beside the landing route`,
    ).toBe(200);
  }
}
