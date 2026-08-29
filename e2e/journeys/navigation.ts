import { expect, type Page } from "@playwright/test";
import { openFirstProjectPreview } from "../support/content";
import {
  expectFocusMovedToPageContent,
  expectNavigationSettled,
  expectTabContinuesFromPageContent,
  projectPreview,
} from "../support/observables";

/**
 * User Story 2: moving between pages still works, and still lands the keyboard
 * somewhere.
 *
 * The navigation interceptor's decision table is already covered without a
 * browser, and covered well. What is not is whether the curtain actually lifts
 * afterwards -- a transition that covers and never reveals leaves the site
 * looking dead, and nothing currently notices.
 */

/** J5 -- follow an internal link (US2 AS1, SC-003). */
export async function followInternalLink(page: Page) {
  await page.goto("/");

  const link = page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Work" });

  await link.click();

  await expect(page, "the destination route should be reached").toHaveURL(
    /\/work$/,
  );
  await expectNavigationSettled(page);
  await expect(
    page.locator("[data-page-heading]"),
    "the destination page should be visible, not still behind the curtain",
  ).toBeVisible();
}

/** J6 -- press Tab after a navigation (US2 AS2, SC-003). */
export async function focusLandsInPageContent(page: Page) {
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "About" })
    .click();

  await expect(page).toHaveURL(/\/about$/);
  await expectNavigationSettled(page);

  await expectFocusMovedToPageContent(page);
  await expectTabContinuesFromPageContent(page);
}

/**
 * J7 -- dismiss the project preview (US2 AS3).
 *
 * Distinct from J3 on purpose: same screen, different thing dismissed. Here the
 * visitor should land back on the index; in J3 they should not move at all.
 */
export async function dismissProjectPreview(page: Page) {
  await openFirstProjectPreview(page);

  await page.keyboard.press("Escape");

  await expect(
    projectPreview(page),
    "Escape should close the project preview",
  ).toBeHidden();
  await expect(
    page,
    "dismissing the preview should return to the work index",
  ).toHaveURL(/\/work$/);
  // Asserted on the page we landed on, not on a fresh visit to it -- calling
  // the index helper again would navigate there and prove nothing about where
  // Escape actually left us.
  await expect(
    page.locator("[data-work-card]").first(),
    "the work index should be showing its projects again",
  ).toBeVisible();
}
