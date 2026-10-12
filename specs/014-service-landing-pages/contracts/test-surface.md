# Contract: Test Surface

**Feature**: 014-service-landing-pages | **Date**: 2026-10-07

The handles the browser journeys reach into, and the rule for what they do when
the dataset has no landing page. Follows
[specs/012-browser-e2e-tests/contracts/test-surface.md](../../012-browser-e2e-tests/contracts/test-surface.md):
role and accessible name first, then a `data-*` **identity** attribute, never a
CSS-module class name, never a count, a slug or a piece of copy. Every string on
these pages is the editor's (Principle I), so a journey that named one would fail
on an edit rather than on a defect.

## Handles

### Already in the tree

| Handle                               | Element                                     | Read by |
| ------------------------------------ | ------------------------------------------- | ------- |
| `role="navigation"` name `"Primary"` | The primary nav                             | L1, L6  |
| `data-page-heading`                  | `PageHeading`, the landing `h1`             | L1      |
| `data-work-card`                     | A project card (reused on the landing page) | L3      |
| `data-active` on the glass pointer   | Pointer pill                                | none    |

### To be added — five identity hooks

| Handle                 | Element                                                         | Why                                                                                  |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `data-landing-page`    | The landing page's root                                         | Distinguishes the page from a 404 or a generic page without reading its text         |
| `data-landing-link`    | An inbound link to a landing page (services page, project page) | The only way to find a live page without naming a slug; they are a name, not a state |
| `data-landing-cta`     | The contact call-to-action section                              | Mirrors `data-journal-cta`                                                           |
| `data-landing-faq`     | The questions section                                           | Asserting "the answers are in the page" without matching copy                        |
| `data-landing-package` | The package block                                               | Asserting the price is present on the page                                           |

All five are names, true regardless of state, matching the convention
(`data-journal-cta`, `data-work-card`). None mirrors React state. None changes
rendering.

## Discovering a live page

No journey contains a slug. They ask the site, the way the journal journeys do
(`firstJournalPostHref`):

```text
firstLandingPageHref(page):
  open /service
  first [data-landing-link] → its href, else null
```

If it is `null` the journey is **skipped, not failed**, with the message
"No live service landing page in the dataset — publish one in Sanity to run this
journey." An empty dataset is a valid content state (the same rule `NO_POST`
applies to the journal), and the global setup already refuses to start when no
content source exists at all.

## Journeys — `e2e/landing.spec.ts`, `e2e/journeys/landing.ts`

Run under `underBothMotionPreferences("landing", …)`, so each also runs under
`reduce`.

| #   | Journey                                                                                                                                                                                   | Requirement             | Reads                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | From the services page, following a package's landing link reaches a page with `[data-landing-page]`, exactly one `h1`, and the navigation settled                                        | FR-027, FR-011, FR-035  | `data-landing-link`, `data-landing-page`, `getByRole("heading", { level: 1 })`, `expectNavigationSettled`                                           |
| L2  | On a landing page, the call to action reaches `/contact`                                                                                                                                  | FR-018, SC-007          | `[data-landing-cta] a[href="/contact"]`                                                                                                             |
| L3  | On a landing page that shows at least one project, opening a project card reaches its project page, which offers a `data-landing-link`, and following it returns to the same landing page | FR-014, FR-028, SC-006  | `data-work-card`, `data-landing-link`                                                                                                               |
| L4  | The package block and the questions are present and contain text on the page                                                                                                              | FR-016, FR-017          | `[data-landing-package]`, `[data-landing-faq]` (non-empty, not their copy)                                                                          |
| L5  | A well-shaped root path that is no landing page answers a real **404 status**, and `/work`, `/service` and `/sitemap.xml` still answer 200                                                | FR-019, research §1, F6 | `page.request.get()` status; the unknown slug is built at run time (`unknown-<timestamp>`) so it cannot collide with a page an editor later creates |

L3 skips (with its own message) when the first live landing page happens to show
no project, since a thin category is a valid state; it then tries the next live
page. L5 is the check that the dynamic route did not shadow a static one and
that `notFound()` returns 404 rather than a streamed 200.

The page-transition curtain and focus handling are **not** re-asserted here —
`navigation.spec.ts` owns those and landing pages use the same shell.

## What the browser cannot assert, and where it is checked instead

| Behaviour                                              | Why not a journey                                     | Where                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| A brand-new slug is live within a minute of publishing | Needs a live Studio, a write token and the webhook    | [quickstart.md](../quickstart.md), step 7                                 |
| Held-back page is absent from URL, sitemap, links      | A journey cannot create or hide a page in the dataset | Unit and integration tests with the fetchers mocked (plan.md, FR-037 map) |
| The Studio blocks a thin page                          | The Studio is not driven from Playwright              | Pure-function tests for the rules; quickstart step 2 for the wiring       |
| Rich results                                           | Needs a search engine                                 | Out of scope; SC-011 is a post-launch measure                             |

## Unit and integration handles (jsdom)

| Handle                                          | Test                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `data-landing-page`, `-package`, `-faq`, `-cta` | The page test awaits the Server Component and queries these          |
| `h1` count                                      | Exactly one on the landing page (FR-035)                             |
| `a[href="/contact"]` inside `-cta`              | FR-018                                                               |
| `a[href^="/work/"]` count inside the grid       | Equals the number of matching fixtures, including 0 → section absent |
