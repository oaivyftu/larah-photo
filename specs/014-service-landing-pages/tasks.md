---
description: "Task list for Service Landing Pages"
---

# Tasks: Service Landing Pages

**Input**: Design documents from `/specs/014-service-landing-pages/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included, and not optional here. FR-037 lists the required coverage, and
constitution Principle V names Sanity content-error handling as a critical flow.
The layers are in research.md §13. Within each phase, write the tests first and
watch them fail.

**Organization**: Grouped by user story. US1, US2 and US3 are all P1 in the spec.
US1 is first because it is the visible outcome and the MVP. Almost all of the
mechanism US2 and US3 rely on is built once in Phase 2, so **US2 is small and
mostly proof** (the alternate-name path is exercised end to end), and **US3 is
the Studio hardening** layered over the base schemas Phase 2 registers — the same
shape spec 013 used. US4 (P2) is the linking and sitemap. Launch content is its
own phase because it is a deliverable of the spec (FR-040, FR-041), not of any one
story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4, matching spec.md
- Paths are repo-relative; this is a single Next.js project

## Before you start

- Read `specs/014-service-landing-pages/plan.md` and the contract for whatever you
  are touching. `AGENTS.md` §1–5 still apply to every task: search
  `src/components/ui/` before writing UI, **zero literals** in `*.module.scss`,
  content from Sanity only. Consult `node_modules/next/dist/docs/` before using a
  Next.js API (Principle VI).
- **Anything the Studio loads must not import through `@/`.** The Sanity CLI
  bundler does not read the tsconfig alias (`journalPost.ts` imports relatively
  for this reason). That covers `src/constants/landingPage.ts`,
  `src/constants/reservedRoutes.ts`, `src/utils/wordCount.ts`,
  `src/utils/landingPageQuality.ts`, `src/utils/landingSlug.ts`,
  `src/utils/formatWorkCategory.ts` and `src/sanity/schemaTypes/landingValidation.ts`.
  Use relative imports there, including for `import type`. T011 holds a test that
  fails if one slips.
- **The build must not depend on the settings document when no page is live.**
  `getLandingPageLinks()` (T019) is called by the services page and by every
  project page, and `npm run build` prerenders all of them. It must return `[]`
  **without reading `serviceLandingSettings`** when there are no live pages, or
  `.husky/pre-push` fails until someone publishes the settings. Unlike the
  journal, there is no "publish this document first" task blocking the build.
- **The settings document must exist before any page is switched on.** Any live
  page needs `serviceLandingSettings`, and so do the services page and every
  project page once one page is live. T023 writes it and T024 publishes it in
  Phase 2, ahead of every task that puts a page live (T048, T060, T068). Nothing
  before T048 needs it, and with no live page the build does not read it.
- **Launch content (Phase 7) is written by Claude, not by the owner, and states
  nothing about the studio that is not in the CMS or the spec.** Every other fact
  is `[[CONFIRM: …]]` (research.md §10). Tasks marked **[Content — owner]** are
  the owner's to do in the Studio; an implementing agent must not do them for her.
- **Phase 7 cannot be finished without the live dataset** (no `.env.local` was
  available when this was planned). T069 and T070 need it; everything before them
  does not.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The modules everything else imports, and the pointer that lets the
next agent find this spec.

- [x] T001 [P] Create `src/constants/landingPage.ts` exporting `LANDING_QUALITY` (`introMinWords: 50`, `minSections: 3`, `sectionMinWords: 60`, `minFaqs: 5`, `faqAnswerMinWords: 30`, `totalMinWords: 400`) as a readonly object, `LANDING_CONFIRM_MARKER = "[[CONFIRM"`, `LANDING_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/`, `LANDING_SLUG_SUFFIX = "photographer-london-ontario"`, and `HEADING_PLACEHOLDERS = { service: "{service}", city: "{city}" }`. No imports at all. File comment: this is the single definition read by the Studio validators, `assessLandingPageQuality`, the fetcher guards and the tests (research.md §4), and the numbers are tunable defaults that measure length, not quality (spec Assumptions).
- [x] T002 [P] Create `src/constants/reservedRoutes.ts` exporting `RESERVED_ROOT_SEGMENTS = ["work", "service", "about", "contact", "journal", "studio", "api"] as const` and `isReservedRootSegment(value: string): boolean`. No imports. Comment that a drift test (T009) keeps this equal to the real top-level routes, and why: a static route always wins over `[landingSlug]`, so a landing page claiming one would silently never render (research.md §1).
- [x] T003 [P] Create `src/types/landing.ts` with `LandingFaq`, `LandingSection`, `LandingPageSummary`, `LandingPage`, `LandingPageLink`, `LandingPageSettings` exactly as data-model.md "TypeScript shapes". Reuse `ProjectImage` from `src/types/project.ts` and `ServicePackage` from `src/types/service.ts`.
- [x] T004 [P] Add a row to the spec table in `AGENTS.md` §1: `| Service landing pages | specs/014-service-landing-pages/ |`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The data spine — the pure utilities, both base schemas, the queries
with the shared live filter, the fetchers with their content-error guards — plus
the two components this feature is the second user of, and the shell variant.
Every story reads through these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for the foundation ⚠️ write first, watch them fail

- [x] T005 [P] Write `src/utils/wordCount.test.ts` for `countWords`: `"one two three"` is 3; leading, trailing, repeated and newline whitespace do not add words; `""` and `"   \n "` are 0; a token with no letter or digit (`—`, `&`, `•`, `...`) is not a word; `pre-wedding` is one word; `café` and a non-Latin word each count as one (the `\p{L}` rule); a number counts. Add `countParagraphsWords(["a b", "c"])` sums to 3.
- [x] T006 [P] Write `src/utils/landingHeading.test.ts`: `composeLandingHeading({ pattern: "{service} Photographer in {city}", serviceName: "Portrait", city: "London, Ontario" })` is `Portrait Photographer in London, Ontario`; with `serviceName: "Engagement"` and `alternateName: "Pre-wedding"` it is `Engagement & Pre-wedding Photographer in London, Ontario` — the editor's own casing is preserved, never title-cased; a blank or whitespace `alternateName` is ignored; a pattern missing `{service}` or `{city}` throws a clear error naming the placeholder; `headingWords(heading)` splits on single spaces and keeps `&` as its own word.
- [x] T007 [P] Write `src/utils/landingSlug.test.ts`: `isLandingSlug` accepts `engagement-photographer-london-ontario` and `a1`; rejects `Engagement`, `a_b`, `a b`, `-a`, `a-`, `a--b`, `sitemap.xml`, `wp-login.php`, `""`; `landingSlugProblem(slug)` returns `null` for a good slug, a "use lower-case letters, digits and hyphens" message for a malformed one, and a "is an existing page of the site" message for each `RESERVED_ROOT_SEGMENTS` entry; `suggestLandingSlug("Engagement")` is `engagement-photographer-london-ontario`, and `"Pre Wedding & Co."` slugifies to hyphens with no doubles or trailing hyphen.
- [x] T008 [P] Extend `src/utils/formatWorkCategory.test.ts` with `categoriesMatch`: `("Portrait", "portrait")`, `("Portrait ", "portrait")`, `("graduation", "Graduation")` and `("Family  Sessions", "family-sessions")` match; `("Portrait", "Portraits")` and `("", "portrait")` do not; it is idempotent on already-normalised input.
- [x] T009 [P] Write `src/constants/reservedRoutes.test.ts`, the drift guard: read the directory entries of `src/app` and `src/app/(site)` with `node:fs`, keep those that are real top-level URL segments — drop route groups `(…)`, parallel slots `@…`, dynamic `[…]`, files, and anything starting with `_` — and assert every remaining name is in `RESERVED_ROOT_SEGMENTS`. Assert the converse for `studio` and `api`. Guard the parser: the discovered set must be non-empty and contain `work`, so a regex matching nothing cannot pass vacuously. Failure message: "a new top-level route exists that an editor could claim as a landing-page slug and never see".
- [x] T010 [P] Extend `src/sanity/fetchers.test.ts` (mock `sanityClient.fetch` at the module boundary as the file already does). Cover, one assertion per row of the checklist: **`getLandingPageBySlug`** returns `null` when Sanity returns null, maps a complete page, and throws naming `serviceLandingPage("<slug>").<field>` for a missing/blank `serviceName`, `category`, `seoTitle`, `seoDescription`, a blank introduction paragraph, zero sections, a section with a blank heading or paragraph, zero questions, a question or answer that is blank, a malformed slug; throws on a `package` of `null` with the "missing or unpublished" message, and on a package with no price or no image; throws when any text field contains `[[CONFIRM`; maps a blank `alternateName` to `undefined`; passes `{ slug }` and the query contains the shared live filter. **`getLandingPages`** maps `{ slug, serviceName, alternateName, category, packageId, packageImage, updatedAt }`, throws on a missing `_updatedAt` or package image, and its query carries the same live filter. **`getLandingPageSettings`** throws on a null document, each blank field, and a `headingPattern` lacking `{service}` or `{city}`. **`getLandingPageLinks`** composes `heading` using `siteSettings.location` and the pattern, returns `[]` for no live pages **without calling the settings query** (assert the mock was not called with the settings query), and keys nothing by anything but `packageId`. **Parity:** the landing page's `package` equals the same package as returned by `getServices()` for identical input, and every existing `getServices` test still passes unchanged.
- [x] T011 [P] Write `src/sanity/schemaTypes/landingPage.test.ts` in the manner of `journalPost.test.ts`: `serviceLandingPage` declares `published` (boolean, initial `false`), `approvedAgainstBrief` (boolean, initial `false`), `package` (a **strong** reference — no `weak: true` — to `servicePackage`), `serviceName`, `alternateName`, `category`, `slug`, `introduction` (array of string), `sections` (array of an object with `heading` and `body`), `faqs` (array of an object with `question` and `answer`), `seoTitle`, `seoDescription`; `serviceLandingSettings` declares `headingPattern`, `projectsHeading`, `packageHeading`, `packageBookLabel`, `faqHeading`, `ctaHeading`, `ctaBody`, `ctaContactLabel`; both are in `schemaTypes`. Add the import guard from "Before you start": read the source of each Studio-loaded module and fail on any `from "@/` or `from '@/`.
- [x] T012 [P] Extend `src/utils/structuredData.test.ts` to pin the offer helper's contract before it is extracted: `buildServiceListSchema(services, "CAD")` output is asserted with `toEqual` against its current literal output (an `AggregateOffer` with `lowPrice`, `priceCurrency`, `availability`), so T025's refactor provably changes nothing.

### Implementation for the foundation

- [x] T013 [P] Implement `src/utils/wordCount.ts`: `countWords(text: string): number` (split on `/\s+/`, count tokens matching `/[\p{L}\p{N}]/u`) and `countParagraphsWords(paragraphs: string[])`. Relative-imports only; comment the counting rule where it is defined, since the Studio, the tests and the quickstart all depend on it agreeing. Makes T005 pass.
- [x] T014 [P] Implement `src/utils/landingHeading.ts`: `composeLandingHeading({ pattern, serviceName, alternateName, city })` and `headingWords(heading)`. The `" & "` joiner is a named constant in this file with a comment that it is punctuation between two editor-supplied names and not copy (research.md §8). Throw if the pattern lacks either placeholder. Makes T006 pass.
- [x] T015 [P] Implement `src/utils/landingSlug.ts`: `isLandingSlug`, `landingSlugProblem`, `suggestLandingSlug(serviceName)`, using `LANDING_SLUG_PATTERN`, `LANDING_SLUG_SUFFIX` and `isReservedRootSegment`. Relative imports only. Makes T007 pass.
- [x] T016 Add `categoriesMatch(a: string, b: string): boolean` to `src/utils/formatWorkCategory.ts` beside `normalizeWorkCategory`, with the comment that it is the one matcher shared by the landing page, the project-page link and the Studio's advisory (research.md §3). The file already has no imports; keep it that way. Makes T008 pass.
- [x] T017 Add to `src/sanity/queries.ts`: (a) extract the package projection into an exported `servicePackageFields` fragment and make `servicesQuery` use it, with **no change to its result**; (b) `liveLandingPageFilter` = `_type == "serviceLandingPage" && published == true && defined(slug.current)`, with the comment that every landing query is built from it so none can omit the rule, the same reason `liveJournalPostFilter` exists (research.md §2); (c) four queries built on it: `landingPagesQuery` (summaries: `_updatedAt`, `slug`, `serviceName`, `alternateName`, `category`, `"packageId": coalesce(package->id, package->_id)`, `"packageImage": package->image{${imageFields}}`, ordered by `serviceName asc`), `landingPageBySlugQuery` (everything in `LandingPage`, with `"package": package->{${servicePackageFields}}`, `sections[]{heading, body}`, `faqs[]{question, answer}`), `landingPageSlugsQuery`, and `landingSettingsQuery` (all eight settings fields).
- [x] T018 In `src/sanity/fetchers.ts`, extract the body of `getServices`' `.map` into an exported-for-the-module `mapSanityService(service, fieldPrefix)` and make `getServices` call it with `servicePackage[${index}]`. Behaviour, messages and order stay identical — T010's parity cases and the existing `getServices` tests are the proof. Depends on T017.
- [x] T019 In `src/sanity/fetchers.ts`, implement `getLandingPages()`, `getLandingPageBySlug(slug)`, `getLandingPageSlugs()`, `getLandingPageSettings()` and `getLandingPageLinks()`, plus `mapLandingPage(raw, fieldPrefix)`, following the journal fetchers exactly: `fetchSanity`, `requireDocument` / `requireString` / `requireStringArray` / `requireValue`, `resolveSanityImage`, and `mapSanityService` for the package. Guards per T010. A `package` of `null` throws `Sanity document "serviceLandingPage(\"<slug>\").package" is required — the service package it points to is missing or unpublished.` Reject any string field containing `LANDING_CONFIRM_MARKER`. Require **at least one** section and **at least one** question, not `LANDING_QUALITY`'s minimums (research.md §4b — missing data is loud, short data is the Studio's and the test's). Blank `alternateName` → `undefined` via the existing `optionalString`. `getLandingPageLinks()` calls `getLandingPages()`, returns `[]` immediately if empty, otherwise reads `getSiteSettings()` and `getLandingPageSettings()` and composes `heading` with `composeLandingHeading`. Depends on T003, T014, T017, T018. Makes T010 pass.
- [x] T020 [P] Create `src/sanity/schemaTypes/serviceLandingPage.ts` with every field in data-model.md, each with its type, `required` rule, defaults (`published: false`, `approvedAgainstBrief: false`) and a plain-language `description` taken from `contracts/content-model.md`. `package` is `type: "reference", to: [{ type: "servicePackage" }]` (strong). `slug` uses `options.source` as a function returning `suggestLandingSlug(doc.serviceName)`. `introduction` and section `body` are `array` of `string`; `answer` is `text`. Preview: title `serviceName`, subtitle `Live once published` when `published` is true and `Held back` otherwise. Relative imports only. The custom validators are US3 (T056, T057); this task is the shape. Depends on T001, T015. Makes T011 pass.
- [x] T021 [P] Create `src/sanity/schemaTypes/serviceLandingSettings.ts`: the eight required fields in data-model.md, `ctaBody` as `text`, preview title "Service landing settings", following `journalPage.ts`. Relative imports only. Makes T011 pass.
- [x] T022 Register `serviceLandingPage` and `serviceLandingSettings` in `src/sanity/schemaTypes/index.ts`: the settings next to the other page documents, the page next to `servicePackage` / `workProject`. Depends on T020, T021.
- [x] T023 [P] Create `content/service-landing-pages/settings.json` — the shared `serviceLandingSettings` document, written **now, not with the launch content**, because every page that goes live needs it: the throwaway pages in T048, T060 and T068, and, once any page is live, the services page and every project page too (see "Before you start"). `_id` and `_type` `serviceLandingSettings`; `headingPattern` `{service} Photographer in {city}`; and Claude-written `projectsHeading`, `packageHeading`, `packageBookLabel`, `faqHeading`, `ctaHeading`, `ctaBody`, `ctaContactLabel`. It states **no studio facts**, so it carries no `[[CONFIRM` markers; the owner may reword any of it later in the Studio. Depends on T021.
- [ ] T024 **[Content — owner or developer with a write login]** Publish the settings document: import just that file with `node -e 'console.log(JSON.stringify(require(require("path").resolve("content/service-landing-pages/settings.json"))))' | npx sanity dataset import - production --missing` (quickstart §9e explains the standard-input fallback), or, with no write login to hand, open `/studio`, enter the eight fields from the file by hand and **Publish**. Confirm the document is published and no field is empty. This is the journal's "publish the settings first" lesson (spec 013's T014): without it nothing that puts a page live can be checked, and from the moment any page is live every `npm run build` needs it. Not blocking T025–T047. Depends on T022, T023.
- [x] T025 Extract the `AggregateOffer` literal from `buildServiceListSchema` in `src/utils/structuredData.ts` into an exported `buildStartingPriceOffer(price, priceCurrency)` and use it in the list builder. T012's `toEqual` pins that the list's output is unchanged. Depends on T012.
- [x] T026 Add `"landing"` to the `PageShell` variant union in `src/components/layout/PageShell/PageShell.tsx`, mapped to `"/service"` in `activeHrefByVariant` with the comment that a landing page sits in the services section the way a project sits in work (research.md §12). Add `.page-shell__main--landing` to the shared variant selector list in `PageShell.module.scss`. Extend `src/components/layout/PageShell/PageShell.test.tsx`: with a nav item `{ href: "/service" }`, `variant="landing"` marks it `aria-current="page"`, and the nav's items are unchanged.

### Shared components promoted by this feature (Principle VII)

These two are the second use of existing markup, so the constitution requires
promotion. Each prior consumer becomes a call site of the shared version, and
neither may change visibly.

- [x] T027 In `src/styles/_tokens.scss`, rename the `--journal-cta-*` family (`heading-size`, `pad`, `gap`) to `--cta-*` and update every reader. Keep the values byte-for-byte. Search first: `grep -rn "journal-cta" src`. Depends on nothing else; do T028 in the same commit so no reader is left dangling.
- [x] T028 [P] Create `src/components/ui/CallToAction/CallToAction.tsx` and `CallToAction.module.scss`: props `heading`, `headingId`, `body`, `children` (the actions), `className`, and rest props spread onto the `section` (so `data-*` hooks pass through). Markup: `section[aria-labelledby]` → `h2#headingId`, `p`, `div` actions row. Styles move from `JournalCta.module.scss` using the `--cta-*` tokens (T027); the outer width and top margin stay with the caller, not here. Write `CallToAction.test.tsx`: heading is labelled by id, body renders, children render in the actions row, `className` and `data-*` pass through. Depends on T027.
- [x] T029 Make `src/components/journal/JournalCta/JournalCta.tsx` a thin wrapper over `CallToAction` that supplies its heading id, its two `Button`s and a `className` for the journal article's width and margin; keep `data-journal-cta` on the section. Delete the rules `CallToAction` now owns from `JournalCta.module.scss`, keeping only the journal-specific outer layout. The existing journal post page tests must pass unmodified. Depends on T028.
- [x] T030 [P] Create `src/components/service/ServicePackageDetails/ServicePackageDetails.tsx` and `ServicePackageDetails.module.scss`: props `features: string[]`, `price: number` and an optional `className`. It renders **one root `div`** containing the `ul` of features and the `div` with the "STARTING FROM" `span` and the `strong` `$${price}` — the same elements, in the same order, that the `service-row__details` cell contains in `ServiceExperience` today, so the DOM does not change. Move into this module the rules that describe the **contents** — `display: grid; gap` on the root, and the `ul`, `span` and `strong` rules from `.service-row__details` in `src/app/(site)/service/service.module.scss` (lines ~92–118), re-targeted at the component's own root class, using the same `--service-detail-*` tokens. **Leave the grid-placement rules** (`grid-column`, `min-height` in the `media-max` blocks) in `service.module.scss`; they describe where the cell sits on the services page. Write `ServicePackageDetails.test.tsx`: every feature listed, price shown with the label, `className` applied to the root. Do not rename the `STARTING FROM` string.
- [x] T031 Make `ServiceExperience` (`src/app/(site)/service/ServiceExperience.tsx`) render `<ServicePackageDetails className={styles["service-row__details"]} … />` in place of its inline details `div`, so the component's root **is** the grid cell and carries both classes. The `ServiceExperience` suite in `src/app/(site)/experiences.test.tsx` must pass unmodified. Depends on T030.
- [x] T032 Verify the two promotions changed nothing visible: commit or stage deliberately, then `npm run audit:design-system` (exit 0), `npm test`, and `npm run audit:css-diff` (exit 0 — note it stashes and builds; read its header first). Read the script's header first: it compares resolved declarations, but a moved rule changes its hashed class name, so confirm how it treats that. If it reports a difference, find out whether it is a renamed selector with identical declarations (acceptable; note it) or a changed value (a defect — fix the new modules, not the baseline). If the tool cannot tell the two apart, compare `/service` and a journal post at three widths by screenshot instead and record that you did. Depends on T029, T031.

**Checkpoint**: `npm test` passes, including T005–T012 and the unmodified journal and services suites. `npm run typecheck` and `npm run audit:design-system` pass. The Studio lists both new document types (open `/studio`). `npm run build` still succeeds with **no** landing documents in the dataset. The settings document is published (T024) — or T024 is explicitly outstanding and T048, T060 and T068 are not started.

---

## Phase 3: User Story 1 — Land on a page about exactly the service I searched for (Priority: P1) 🎯 MVP

**Goal**: A live landing page has its own page at `/<slug>`: one `h1` naming the
service and the city, the introduction, the content sections, the matching
projects (or none), the package with its starting price, every question and
answer, a call to action to `/contact`, its own metadata, `Service` / `FAQPage` /
breadcrumb structured data, and a 404 for anything that is not a live page.

**Independent Test**: With one complete page switched on in the dataset, request
`/<slug>` directly and confirm every section renders in order, the metadata and
JSON-LD describe that service, the call to action reaches `/contact` in one
activation, a category with two projects shows two, and `/no-such-slug` is a real
404 with `noindex` (quickstart §2 and §5, without the alternate-name checks).

### Tests for User Story 1 ⚠️ write first, watch them fail

- [x] T033 [P] [US1] Extend `src/utils/structuredData.test.ts` for `buildLandingServiceSchema(page, location, currency)` and `buildLandingFaqSchema(page)`: `Service` has `@id` `<url>#service`, `name` and `serviceType` equal to `serviceName`, `description` equal to the introduction paragraphs joined by a space, `url`, `image` equal to the package image, `areaServed` equal to the location, `provider` equal to exactly `{ "@id": businessId }` (the business is not restated), and `offers` equal to `buildStartingPriceOffer(package.price, currency)`; no key holds `undefined` or `""`. `FAQPage` has one `Question` per FAQ in order, and each `acceptedAnswer.text` is **identical** to the answer string given.
- [x] T034 [P] [US1] Write `src/components/landing/LandingFaq/LandingFaq.test.tsx`: a `section` labelled by its heading, `data-landing-faq`, one `h3` per question and one paragraph per answer, **every answer present in the DOM without any interaction**, in the editor's order; no `details`, no `button` (research.md §9).
- [x] T035 [P] [US1] Write `src/components/landing/LandingProjects/LandingProjects.test.tsx`: given two projects it renders two cards each linking to `/work/<slug>`; given none it renders **nothing** (no heading, no empty frame); the section is labelled by the settings heading.
- [x] T036 [P] [US1] Write `src/components/landing/LandingPackage/LandingPackage.test.tsx`: `data-landing-package`, the package title as a heading, description, every feature, the starting price with its label (via `ServicePackageDetails`), the image with the editor's alt text, and the booking button pointing at the package's own `ctaHref` with the text it is **given as a prop** (assert the rendered text equals the prop, and that the component source contains no `Book now` literal).
- [x] T037 [P] [US1] Write `src/components/landing/LandingSections/LandingSections.test.tsx` and `src/components/landing/LandingCta/LandingCta.test.tsx`: sections render an `h2` and paragraphs each, in order, with no `h1`; the call to action uses the settings wording, carries `data-landing-cta`, and has an `a[href="/contact"]`.
- [x] T038 [P] [US1] Write `src/app/(site)/[landingSlug]/page.test.tsx` in the style of `src/app/(site)/work/[slug]/page.test.tsx` (call the Server Component, await it, assert on the result; mock `@/sanity/fetchers`, `next/navigation` with a `notFound` that **throws**, and `PageShell` as a passthrough that records its variant). Cover: a live page renders `data-landing-page` with exactly one `h1` and the sections, projects, package, questions and call to action **in that order**; `PageShell` is asked for `"landing"`; **the package's booking button shows the settings `packageBookLabel`,** **two matching projects show two cards, none shows no projects section, and the rest of the page is intact** (FR-014, FR-015, SC-005); a project whose category differs only in case or spacing still matches; **a shape-invalid segment (`wp-login.php`, `Foo`, `a_b`) and a reserved segment call `notFound()` without calling any fetcher** (assert the mocks were not called); a well-shaped unknown slug (`getLandingPageBySlug` → `null`) calls `notFound()` and does not read the settings; a content error from the fetcher propagates; **the editor's words are the larger share** — at a fixture built to exactly `LANDING_QUALITY`'s minimums, the words in the introduction, sections and questions exceed the words in the package title, description and features (FR-042); `generateMetadata` returns the page's `seoTitle` / `seoDescription`, canonical `/<slug>`, and the package image as the OG image, and `{ title: "Page not found", robots: { index: false } }` for an unknown slug; the output includes `Service`, `FAQPage` and a Home › Services › heading breadcrumb; `generateStaticParams` returns the live slugs.

### Implementation for User Story 1

- [x] T039 [US1] Add the page's semantic tokens to `src/styles/_tokens.scss` under a `--landing-*` family: header padding, intro/section text measure, section stack gap, section heading and body sizes **each paired with a leading** (`--landing-section-heading-size` / `-leading`; `--landing-body-size` / `-leading`), projects grid gap and columns, package block spacing, FAQ item gap and question size/leading, CTA outer spacing. Reuse scale-tier tokens where the same value recurs for the same reason; never name a token after its value (`AGENTS.md` §3).
- [x] T040 [P] [US1] Implement `buildLandingServiceSchema` and `buildLandingFaqSchema` in `src/utils/structuredData.ts` beside `buildServiceListSchema`, using `compact()`, `businessId`, `absoluteUrl` and `buildStartingPriceOffer` (T025). Makes T033 pass. Depends on T025.
- [x] T041 [P] [US1] Create `src/components/landing/LandingSections/` (`.tsx` + `.module.scss`): for each section an `h2` and its paragraphs; no `data-` hook needed beyond a plain wrapper. Makes the sections half of T037 pass. Depends on T039.
- [x] T042 [P] [US1] Create `src/components/landing/LandingFaq/`: `section[aria-labelledby]` with `h2` (the settings `faqHeading`) and, per item, an `h3` question and a `p` answer inside a `div`; **always open, no disclosure widget**; set `data-landing-faq`. Makes T034 pass. Depends on T039.
- [x] T043 [P] [US1] Create `src/components/landing/LandingProjects/`: returns `null` for an empty list; otherwise a `section[aria-labelledby]` with the settings `projectsHeading` and a plain CSS grid (`ul`/`li`) of `WorkCard variant="work"` from `src/components/work/WorkCard/WorkCard.tsx`. Do **not** use `WorkMasonryGrid` (it brings Isotope and the work filter's classes). Check `WorkCard.module.scss` for width assumptions and size the grid cells with `--landing-*` tokens rather than editing the card. Makes T035 pass. Depends on T039.
- [x] T044 [P] [US1] Create `src/components/landing/LandingPackage/`: `section[aria-labelledby]` with the settings `packageHeading`, the package title, description, image through `LarahImage` (alt from the package; `loading` lazy — it is below the fold), `ServicePackageDetails` (T030), and a `Button href={package.ctaHref}` whose text is a `bookLabel` prop — the settings `packageBookLabel`; **no string literal** in this component (Principle I; research.md §12). `ServiceExperience` and `HomeExperience` keep their own existing "Book now" literals: changing them is out of scope. Set `data-landing-package`. Makes T036 pass. Depends on T030, T039.
- [x] T045 [P] [US1] Create `src/components/landing/LandingCta/`: a wrapper over `CallToAction` (T028) supplying the settings heading/body, a `Button href="/contact" size="medium" withIcon` with the settings `ctaContactLabel`, and `data-landing-cta`. `/contact` is structure and stays in code. Makes the CTA half of T037 pass. Depends on T028.
- [x] T046 [US1] Create `src/app/(site)/[landingSlug]/LandingExperience.tsx` (`"use client"`) as a thin wrapper like `JournalPostClient.tsx`: renders a root `div[data-landing-page]` with the ref from `usePageIntro` and `children`; the intro tweens stagger `[data-landing-section]` elements and add **no new motion constant** (Principle IV). Create `landing.module.scss` using `--landing-*` tokens and `media-max` / `media-min` mixins only. Under reduced motion `usePageIntro` builds no timeline, so everything is visible (FR-033). Depends on T039.
- [x] T047 [US1] Create `src/app/(site)/[landingSlug]/page.tsx`: `generateMetadata`, `generateStaticParams` (live slugs via `getLandingPageSlugs`), and the page. In order: `await params`; if `!isLandingSlug(slug) || isReservedRootSegment(slug)` call `notFound()` **before any fetch**; `getLandingPageBySlug(slug)`; `null` → `notFound()`; then `Promise.all` of `getLandingPageSettings()`, `getSiteSettings()`, `getWorkProjects()`; compose the heading; filter projects with `categoriesMatch`. Render `PageShell variant="landing"` containing the three `JsonLd` blocks (`buildLandingServiceSchema`, `buildLandingFaqSchema`, `buildBreadcrumbSchema` Home › Services › heading) and `LandingExperience` wrapping `PageHeading` (words from `headingWords`, `id`) → introduction paragraphs → `LandingSections` → `LandingProjects` → `LandingPackage` (passing `settings.packageBookLabel`) → `LandingFaq` → `LandingCta`. **The order lives here, in one place** (research.md §9). Leave `dynamicParams` at its default and say why in a comment (FR-009, research.md §1). The metadata for a missing page returns the `index: false` fallback. Makes T038 pass. Depends on T014–T016, T019, T026, T040–T046.
- [x] T048 [US1] Verify in a browser (`npm run dev`): create a throwaway landing page in the Studio at the base-schema level (T020 — no validators yet), publish it with the switch on, and walk quickstart §5 except the alternate-name lines. Confirm in particular that `/work`, `/service` and `/sitemap.xml` still render their own pages and `/no-such-page-xyz` is a 404 (quickstart §2) — the framework-precedence claim research.md §1 could not verify. Then `npm run build` and confirm `/[landingSlug]` appears in the route table. Delete the throwaway page. Depends on T047 and T024 (the page cannot render without the settings).

**Checkpoint**: A page published in the dataset renders, is correctly described to search engines, and 404s correctly. US1 is shippable on its own: a page can rank before the services page links to it.

---

## Phase 4: User Story 2 — Find the Engagement page by searching either "engagement" or "pre-wedding" (Priority: P1)

**Goal**: The alternate name is recorded in the Studio, shown in the heading, declared in the `Service` data, removable, and never creates a second page. The mechanism was built in Phase 2 and Phase 3; this phase proves it end to end and closes the gaps only an alternate-name test would find.

**Independent Test**: With "Pre-wedding" as the Engagement page's alternate name, the heading, introduction, a question, the title and the description use both names, the `Service` data names "Pre-wedding" as `alternateName`, and `/pre-wedding-photographer-london-ontario` is a 404 (quickstart §5; the six-place check on real content is in Phase 7).

### Tests for User Story 2 ⚠️ write first, watch them fail

- [x] T049 [P] [US2] Extend `src/app/(site)/[landingSlug]/page.test.tsx`: with `alternateName: "Pre-wedding"` the `h1`'s accessible name is `Engagement & Pre-wedding Photographer in London, Ontario` — assert the alternate name appears in the visible heading text **and** as its own word (`&` and the alternate name are separate `span`s, with the full string in `aria-label`); with it unset the heading has no `&`; with a whitespace-only value it is treated as unset; **removing** it changes the heading and the structured data together, because they read one field (FR-013).
- [x] T050 [P] [US2] Extend `src/utils/structuredData.test.ts`: `Service.alternateName` equals the field when set and the key is **absent** (not `""`, not `undefined`) when unset or blank.
- [x] T051 [P] [US2] Extend the page test: with `getLandingPageBySlug` returning `null` for `pre-wedding-photographer-london-ontario` (no page owns that slug), `notFound()` is called — the Engagement page is the only page for both names, and no alias is created (spec scenario 6). Also assert the Engagement page's own metadata and breadcrumb name carry the composed heading.

### Implementation for User Story 2

- [x] T052 [US2] Make T049–T051 pass, changing only what a failing test names. Expected small fixes: `headingWords` keeping `&` as a word; `PageHeading` receiving the full `aria-label`; ensuring the schema builder and the heading both read `page.alternateName` (one field, one source — research.md §8). Do not add a second field or a separate "also known as" element.
- [x] T053 [US2] Verify in a browser: with an Engagement page carrying "Pre-wedding", confirm quickstart §5's both-names lines — heading, `view-source:` `Service.alternateName`, and that removing the alternate name in the Studio removes it from both after the refresh.

**Checkpoint**: The alternate name works for any service, not only Engagement, with no code change.

---

## Phase 5: User Story 3 — Add, hold back, edit and remove a page from the Studio (Priority: P1)

**Goal**: The Studio refuses a thin, unapproved, unfinished, colliding or duplicate page, advises on the rest, shows which pages are held back, and every rule is the same pure function the tests run.

**Independent Test**: Quickstart §3 and §4: try to publish a thin page and read each shortfall; try to switch on without approval and with a `[[CONFIRM`; try a reserved slug and a second page for one package; confirm a complete page switched off exposes nothing.

### Tests for User Story 3 ⚠️ write first, watch them fail

- [x] T054 [P] [US3] Write `src/utils/landingPageQuality.test.ts` for `assessLandingPageQuality(content)`, computing every boundary from `LANDING_QUALITY` so retuning a number moves the tests: the introduction at exactly `introMinWords` passes, one under fails with a message naming the count and the shortfall (`"The introduction has 49 words; it needs at least 50 (1 more)."`); the same boundary pair for a section body, an FAQ answer, the section count, the question count and the total; a field of whitespace or lone punctuation counts as zero; the **total** counts introduction + section headings and bodies + questions and answers and **excludes** the package and the search fields; a page that passes each part but totals under the minimum fails only the total; a fully compliant page returns an empty list; each shortfall carries the `path` of the field it concerns.
- [x] T055 [P] [US3] Write `src/sanity/schemaTypes/landingValidation.test.ts` for the validator factories with a **fake validation context** (`getClient` returning a stub whose `fetch` is a `vi.fn`; `document`, `path`): package uniqueness errors when another page (excluding this one's draft and published ids) has the same `_ref`, and passes otherwise; category uniqueness uses `categoriesMatch` (`Portrait ` vs `portrait` collide); slug validator returns the reserved and malformed messages and `true` for a good slug; the slug-changed advisory is a **warning** only when a published document exists with a different slug, and passes for a first publish; the no-matching-project advisory is a warning, not an error; the `published` validator errors with the approval message when `approvedAgainstBrief` is false, errors naming each field when any text contains `LANDING_CONFIRM_MARKER`, and passes when `published` is false regardless; the heading-pattern validator errors unless both placeholders are present.

### Implementation for User Story 3

- [x] T056 [P] [US3] Implement `src/utils/landingPageQuality.ts`: `assessLandingPageQuality({ introduction, sections, faqs })` returning `{ path, message }[]` using `countWords`, `countParagraphsWords` and `LANDING_QUALITY`; and `findConfirmMarkers(document)` returning the field names that contain `LANDING_CONFIRM_MARKER`. Pure; relative imports only. Makes T054 pass.
- [x] T057 [US3] Implement `src/sanity/schemaTypes/landingValidation.ts`: validator factories that take Sanity's validation `context` and call the pure functions — `packageIsUnique`, `categoryIsUnique`, `slugIsValid`, `slugChangeWarning`, `categoryMatchesProject` (warning), `publishedNeedsApprovalAndNoMarkers`, `headingPatternIsValid`, and the field-level word checks. Level is set by the caller (`.error()` / `.warning()`), as `journalPost` does. Exclude both ids of the current document (`_id` and the `drafts.` counterpart) from every uniqueness query. Use the `path` prop of `ValidationError`, not the deprecated `paths`. Relative imports only. Makes T055 pass. Depends on T015, T016, T056.
- [x] T058 [US3] Wire the validators into `src/sanity/schemaTypes/serviceLandingPage.ts` exactly as `contracts/content-model.md` specifies: the blocking rules (required fields, package and category uniqueness, slug, `rule.min(3)` sections, `rule.min(5)` questions, per-field word checks, the **document-level** total-400 check returning a `ValidationError` with `path: ["introduction"]`, the `published` gate) and the advisories (`.max(60).warning()`, `.max(160).warning()`, category matches no project, slug changed). Use the help texts and message shapes in that contract verbatim. Depends on T020, T057.
- [x] T059 [P] [US3] Wire `headingPatternIsValid` into `src/sanity/schemaTypes/serviceLandingSettings.ts` with the help text "e.g. {service} Photographer in {city}". Depends on T021, T057.
- [ ] T060 [US3] Walk quickstart §3 and §4 in the Studio (`npm run dev`, `/studio`). Confirm each blocking message names the shortfall and its size, each advisory warns without blocking, the list preview reads **Held back** / **Live once published**, and a complete page switched off returns `404` at its URL with no sitemap entry, no services-page link and no project link (the last three are checked again in T068 once US4 lands). Record any message wording that reads badly and fix it in `landingValidation.ts`. Switching a page on needs T024.

**Checkpoint**: A thin page cannot be published by accident. The editor adds, edits, holds back and removes pages with no code change.

---

## Phase 6: User Story 4 — Reach every landing page from within the site (Priority: P2)

**Goal**: Every live page is in the sitemap, linked from its package on the services page, and linked from each project in its category; a held-back page appears in none of them; the services page is otherwise unchanged.

**Independent Test**: With two pages live and one switched off, open the services page and a project in each of the three situations (live category, held-back category, no page at all): links appear only for the live ones. Fetch the sitemap: only live pages are listed (quickstart §5, §8).

### Tests for User Story 4 ⚠️ write first, watch them fail

- [x] T061 [P] [US4] Extend the `sitemap` suite in `src/app/seo-routes.test.ts` (add `getLandingPages` to the mocked `@/sanity/fetchers`): each live page appears at `https://…/<slug>` with `lastModified` equal to its `updatedAt` and `images` equal to `[packageImage.src]`; a page absent from `getLandingPages()` (held back) is absent; the three existing groups are unchanged; **a rejecting `getLandingPages()` makes the sitemap reject** — it must not be caught or skipped (research.md §7).
- [x] T062 [P] [US4] Extend the `ServiceExperience` suite in `src/app/(site)/experiences.test.tsx`: given `landingLinks` keyed by a package's id, that package renders an `a[href="/<slug>"]` carrying `data-landing-link` with the heading as its text; a package with no entry renders **exactly** the markup it renders today (assert the rendered HTML equals a render with no `landingLinks` for that row); the link text is never a generic "learn more".
- [x] T063 [P] [US4] Extend `src/app/(site)/work/[slug]/page.test.tsx`: a project whose category matches a link (`categoriesMatch`, including `Graduation ` vs `graduation`) passes `landingLink` to the gallery; a project matching none passes none and does not error; the page still calls `notFound()` for an unknown project; with `getLandingPageLinks()` returning `[]` nothing changes.
- [x] T064 [P] [US4] Extend `src/components/work/WorkDetailGallery/WorkDetailGallery.test.tsx`: with `landingLink` and `presentation="page"` it renders `a[href]` with `data-landing-link`; with `presentation="modal"` it renders **no** landing link (spec Assumptions: the overlay is not required to carry it); without `landingLink` nothing is added.

### Implementation for User Story 4

- [x] T065 [US4] In `src/app/sitemap.ts`, add `getLandingPages()` to the existing `Promise.all`, and a `landingRoutes` group: `{ url: absoluteUrl("/" + slug), lastModified: new Date(page.updatedAt), images: [page.packageImage.src] }`, appended to the returned array. No `try` / `catch`. Update the file comment: landing pages carry their own `lastModified` for the same reason journal posts do, and a malformed page raises. Makes T061 pass. Depends on T019.
- [x] T066 [US4] In `src/app/(site)/service/page.tsx`, call `getLandingPageLinks()` in the existing `Promise.all`, build a `Record<string, { href: string; label: string }>` keyed by `packageId`, and pass it to `ServiceExperience` as `landingLinks`. In `ServiceExperience.tsx` accept the optional prop and, for a package with an entry, render a secondary small `Button` (`href`, `data-landing-link`) whose text is the entry's heading, in the summary column after "Book now". Add the minimum `service.module.scss` rules using existing tokens. A package without an entry renders as before. Makes T062 pass. Depends on T019.
- [x] T067 [US4] In `src/app/(site)/work/[slug]/page.tsx`, call `getLandingPageLinks()` after the project is found, find `links.find((l) => categoriesMatch(l.category, project.category))`, and pass it to `WorkDetailGallery` as `landingLink`. In `WorkDetailGallery.tsx` accept an optional `landingLink: { href: string; heading: string }` and render it only when `presentation === "page"`, as a `Link` with `data-landing-link` in the project's header/meta area; add its styles to `WorkDetailGallery.module.scss` using tokens. Makes T063 and T064 pass. Depends on T019.
- [x] T068 [US4] Verify in a browser with two pages live and one switched off (quickstart §5, §8): the sitemap lists the live two with images and `lastmod`; `/service` links only their packages; a project in a live category links to its page and back; a project in the held-back category and one in a category with no page show no link and no error; switching a page off removes all of it after the refresh. Depends on T065–T067 and T024.

**Checkpoint**: No live page is an orphan, and no held-back page leaks.

---

## Phase 7: Launch content (FR-040, FR-041, SC-004, SC-012, SC-013)

**Purpose**: The four pages, written by Claude from the CMS and the spec, with every unknown studio fact marked for the owner, delivered held back, and approved by the owner before they go live. Not a user story: it is the deliverable that makes the others worth shipping.

**Needs the live dataset** for T069–T070 and T078 onward. Steps before them can be written and tested without it. The settings document is **not** part of this phase: it was written and published in T023–T024, so `--missing` makes the import in T078 skip it.

- [ ] T069 **[Content — owner]** Confirm which published service package is Portrait, Engagement, Family and Graduation, and that the category string each page will use matches its projects (quickstart §9a). Blocks T070.
- [x] T070 Read the package `_id`s and the project categories from the dataset (`npx sanity documents query …`, quickstart §9a) and note them for T071–T074. If the tool or the dataset is unavailable, **stop here** and say so; do not invent ids.
- [x] T071 [P] Create `content/service-landing-pages/engagement.json` from `contracts/briefs/engagement.md`: `_id` `serviceLandingPage-engagement`, `published: false`, `approvedAgainstBrief: false`, `package` `_ref` from T070, `serviceName` `Engagement`, `alternateName` `Pre-wedding`, `category` from T070, `slug` `engagement-photographer-london-ontario`. Use both names naturally in the **introduction, at least one question and answer, `seoTitle` and `seoDescription`** (SC-004). Each text field meets `LANDING_QUALITY`; unknown studio facts are `[[CONFIRM: …]]` exactly as the brief lists them; nothing contradicts the package. Paragraphs are separate array entries so the file reads as prose in review.
- [x] T072 [P] Create `content/service-landing-pages/portrait.json` from `contracts/briefs/portrait.md`, same rules. `serviceName` `Portrait`, slug `portrait-photographer-london-ontario`, no `alternateName`.
- [x] T073 [P] Create `content/service-landing-pages/family.json` from `contracts/briefs/family.md`, same rules. `serviceName` `Family`, slug `family-photographer-london-ontario`.
- [x] T074 [P] Create `content/service-landing-pages/graduation.json` from `contracts/briefs/graduation.md`, same rules. `serviceName` `Graduation`, slug `graduation-photographer-london-ontario`.
- [x] T075 [P] Create `content/service-landing-pages/README.md`: what the folder is (launch content for spec 014, imported once), the five files (`settings.json` was already published in T024), the exact import command from quickstart §9e and its fallback, that `--missing` makes it safe to re-run, that nothing here is edited after import (the Studio is the source from then on), and that a `[[CONFIRM` is a gap the owner must fill.
- [x] T076 Write `src/utils/landingLaunchContent.test.ts` (reads the files with `node:fs`; it is the only check on imported content, research.md §4b): every `serviceLandingPage.*.json` passes `assessLandingPageQuality` with an empty result; none has `published: true`; each has `approvedAgainstBrief: false`; each `_id` matches `serviceLandingPage-<service>` and contains **no dot**; the four slugs satisfy `isLandingSlug`, are unique, and none is reserved; `settings.json`'s pattern holds both placeholders; **the Engagement page uses both "engagement" and "pre-wedding" (case-insensitive) in all six places** — the heading composed from `settings.json`'s pattern, the introduction, at least one question-and-answer, `seoTitle`, `seoDescription`, and `alternateName` (which is what feeds the structured data) — SC-004; no landing document lacks a `package._ref`. Depends on T023 (the settings file it reads) and T071–T074, and on T056 for `assessLandingPageQuality`.
- [x] T077 Run the distinctness check (research.md §10) over the four pages **and** the services page's package copy (descriptions and features read from the dataset): exact repeated sentences, shared eight-word runs, pairwise FAQ answers, the four titles and descriptions, services-page overlap. Fix the copy until every count is zero or each exception is justified. Use a throwaway script in the scratchpad directory; **do not commit it**. Keep the counts for T091. Depends on T071–T074.
- [ ] T078 **[Content — owner or developer with a write login]** Import: `sanity login` if needed, then the command in quickstart §9e. Confirm four **Held back** pages appear in the Studio (the settings document is already there from T024) and that all four URLs return `404` (quickstart §9f). Depends on T069, T075, T076.
- [ ] T079 **[Content — owner]** For each page she is ready to launch: replace every `[[CONFIRM]]` with the real detail or delete the sentence, read the page against its brief, tick **Approved against the brief**, switch **Published** on, publish (quickstart §9g). Family and Graduation may stay held back until she has more to say; the switch exists for exactly that. Not blocking the pull request.

---

## Phase 8: Browser journeys (Playwright)

**Purpose**: What jsdom cannot show — the real navigation from the services page and from a project to a landing page, the contact route, and the HTTP status of a 404 (`notFound()` returns 200 when streamed — research.md F6). Selectors follow `contracts/test-surface.md`: role and accessible name first, then `data-*` identity; never a slug, a title, a count or a CSS-module class.

- [x] T080 [P] Add `firstLandingPageHref(page)` to `e2e/support/content.ts`: open `/service`, return the first `[data-landing-link]`'s `href`, else `null`. Add `landingPageShowsProjects(page, href)` returning whether `[data-work-card]` is present on that page.
- [x] T081 Create `e2e/journeys/landing.ts` with journeys L1–L5 as specified in `contracts/test-surface.md`: L1 services → landing (`[data-landing-page]`, one level-1 heading, `expectNavigationSettled`); L2 call to action reaches `/contact`; L3 a landing page with a project card → its project page offers a `[data-landing-link]` → following it returns to the same landing page (skip with its own message when no live page shows a project, trying the next live page first); L4 `[data-landing-package]` and `[data-landing-faq]` are present and non-empty; L5 `page.request.get` of `/unknown-${Date.now()}` is **404**, and `/work`, `/service` and `/sitemap.xml` are **200**. A journey with no live page `test.skip`s with "No live service landing page in the dataset — publish one in Sanity to run this journey." Depends on T080.
- [x] T082 Create `e2e/landing.spec.ts` with `underBothMotionPreferences("landing", { … })` registering L1–L5, matching `e2e/journal.spec.ts`. Depends on T081.
- [x] T083 Run `PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e` and, for the reduced-motion half, `… -- --grep reduce`. **Expected:** green, with the landing journeys either passing or skipping with the message above. Fix a real failure; never loosen a journey to make it pass. Depends on T082.

---

## Phase 9: Polish and cross-cutting concerns

- [x] T084 [P] Update `specs/002-work-gallery/spec.md`: the project page links to the matching live landing page (FR-028); the client-side filter is unchanged.
- [x] T085 [P] Update `specs/004-services-page/spec.md`: a package with a live landing page links to it; packages without one render as before; the features-and-price block is the shared `ServicePackageDetails`.
- [x] T086 [P] Update `specs/006-site-navigation-shell/spec.md`: the `landing` shell variant marks Services as the current section; the primary navigation's items are unchanged.
- [x] T087 [P] Update `specs/007-cms-studio-content-sync/spec.md`: `serviceLandingPage` and `serviceLandingSettings` in the Studio's coverage list; note that content imported with `sanity dataset import` bypasses Studio validation, and what covers that gap (T076).
- [x] T088 [P] Update `specs/008-seo-metadata/spec.md`: landing pages in "public pages" and the sitemap (with image and `lastModified`); `Service` and `FAQPage` structured-data types; the Home › Services › page breadcrumb in FR-005a; the services-page schema unchanged apart from the shared offer helper.
- [x] T089 Run every gate and fix what fails: `npm run lint`, `npm run typecheck`, `npm test`, `npm run audit:design-system`, `npm run audit:css-diff`, `npm run build`, `PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e`. Do not use `--no-verify`.
- [ ] T090 Walk the quickstart steps that need a live Studio and webhook: §2 (static routes unharmed — if it ever fails, stop and revisit research.md §1), §6 (keyboard, reduced motion, screen reader), §7 (a brand-new slug live within about a minute — if it stays `404` for up to an hour, a stale 404 was cached and the per-slug decision needs revisiting), §8 (off, rename, delete), §10 (thin and empty categories). Record the outcome of each in the pull request.
- [x] T091 Write the pull request description: the decisions in plan.md "Open decisions for the owner" with the position taken on each, the **distinctness check result from T077** (counts and every exception), which pages are live and which are held back, the spec amendments made in this change (FR-038–FR-043), and the two things not verified from a no-dataset checkout (research.md F2) if T069–T070 were not run. Create or update the PR only when asked.

---

## Dependencies and execution order

### Phase dependencies

- **Phase 1 → Phase 2 → everything else.** Phase 2 blocks all stories.
- **Phase 3 (US1)** needs Phase 2. It is the MVP. Its manual check T048 also needs the settings document published (T024).
- **Phase 4 (US2)** needs Phase 3's page (T047), because it extends that page's tests.
- **Phase 5 (US3)** needs only Phase 2 (the base schemas, `countWords`, `categoriesMatch`, `landingSlug`). It does **not** depend on US1 or US2 and can run in parallel with them.
- **Phase 6 (US4)** needs Phase 2 (`getLandingPageLinks`) and, for the manual check T068, a live page from Phase 3. Its code and tests do not need US1's components.
- **Phase 7 (launch content)** needs Phase 5's `assessLandingPageQuality` (T056) for T076, and the live dataset for T069–T070 and T078.
- **Phase 8 (e2e)** needs Phases 3 and 6; its journeys skip on an empty dataset, so it can land before any page is live.
- **Phase 9 (polish)** last. T084–T088 are independent of each other.

### Within a phase

- Tests before implementation, and watch them fail.
- Phase 2: utilities (T013–T016) before queries and fetchers (T017–T019); schemas (T020–T021) before registration (T022); T027 → T028 → T029, and T030 → T031, then T032 verifies both.
- Phase 3: tokens (T039) before the components that use them (T041–T046); T047 last.

### Parallel opportunities

- Phase 1: T001–T004 together.
- Phase 2 tests: T005–T012 together. Phase 2 implementation: T013, T014, T015 together; then T020 and T021 together; T028 and T030 are independent of each other.
- Phase 3 tests: T033–T038 together. Implementation: T040–T045 together once T039 and the Phase 2 components exist.
- Phase 4 tests: T049–T051 touch two files, so T049/T051 (same file) are sequential and T050 is parallel to them.
- Phase 5 and Phase 6 can proceed alongside Phase 3/4 with a second person.
- Phase 7: T071–T075 together.
- Phase 9: T084–T088 together.

### Parallel example: User Story 1

```bash
# Six test files at once — different files, no shared state:
Task: "T033 Service and FAQPage builder tests in src/utils/structuredData.test.ts"
Task: "T034 LandingFaq tests in src/components/landing/LandingFaq/LandingFaq.test.tsx"
Task: "T035 LandingProjects tests in src/components/landing/LandingProjects/LandingProjects.test.tsx"
Task: "T036 LandingPackage tests in src/components/landing/LandingPackage/LandingPackage.test.tsx"
Task: "T037 LandingSections and LandingCta tests under src/components/landing/"
Task: "T038 route tests in src/app/(site)/[landingSlug]/page.test.tsx"

# Then the independent pieces of implementation (after T039 tokens):
Task: "T040 schema builders in src/utils/structuredData.ts"
Task: "T041 LandingSections"   Task: "T042 LandingFaq"
Task: "T043 LandingProjects"  Task: "T044 LandingPackage"  Task: "T045 LandingCta"
```

---

## Implementation strategy

### MVP first (User Story 1)

1. Phase 1 → Phase 2. Commit before T032: `audit:css-diff` builds `HEAD` and compares.
2. Phase 3 (US1).
3. **Stop and validate**: one real page in the dataset, reached by URL, correct metadata and JSON-LD, a real 404 for anything else, `/work` and its siblings untouched (T048). This alone delivers the local-search value.

### Incremental delivery

1. Setup + Foundational → the data spine, both promotions, content-error guards tested.
2. - US1 → a page exists and is correctly described (MVP).
3. - US2 → the alternate name is proven end to end.
4. - US3 → the Studio refuses thin, unapproved and colliding pages.
5. - US4 → the pages are linked and in the sitemap.
6. - Launch content, browser journeys and polish → the four pages are delivered held back; the owner approves and switches them on when ready.

### Pushing along the way

`.husky/pre-push` runs the unit suite and the browser suite (which builds). Three consequences:

- From the moment `[landingSlug]` exists (T047), the build prerenders it. With no live
  page, `generateStaticParams` returns `[]` and nothing else is required of the dataset —
  provided `getLandingPageLinks()` honours its short-circuit (T019, T010).
- The e2e journeys skip rather than fail on a dataset with no live landing page, so
  they can land before the owner switches the first page on.
- Phase 7's import can happen after the code merges; it does not gate the build.

---

## Notes

- **[Content]** tasks (T069, T078, T079) are for the owner or a developer with a write login. An
  implementing agent must not approve a page on her behalf or tick **Approved against the brief**.
- Nothing in this task list adds duplicate-text detection to the Studio or the site (spec
  Assumptions). The only distinctness check is T077, a drafting step whose result goes in the PR.
- The two promotions (T027–T031) touch shipped code. They are the riskiest edits in this list; T032
  exists so that "no visible change" is a measurement.
- Commit after each task or logical group. Stop at any checkpoint to validate a story on its own.

---

## Implementation status (2026-10-11)

Everything an implementing agent can do is done. What remains is the owner's, or
needs a login this checkout does not have, and is left unchecked on purpose.

**Left open**

- **T024** — publish `settings.json`. **Do this before anyone switches a page on.**
  Once any page is live, `/service` and every project page read the settings
  document, and the build fails without it. With no live page the build does not
  read it (T019).
- **T069, T078, T079** — the owner confirms the package mapping, imports, replaces
  every `[[CONFIRM]]`, ticks approval and switches pages on. T070 was done from the
  public dataset: Portrait Session → Portrait, Engagement → Engagement, Family
  Session → Family, Graduation Session → Graduation; the owner still confirms it.
- **T060** — the Studio walk (quickstart §3, §4) needs an interactive Studio
  session. The schema loads through the Sanity CLI with no errors or warnings
  (`npx sanity schema validate`), and every rule is a pure function with its own
  tests, but the wiring has not been seen in the Studio UI.
- **T090** — quickstart §7 (a brand-new slug live within about a minute of
  publishing) needs a deployed webhook; the stale-404 risk in research.md §1 is
  still unobserved. §6's keyboard and screen-reader walk was not done.

**How T048, T053 and T068 were verified without writing to the dataset**

A throwaway fetch interceptor (not committed) served the launch pages as live
documents to a local server while every other query went to the real dataset.
Observed: all five landing sections in order, one `h1`, `Service` with
`alternateName`, `FAQPage` equal to the page text, Services current in the
navigation, links on `/service` and on project pages only for live categories,
the sitemap listing exactly the live pages, a held-back page answering `404`, and
a never-prerendered slug rendering on its first request. The browser journeys
L1–L5 passed against that server under both motion preferences. The exported
queries were also evaluated with `groq-js` over the real packages and images plus
the launch files, and each was accepted by the real API.
