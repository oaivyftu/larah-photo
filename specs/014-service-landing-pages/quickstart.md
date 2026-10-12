# Quickstart: Validating Service Landing Pages

**Feature**: 014-service-landing-pages | **Date**: 2026-10-07

A run-through that proves the feature works end to end: the gates, the Studio's
refusals, a page going live and going dark, and the launch pages. It validates
behaviour; the rules are in [contracts/](./contracts/) and the shapes in
[data-model.md](./data-model.md).

## Prerequisites

- `.env.local` with `NEXT_PUBLIC_SANITY_PROJECT_ID` and
  `NEXT_PUBLIC_SANITY_DATASET` (the dataset the Studio edits). Steps 4, 5, 7 and 8 need the
  **webhook** (`/api/revalidate`, `SANITY_REVALIDATE_SECRET`) deployed somewhere
  Sanity can reach; on a laptop, rely on the one-hour fallback or restart the
  server between edits.
- The **Service landing settings** document published (steps 3 onward need it
  the moment a page goes live; so do the services page and every project page).
  It is already in the production dataset; in another dataset, enter its eight
  fields in the Studio and Publish. Without it a live page raises a content error
  and, once any page is live, `/service` and every project page do too.
- Nothing here needs a write login: pages are made and edited in the Studio.
- At least one **service package** and one **work project** already published, as
  they are today.
- For steps 3–8, a throwaway page is fine: pick a slug you will delete.

## 1. The gates

```bash
npm run lint
npm run typecheck
npm test
npm run audit:design-system
npm run audit:css-diff
npm run build
PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e
```

**Expected:** every command exits 0. `audit:css-diff` is the one that proves the
two promotions (the shared call to action, and the shared package details) changed
nothing visible on the journal or the services page. `test:e2e` runs the landing
journeys, which **skip with a message** when the dataset has no live page; that is
a pass-with-skip, not a failure, until step 5 puts one live.

## 2. The static routes are unharmed (research §1)

With the build running (`npm run start`):

```bash
for p in / /work /service /about /contact /journal /sitemap.xml /robots.txt; do
  printf "%s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000$p"
done
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/no-such-page-xyz"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/wp-login.php"
```

**Expected:** every listed route `200`; the last two `404`. If `/work` returned
the landing page's 404, the dynamic segment is shadowing a static one and the
whole feature stops here. `wp-login.php` answering 404 without a CMS call is the
shape gate working (the server log shows no Sanity request for it).

## 3. The Studio shows the new types and refuses a thin page

Open `/studio`.

1. **Service landing page** and **Service landing settings** are in the list.
2. Create a landing page for the Engagement package: **Service name**
   `Engagement`, **Alternate name** `Pre-wedding`, **Project category**
   `Engagement`. Note the slug is offered as
   `engagement-photographer-london-ontario`.
3. Write a 20-word introduction, one section with a 10-word body, and two
   questions with 8-word answers. Fill the search title and description.
4. Try to **Publish**.

**Expected:** publishing is blocked, and the messages name each shortfall and by
how much, e.g. "The introduction has 20 words; it needs at least 50 (30 more)",
"The page has 1 section; it needs at least 3", "The page has 2 questions; it needs
at least 5", and the 400-word total. The Studio does not call the pieces "too
short" without saying how short.

5. Set **Published** on. **Expected:** refused: "Tick “Approved against the brief”
   before switching this page on."
6. Tick approval, type `[[CONFIRM: delivery time]]` somewhere in an answer, set
   **Published** on. **Expected:** refused, naming the field the marker is in.
7. Set the **slug** to `work`. **Expected:** refused as a reserved address. Set it
   to `Engagement_Page`. **Expected:** refused (lower-case letters, digits,
   hyphens only).
8. Create a **second** page for the same package. **Expected:** refused, naming the
   first page.
9. Type a category `Engagment` (typo). **Expected:** a _warning_, not an error:
   "No work project uses “Engagment”".

## 4. A complete page, switched off, exposes nothing (FR-002)

Complete the page to the minimums (use real-sounding text; at least 50-word
introduction, 3 sections of 60+ words, 5 questions with 30+ word answers, 400+
words in total). Replace any marker. Leave **Published** **off**. **Publish** the
document.

**Expected**, once the change has taken effect (webhook, or restart):

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/engagement-photographer-london-ontario   # 404
curl -s http://localhost:3000/sitemap.xml | grep -c engagement-photographer                              # 0
curl -s http://localhost:3000/service    | grep -c engagement-photographer                              # 0
```

and no project page links to it. The Studio list shows the page as **Held back**.

## 5. Switch it on: the page, both names, the data

Tick **Approved against the brief**, set **Published** on, **Publish**.

**Expected within a minute** (webhook) or an hour (fallback):

- `GET /engagement-photographer-london-ontario` → `200`. One `h1`:
  **Engagement & Pre-wedding Photographer in London, Ontario**.
- In order: introduction, the three (or more) sections, the Engagement projects
  (5 today), the package block with its **starting price**, the five (or more)
  questions with answers fully visible, and a call to action to `/contact`.
- The page text uses **both "engagement" and "pre-wedding"** in the heading, the
  introduction and at least one question.
- `view-source:` shows three landing JSON-LD blocks (`Service` with
  `alternateName: "Pre-wedding"` and a `provider` of `{ "@id": …#business }`,
  `FAQPage` with every question, `BreadcrumbList` Home › Services › the heading),
  plus the business block the shell emits.
