import { expect, test, type Page } from "@playwright/test";
import { firstJournalPostHref, openJournalIndex } from "../support/content";
import { expectNavigationSettled } from "../support/observables";

/**
 * Spec 013: the journal, in a real browser. What jsdom cannot show is the
 * real navigation from the index to a post and on to the contact page, and the
 * nav's current marking on a production build.
 *
 * The page transition and focus handling are not re-asserted here --
 * navigation.spec.ts owns those, and journal pages use the same shell.
 *
 * Nothing here names a slug, a title or any copy: every string on these pages
 * is the editor's (specs/013-journal-section/contracts/test-surface.md).
 */

const NO_POST =
  "No live journal post in the dataset -- publish one in Sanity to run this journey.";

async function requirePost(page: Page) {
  const href = await firstJournalPostHref(page);

  test.skip(href === null, NO_POST);

  return href as string;
}

/** The Journal item in the primary navigation, found by where it goes. */
function journalNavLink(page: Page) {
  return page
    .getByRole("navigation", { name: "Primary" })
    .locator('a[href="/journal"]');
}

/** A card's link opens that post (US3 AS1, US1). */
export async function indexOpensPost(page: Page) {
  const href = await requirePost(page);

  await page.locator("[data-journal-card]").first().getByRole("link").click();

  await expect(page, "the card should open its own post").toHaveURL(
    new RegExp(`${href}$`),
  );
  await expectNavigationSettled(page);
  await expect(
    page.locator("[data-journal-article]"),
    "the post body should be visible, not still behind the curtain",
  ).toBeVisible();
}

/** From the end of a post, the contact page is one activation away (FR-011, SC-006). */
export async function postLeadsToContact(page: Page) {
  const href = await requirePost(page);

  await page.goto(href);

  await page
    .locator("[data-journal-cta]")
    .locator('a[href="/contact"]')
    .click();

  await expect(
    page,
    "the call to action should reach the contact page",
  ).toHaveURL(/\/contact$/);
  await expectNavigationSettled(page);
}

/** The Journal nav item is current on the index and on a post (FR-024). */
export async function journalMarkedCurrent(page: Page) {
  const href = await requirePost(page);

  await openJournalIndex(page);

  test.skip(
    (await journalNavLink(page).count()) === 0,
    "Site settings have no Journal navigation item yet -- add one in Sanity.",
  );

  await expect(
    journalNavLink(page),
    "the Journal item should be current on the index",
  ).toHaveAttribute("aria-current", "page");

  await page.goto(href);

  await expect(
    journalNavLink(page),
    "the Journal item should stay current on a post",
  ).toHaveAttribute("aria-current", "page");
}

/** With nothing live, the index shows the editor's message and nothing breaks (FR-015). */
export async function emptyJournalRenders(page: Page) {
  const { cards, empty } = await openJournalIndex(page);

  test.skip(
    (await cards.count()) > 0,
    "The journal has live posts, so its empty state cannot be shown.",
  );

  await expect(
    empty,
    "an empty journal should show the editor's message",
  ).toBeVisible();
}