- The `FAQPage` answer strings are identical to the visible answers.
- The sitemap lists the page with an image and a `lastmod`.
- `/service` shows a link on the Engagement package, labelled with the heading.
- A project whose category is Engagement shows a link to the page; a project in
  another category shows none.
- Paste the URL into the Rich Results Test or Schema Markup Validator:
  **0 errors**. (Whether a result is decorated is the search engine's choice.)

## 6. Both motion preferences, a keyboard, a screen reader

- In the browser, tab through the page: the skip link, the nav, each project card,
  the package's booking button, the call to action, in a sensible order, each
  with a visible focus ring. There is no control you cannot reach.
- With **reduced motion** on, reload: the page appears fully, with no heading
  reveal or staggered entrance (`npm run test:e2e -- --grep reduce` automates
  this).
- A screen reader announces one level-1 heading, level-2 headings for each
  section, the projects, the package and the questions, and level-3 for each
  question. Every image is announced by its alt text.

## 7. A brand-new slug goes live with no deploy (FR-009, SC-001)

This is the behaviour research §1 reasoned about but could not run.

1. Note the time. In the Studio, create a throwaway page for a **different**
   package/category with a slug that has never existed, e.g.
   `quickstart-test-photographer-london-ontario`. Complete it, approve, switch on,
   publish.
2. Request it immediately and repeat every few seconds:

```bash
until [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/quickstart-test-photographer-london-ontario)" = 200 ]; do sleep 5; done; date
```

**Expected:** `200` within about a minute, with **no deploy**. If it stays `404`
for up to an hour and then appears, a stale 404 was cached against the path:
the failure research §1 designed against (and the signal to revisit that
decision). Then **delete the throwaway page** and confirm its URL returns `404`
and the sitemap drops it.

## 8. Switch it off, rename it, remove it

- Set **Published** off, publish: the URL, the sitemap entry, the `/service` link
  and the project links all disappear.
- Change a live page's slug: the Studio warns first; afterwards the old URL is
  `404` and the new one `200`, with no redirect.
- Delete the page: everything above disappears.

## 9. The launch pages (FR-040, FR-041, SC-012, SC-013)

The four launch pages (Portrait, Engagement, Family, Graduation) were imported
once, switched off and unapproved, as `serviceLandingPage-portrait`,
`-engagement`, `-family` and `-graduation`, each pointing at its service package.
The import files were removed afterwards and remain in git history; the Studio is
the source from here.

**Ids must not contain a dot.** Sanity treats a dotted id (`a.b`, like
`drafts.<id>`) as private, readable only with a token. The site reads without
one, so a page with such an id would be saved, published and never seen.

**9a. Check they are held back.** Open the Studio. **Expected:** four pages, all
**Held back**, each with the `[[CONFIRM: …]]` markers still in its text. Visit
each URL: all `404`. None is in the sitemap, on `/service` or on a project page.

**9b. Go live, as the owner would.** For one page, replace each `[[CONFIRM]]` in
the Studio, read the page against its brief
([contracts/briefs/](./contracts/briefs/)), tick approval, switch on, publish.
**Expected:** live as in step 5. Try the same with a marker left in:
**Expected:** refused.

**9c. Check the page reads like this studio.** Places named are only ones the
studio really shoots, and nothing contradicts the package's price or inclusions.
Family and Graduation have only 2 projects each, so they may stay off until the
owner has enough to say.

## 10. Thin categories and no projects

- With the Family page live (2 projects): the page shows exactly those two
  projects, and every other section, with no gap or placeholder.
- Temporarily point a test page at a category no project uses: **Expected:** the
  projects section is simply absent and the page is otherwise complete, with the
  Studio having warned the editor when they chose it.

## Troubleshooting

| Symptom                                                             | Likely cause                                                                                                          |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| A page you published is `404`                                       | **Published** is off, the document is still a draft, or approval is unticked and the switch refused                   |
| The page throws instead of rendering                                | A required field is blank, the package is unpublished or has no price, or a `[[CONFIRM` remains                       |
| The sitemap errors                                                  | A live page is malformed (research §7). Fix the page; the sitemap is not skipping it on purpose                       |
| `/service` or a project page errors after a landing page was edited | The link summaries (research §6) found a malformed live page; same fix                                                |
| The heading says the wrong service                                  | `serviceName` or `headingPattern`; the package title is not used (research §8)                                        |
| A page is published and switched on but still `404` for visitors    | Its `_id` contains a dot, so anonymous reads cannot see it. Ids must be dot-free, e.g. `serviceLandingPage-<service>` |
| A change is not visible                                             | The webhook missed it; the hourly fallback applies (spec 007)                                                         |
