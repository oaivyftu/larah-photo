---
description: "Task list for the Journal section"
---

# Tasks: Journal Section

**Input**: Design documents from `/specs/013-journal-section/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included, and not optional here. Constitution Principle V names
Sanity content-error handling as a critical flow that must have automated
coverage before it ships, and research.md §8 sets out the three layers (unit,
integration, e2e). Within each phase, write the tests first and watch them fail.

**Organization**: Grouped by user story. US1 and US2 are both P1 in the spec;
US1 comes first because it is the visible outcome and the MVP, and US2 hardens
the Studio side of what Phase 2 already builds.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1, US2 or US3, matching spec.md
- Paths are repo-relative; this is a single Next.js project

## Before you start

- Read `specs/013-journal-section/plan.md` and the contract for whatever you are
  touching. `AGENTS.md` §1–5 still apply to every task: search
  `src/components/ui/` before writing UI, zero literals in `*.module.scss`,
  content from Sanity only.
- **T014 is a content task, not a code task, and it blocks builds.** Once
  `/journal` exists, `npm run build` prerenders it, and prerendering reads the
  `journalPage` document. If that document is not published in the dataset, the
  build fails — and `.husky/pre-push` runs the build. Get T014 done as soon as
  the schema is registered (T011), not at the end.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The two modules everything else imports, and the pointer that
lets the next agent find this spec.

- [x] T001 [P] Create `src/constants/journalCategories.ts` exporting `JOURNAL_CATEGORIES` as a readonly tuple in this order — Portrait, Wedding, Engagement, Family, Graduation, Location Guide, Behind the Scenes — plus `type JournalCategory = (typeof JOURNAL_CATEGORIES)[number]`. Add a file comment that this is the single source for both the Sanity schema and the fetcher (research.md §10), and that `workProject.category` is deliberately not constrained by it.
- [x] T002 [P] Create `src/types/journal.ts` with `JournalPostSummary`, `JournalPost`, `JournalPageContent` and a `JournalBodyBlock` union (Portable Text block | resolved `bodyImage` with `ProjectImage` + optional `caption` | resolved `embed` with `provider`, `src`, `title`), exactly as data-model.md "Runtime types". Reuse `ProjectImage` from `src/types/project.ts`; import `PortableTextBlock` from `next-sanity`, not from `@portabletext/react` (research.md §1).
- [x] T003 [P] Add a row to the spec table in `AGENTS.md` §1: `| Journal (listing, posts) | specs/013-journal-section/ |`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The data spine — date and embed rules, both schemas, the queries
with the live-post predicate, and the fetchers with their content-error guards.
Every story reads through these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for the foundation ⚠️ write first, watch them fail

- [x] T004 [P] Write `src/utils/journalDate.test.ts`: (a) `todayInStudioTimeZone()` returns `YYYY-MM-DD` for America/Toronto — use `vi.useFakeTimers()` + `vi.setSystemTime()` at `2026-09-16T03:30:00Z` and expect `2026-09-15` (Toronto is still on the 15th), and at a DST-boundary instant; (b) `formatJournalDate("2026-09-15")` returns `September 15, 2026` with `process.env.TZ` set to `America/Los_Angeles` **and** to `Pacific/Auckland` — the UTC-parse trap from research.md §3; (c) `isLive(publishedAt, today)` is true for equal and earlier dates, false for later ones.
- [x] T005 [P] Write `src/utils/journalEmbed.test.ts` covering every row of `specs/013-journal-section/contracts/embed-providers.md`: each accepted input form normalises to its documented `src` and provider (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/` → `youtube-nocookie.com/embed/<id>`; `vimeo.com/<id>` and `player.vimeo.com/video/<id>` → `…?dnt=1`; Maps `…/maps/embed?pb=…` unchanged); `http://` is upgraded; extra query params are dropped except Maps' `pb`. Rejections return `null`: an unlisted host, a YouTube id that is not 11 characters, a Maps URL without `pb`, `/maps/embed/v1/` (keyed API), `javascript:` and `data:` URLs. Also assert `EMBED_REJECTION_MESSAGE` names all three providers.
- [x] T006 [P] Extend `src/sanity/fetchers.test.ts` (mocking the Sanity client at the module boundary, as the file already does) with journal guard suites: `getJournalPage()` throws when the document is null and when each of its six required fields is missing or blank; `getJournalPosts()` maps a complete post, and throws naming `journalPost[i].<field>` for a missing title/slug/excerpt/location/category/publishedAt/body, for a category outside `JOURNAL_CATEGORIES`, for a cover or body image without alt text, and for an embed whose URL `parseEmbedUrl` rejects; a body image with no caption is fine; a blank `seoTitle`/`seoDescription` maps to `undefined`; `getJournalPostBySlug()` returns `null` when Sanity returns null; and every journal fetcher passes a `today` param equal to `todayInStudioTimeZone()`.

### Implementation for the foundation

- [x] T007 [P] Implement `src/utils/journalDate.ts`: `STUDIO_TIME_ZONE = "America/Toronto"`, `todayInStudioTimeZone()` via `Intl.DateTimeFormat("en-CA", { timeZone: STUDIO_TIME_ZONE })`, `formatJournalDate()` that formats from the string's parts (or with `timeZone: "UTC"`) and never via local-time parsing, and `isLive()`. Comment the UTC-parse trap where the formatter is defined. Makes T004 pass.
- [x] T008 [P] Implement `src/utils/journalEmbed.ts`: `EMBED_PROVIDERS`, `parseEmbedUrl(url): { provider: "google-maps" | "youtube" | "vimeo"; src: string } | null`, and `EMBED_REJECTION_MESSAGE`. Pure functions, no network. Makes T005 pass.
- [x] T009 Create `src/sanity/schemaTypes/journalPost.ts` with every field in data-model.md "Document: journalPost": `title`, `slug` (`options.source: "title"`), `coverImage` via the existing `imageField()` helper from `./shared`, `excerpt` (text), `body` (Portable Text), `location`, `category` (`options.list` from `JOURNAL_CATEGORIES`), `publishedAt` (`date`, `initialValue: () => todayInStudioTimeZone()`), `seoTitle`, `seoDescription`, each with its required rule. `body` members: `block` restricted to styles normal/h2/h3/h4/blockquote, lists bullet/number, decorators strong/em and a `link` annotation with required `href`; `bodyImage` (image, hotspot, required `alt`, optional `caption`); `embed` (required `url` validated with `parseEmbedUrl`, failing with `EMBED_REJECTION_MESSAGE`; required `title`). Depends on T001, T007, T008.
- [x] T010 [P] Create `src/sanity/schemaTypes/journalPage.ts`: the shared `titleWordsField` from `./shared` plus required `emptyStateMessage` (text), `ctaHeading`, `ctaBody` (text), `ctaContactLabel`, `ctaWorkLabel`; preview title "Journal page", following `workPage.ts`.
- [x] T011 Register `journalPage` and `journalPost` in `src/sanity/schemaTypes/index.ts`, next to the other page documents and work projects respectively. Depends on T009, T010.
- [x] T012 Add to `src/sanity/queries.ts`: one exported live-post filter fragment — `_type == "journalPost" && defined(slug.current) && publishedAt <= $today` — and four queries built on it: `journalPageQuery`, `journalPostsQuery` (summary fields, `| order(publishedAt desc, _createdAt desc)`), `journalPostBySlugQuery` (full post, `_updatedAt`, and `body[]{ ..., _type == "bodyImage" => { ..., ${imageFields} } }` so body images carry asset URL and dimensions), `journalPostSlugsQuery`. Comment that the fragment exists so no query can omit the schedule rule (research.md §2).
- [x] T013 Implement `getJournalPage`, `getJournalPosts`, `getJournalPostBySlug`, `getJournalPostSlugs` in `src/sanity/fetchers.ts`, following `getWorkProjects`/`getWorkProjectBySlug` exactly: `fetchSanity` with `{ today: todayInStudioTimeZone() }`, `requireDocument`/`requireString`/`requireValue`, `resolveSanityImage` for cover and body images. Add two guards — `requireJournalCategory` and `requireEmbed` (calls `parseEmbedUrl`, throws naming the field) — and a body mapper that returns `JournalBodyBlock[]` plus the flattened `bodyImages`. Trim overrides to `undefined` when blank. Makes T006 pass. Depends on T002, T007, T008, T012.
- [x] T014 **[Content — studio owner]** Run `npm run dev`, open `/studio`, and create and publish the **Journal page** document with the studio owner's own wording for all six fields. Principle I: this copy is hers, not generated. Blocks US1's call to action, US3's listing, and every build from US3 onward (see "Before you start"). Depends on T011.
  - _Done 2026-09-18._ The Journal page document is published with all six required fields. `npm run build` succeeds end to end; `/journal` and `/journal/[slug]` now appear in the route table.

**Checkpoint**: `npm test` passes, including T004–T006. `npm run typecheck` passes. The Studio shows both new document types.

---

## Phase 3: User Story 1 — Read a local article found through search (Priority: P1) 🎯 MVP

**Goal**: A published post has its own page at `/journal/<slug>`: title as the
only `h1`, cover, date, location, category, a fully structured body with
captioned images and allow-listed embeds, the end-of-post call to action, its
own metadata and `BlogPosting` + breadcrumb structured data, and a sitemap
entry.

**Independent Test**: Publish one complete post, request `/journal/<slug>`
directly, and confirm every field renders, the metadata and JSON-LD describe
that post, the call to action reaches `/contact` and `/work` in one activation,
and an unknown slug 404s with `noindex` (quickstart Scenarios 3 and 5).

### Tests for User Story 1 ⚠️ write first, watch them fail

- [x] T015 [P] [US1] Extend `src/utils/structuredData.test.ts` with `buildJournalPostSchema`: `@type` `BlogPosting`; `headline`, `description`, `image`; `datePublished` equals the authored date and `dateModified` equals `updatedAt`; `author` and `publisher` are `{ "@id": businessId }`; `isPartOf` is `{ "@id": websiteId }`; `mainEntityOfPage` is the post URL; `articleSection` is the category and `contentLocation` the location; no key holds `undefined` or `""`.
- [x] T016 [P] [US1] Write `src/components/journal/JournalEmbed/JournalEmbed.test.tsx` asserting the rendering rules in `contracts/embed-providers.md`: a `figure[data-journal-embed="<provider>"]` wrapping an `iframe` with the normalised `src`, the editor's `title`, `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, `allowfullscreen`, an `allow` list with no `autoplay`, and **no** `sandbox` attribute.
- [x] T017 [P] [US1] Write `src/components/journal/JournalBody/JournalBody.test.tsx`: a fixture body with every member type renders `h2`/`h3`/`h4` and **no `h1`**; a `blockquote` pull quote; `ul` and `ol`; `strong`/`em`; a site-relative link as an internal link and an `https` link as an external one; a body image whose alt is on the `img` and whose caption is in a `figcaption` (and an image without a caption renders no `figcaption`); an embed via `JournalEmbed`.
- [x] T018 [P] [US1] Write `src/app/(site)/journal/[slug]/page.test.tsx` in the style of `src/app/(site)/work/[slug]/page.test.tsx` (call the Server Component, await it, assert on the result; mock the fetchers): renders title as `h1`, a `<time dateTime="YYYY-MM-DD">`, location, category, body and a `[data-journal-cta]` with links to `/contact` and `/work` using the `journalPage` labels; calls `notFound()` when `getJournalPostBySlug` returns null; propagates a content error; `generateMetadata` uses `seoTitle`/`seoDescription` when set, falls back to `title`/`excerpt` when they are unset, returns `{ title: "Post not found", robots: { index: false } }` for an unknown slug, and sets canonical `/journal/<slug>` with the cover as OG image; the output includes the `BlogPosting` and a Home › Journal › title breadcrumb.
- [x] T019 [P] [US1] Extend `src/components/layout/PageShell/PageShell.test.tsx`: with a navigation item `{ href: "/journal" }` in site settings, `variant="journalPost"` marks that item `aria-current="page"`.
- [x] T020 [P] [US1] Extend the `sitemap` suite in `src/app/seo-routes.test.ts`: each live post appears at `/journal/<slug>` with its cover and body image URLs in `images` and its own `updatedAt` as `lastModified`; a post absent from `getJournalPosts()` (i.e. scheduled or unpublished) is absent from the sitemap.

### Implementation for User Story 1

- [x] T021 [US1] Add the post's semantic tokens to `src/styles/_tokens.scss` under a `--journal-*` family: article measure, meta row gap, cover spacing, body size/leading, `h2`/`h3`/`h4` size/leading pairs, caption size/leading and colour, pull quote size/leading and rule, embed aspect ratio and spacing, CTA spacing. Size and leading names differ only in the property (`--journal-body-size` / `--journal-body-leading`). Reuse scale-tier tokens where the value recurs for the same reason; never name a token after its value (`AGENTS.md` §3).
- [x] T022 [US1] Add long-form type styles to `src/styles/_typography.scss` consuming T021's tokens: body copy, `h2`–`h4`, caption, pull quote. Depends on T021.
  - _Done differently:_ `_typography.scss` holds only element-level globals (`body`, `h1`–`h4`) and every page scopes its own type in its module, so global article classes there would break that convention. The values are T021's tokens; the element styles live in `src/components/journal/JournalBody/JournalBody.module.scss` (T025).
- [x] T023 [P] [US1] Implement `buildJournalPostSchema(post)` in `src/utils/structuredData.ts` beside `buildProjectSchema`, using `compact()`, `businessId`, `websiteId` and `absoluteUrl`. Makes T015 pass.
- [x] T024 [P] [US1] Create `src/components/journal/JournalEmbed/JournalEmbed.tsx` and `JournalEmbed.module.scss`: the markup in `contracts/embed-providers.md` "Rendering", space reserved by `aspect-ratio` from a T021 token. A failed or blocked frame must not throw or collapse the layout (FR-002d). Makes T016 pass.
- [x] T025 [US1] Create `src/components/journal/JournalBody/JournalBody.tsx` and `JournalBody.module.scss`: `PortableText` imported from `next-sanity` with a component map — block styles to `h2`/`h3`/`h4`/`p`/`blockquote`, lists, marks, `link` (site-relative `href` → `next/link`, otherwise a plain anchor with `rel="noopener noreferrer"`), `bodyImage` → `figure` with `LarahImage` (lazy, `sizes` matched to the article measure, alt from the image) and an optional `figcaption`, `embed` → `JournalEmbed`. Set `data-journal-article` on the wrapper. Makes T017 pass. Depends on T022, T024.
- [x] T026 [P] [US1] Create `src/components/journal/JournalCta/JournalCta.tsx` and `JournalCta.module.scss`: a `section[data-journal-cta]` with the heading and body from `JournalPageContent.cta`, and two `ui/Button` links (`href="/contact"`, `href="/work"`) using the contact and work labels. Compose `Button`; do not restyle a link into a button locally (Principle VII).
- [x] T027 [US1] Create `src/app/(site)/journal/[slug]/JournalPostClient.tsx` and `post.module.scss`: a plain `h1` for the title (not `PageHeading` — research.md §7), the cover via `LarahImage` with `preload` (above the fold), a meta row with `<time dateTime={publishedAt}>{formatJournalDate(publishedAt)}</time>`, location and category, then `JournalBody` and `JournalCta`. Entry animation through `usePageIntro`, which already skips under reduced motion (FR-027). Depends on T022, T025, T026.
- [x] T028 [US1] Create `src/app/(site)/journal/[slug]/page.tsx` modelled on `src/app/(site)/work/[slug]/page.tsx`: `generateMetadata` via `pageMetadata()` with the override-else-fallback rule and `toOpenGraphImage(cover)`; `generateStaticParams` from `getJournalPostSlugs()` (live slugs only; leave `dynamicParams` at its default); the page fetches the post and `getJournalPage()`, calls `notFound()` on null, and renders `PageShell variant="journalPost"` with `JsonLd` for `buildJournalPostSchema` and `buildBreadcrumbSchema([Home /, Journal /journal, title /journal/<slug>])`. Makes T018 pass. Depends on T013, T023, T027, T029.
- [x] T029 [P] [US1] Add a `journalPost` variant to `src/components/layout/PageShell/PageShell.tsx`, mapped to `/journal` in `activeHrefByVariant` (as `project` maps to `/work`). Makes T019 pass.
- [x] T030 [US1] Extend `src/app/sitemap.ts`: fetch `getJournalPosts()` alongside projects and add one entry per post with `lastModified: post.updatedAt` and `images: [cover, ...bodyImages]`. Update the file's comment to say why journal entries carry their own `lastModified` while project entries do not (research.md §6). Makes T020 pass. (`getJournalPosts` must return `updatedAt` and `bodyImages` for this — extend its query projection in `src/sanity/queries.ts` if T012 kept the summary lean.)
- [x] T031 [US1] Run `npm run audit:design-system` (must exit 0 with the new stylesheets), `npm test`, and quickstart Scenarios 3 and 5 against one live post; fix what fails.
  - _Status 2026-09-18:_ audit, tests and now the build all pass. Scenarios 3 and 5 (quickstart) still need a live _post_ — the Journal page settings alone don't exercise a post's fields, structured data or metadata.

**Checkpoint**: A post is fully readable, correctly described to search engines, and discoverable through the sitemap. The MVP.

---

## Phase 4: User Story 2 — Publish, edit and unpublish from the Studio (Priority: P1)

**Goal**: The Studio side of FR-004/005/007b: publishing blocked with clear
messages, advisory length warnings, a visible live/scheduled state, and the
slug-change warning. Visibility itself (live, scheduled, unpublished) is already
enforced by Phase 2's query predicate; this phase makes it legible to the
editor and verifies it end to end.

**Independent Test**: In the Studio, try to publish with a required field empty
and see it blocked with the field named; publish; edit; set a future date and
see "Scheduled"; unpublish and see the URL 404 (quickstart Scenarios 2 and 4).
The "see it live" step uses US1's route.

### Tests for User Story 2 ⚠️ write first, watch them fail

- [x] T032 [P] [US2] Write `src/sanity/schemaTypes/journalPost.test.ts` asserting the schema's shape, not Sanity's internals: the `body` block styles are exactly normal/h2/h3/h4/blockquote (so no `h1`); lists are bullet and number; decorators are strong and em; `category`'s `options.list` equals `JOURNAL_CATEGORIES`; the preview's `prepare()` returns a subtitle containing "Scheduled" for a date after `todayInStudioTimeZone()` and "Live" for today and earlier (fake timers). Keep assertions on exported definitions and pure functions.

### Implementation for User Story 2

- [x] T033 [US2] In `src/sanity/schemaTypes/journalPost.ts`, add advisory rules that warn and do not block: `excerpt` over 200, `seoTitle` over 60, `seoDescription` over 160 characters, via `rule.max(n).warning(…)` with a message saying search results truncate there (FR-005, contracts/content-model.md "Advises only").
- [x] T034 [US2] In `src/sanity/schemaTypes/journalPost.ts`, give the document a `preview` with `select` title/publishedAt/coverImage and a `prepare()` that shows `Live · <date>` or `Scheduled · <date>` using `isLive(publishedAt, todayInStudioTimeZone())` (FR-007b). Makes T032's preview assertions pass.
  - _Adjusted:_ the subtitle reads `Scheduled · <date>` or just the date, never `Live`. A preview cannot see publish state, so an unpublished draft dated in the past would have read "Live". Sanity's draft/published badge covers that half. Recorded in contracts/content-model.md.
- [x] T035 [US2] In `src/sanity/schemaTypes/journalPost.ts`, add the slug field's `description` warning that changing a published post's slug breaks existing links (no redirects are created), and validate the `link` annotation's `href` as `https`/`http`/`mailto` or a site-relative path, with the message "Enter a valid link."
- [x] T036 [US2] Align every blocking validation message in `src/sanity/schemaTypes/journalPost.ts` and `src/sanity/schemaTypes/journalPage.ts` with the table in `specs/013-journal-section/contracts/content-model.md` "Blocks publishing" (slug uniqueness, alt text, embed provider, embed description, link).
  - _Adjusted:_ slug uniqueness uses Sanity's built-in check and its message ("Slug is already in use") rather than a duplicate custom one; the contract was corrected to say so.
- [ ] T037 [US2] Check the webhook in Sanity manage → API → Webhooks: if it has a document filter, extend it to include `journalPost` and `journalPage`; if it has none, it already covers them. The route (`src/app/api/revalidate/route.ts`) needs no change — it revalidates the shared tag for any `_type`. Record what you found under Scenario 2 in `specs/013-journal-section/quickstart.md`.
  - _Status 2026-09-19:_ a webhook now exists and is reaching `/api/revalidate` on production, but every call returns 500. That is the route's "secret not configured" branch. `SANITY_REVALIDATE_SECRET` is present in Vercel but either empty or not matching the webhook's Secret, and redeploying is needed after fixing it. This predates the journal and affects every content type, so it is not a blocker for merging this PR.
- [ ] T038 [US2] Walk quickstart Scenarios 2 and 4 in the Studio against a dev build and record the outcome in `specs/013-journal-section/quickstart.md`: blocked publish names the field; a published post is live within about a minute via the webhook; a future-dated post is absent from `/journal/<slug>` and the sitemap and shows "Scheduled"; setting its date to today brings it back without further action; unpublishing 404s the URL.

**Checkpoint**: The editor can publish, schedule, edit and unpublish with the Studio telling her what state each post is in.

---

## Phase 5: User Story 3 — Browse the journal from the navigation (Priority: P2)

**Goal**: `/journal` lists every live post newest first with cover, title,
excerpt and date, renders the editor's empty state when there are none, carries
`CollectionPage` + breadcrumb structured data, appears in the sitemap, and is
marked current in the navigation once the editor adds it.

**Independent Test**: With several live posts on different dates, `/journal`
shows each exactly once in reverse-chronological order with all four fields;
with none, it shows the empty-state message; the Journal nav item is
`aria-current` on the listing and on a post (quickstart Scenarios 1 and 5).

### Tests for User Story 3 ⚠️ write first, watch them fail

- [x] T039 [P] [US3] Extend `src/utils/structuredData.test.ts` with `buildJournalCollectionSchema(posts)`: `CollectionPage` at `/journal` with `isPartOf` and `about` references, and an `ItemList` whose `numberOfItems` and `ListItem` positions/URLs follow the input order.
- [x] T040 [P] [US3] Write `src/app/(site)/journal/page.test.tsx` (call and await the Server Component; mock fetchers): posts render as `[data-journal-card]` entries in the order given, each with cover alt, title, excerpt, `<time>` and a link to `/journal/<slug>`, inside `[data-journal-list]`; an empty array renders `[data-journal-empty]` with `emptyStateMessage` and no list; a missing `journalPage` raises a content error; `generateMetadata` sets canonical `/journal`, and uses the newest post's cover as OG image when one exists; output includes the collection schema and a Home › Journal breadcrumb.
- [x] T041 [P] [US3] Extend `src/components/layout/PageShell/PageShell.test.tsx`: `variant="journal"` marks the `/journal` navigation item `aria-current="page"`.
- [x] T042 [P] [US3] Extend the `sitemap` suite in `src/app/seo-routes.test.ts`: `/journal` is listed with the static routes (update "lists the five public routes plus every project", which becomes six) and is still listed when no post is live.

### Implementation for User Story 3

- [x] T043 [US3] Add the listing's `--journal-*` tokens to `src/styles/_tokens.scss`: card grid gap and columns per breakpoint (via the `$breakpoints` map and mixins, never an inline `@media`), card title and excerpt size/leading pairs, card image ratio, date/meta colour, empty-state spacing.
- [x] T044 [P] [US3] Implement `buildJournalCollectionSchema(posts)` in `src/utils/structuredData.ts` beside `buildWorkCollectionSchema`, with the same shape. Makes T039 pass.
- [x] T045 [P] [US3] Create `src/components/journal/JournalCard/JournalCard.tsx` and `JournalCard.module.scss`: an `article[data-journal-card]` with a `LarahImage` cover (accept a `priority`/`preload` prop so only the first cards load eagerly — FR-028), the title as the link to `/journal/<slug>`, excerpt, and `<time dateTime>` via `formatJournalDate`.
  - _Adjusted after reading Next's image docs:_ the prop is `eager`, rendering `loading="eager"`, not `preload`. The docs reserve `preload` for the page's single largest image and advise against it when several images could be that, which a row of cards is (research.md §9). Three cards are eager, not two: the first row at laptop width.
- [x] T046 [US3] Create `src/app/(site)/journal/JournalListClient.tsx` and `journal.module.scss`: `PageHeading` with `titleWords` from `journalPage`, then either `[data-journal-list]` of `JournalCard`s (first two eager) or `[data-journal-empty]` with `emptyStateMessage`. Entry animation through `usePageIntro` with a card stagger, as `WorkGalleryClient` staggers cards. Depends on T043, T045.
- [x] T047 [US3] Create `src/app/(site)/journal/page.tsx`: `generateMetadata` via `pageMetadata({ title: "Journal", description, path: "/journal", images })` where the description names the studio's `settings.location` (as `/work`'s does) and `images` is the newest post's cover via `toOpenGraphImage`, omitted when there are no posts so the site default applies; render `PageShell variant="journal"` with `JsonLd` for `buildJournalCollectionSchema` and `buildBreadcrumbSchema([Home /, Journal /journal])`. Makes T040 pass. Depends on T044, T046, T048.
- [x] T048 [P] [US3] Add a `journal` variant to `src/components/layout/PageShell/PageShell.tsx`, mapped to `/journal`. Makes T041 pass.
- [x] T049 [US3] Add `/journal` to `staticRoutes` in `src/app/sitemap.ts`. Makes T042 pass.
- [x] T050 [US3] **[Content — studio owner]** Add a primary navigation item `{ label: "Journal", href: "/journal" }` in Site settings in the Studio, in whatever position she wants (FR-024). Until then the section is reachable by URL and sitemap only, which is a valid state (contracts/routes-and-seo.md "Navigation").
  - _Done by the studio owner, 2026-09-19._ The live homepage header now links to `/journal`. Until this branch is merged and deployed that link is a 404, since the nav is stored in Sanity and the journal code is not yet live.

**Checkpoint**: All three stories work independently. The journal is browsable, and the nav marks it current on both page types.

---

## Phase 6: Browser Journeys (US1 + US3)

**Purpose**: What jsdom cannot reach — the real navigation from listing to post,
the call to action, and the nav's current marking in a production build. Per
`contracts/test-surface.md`: discover the fixture, never fail on an empty
journal, never select by class name or copy.

- [x] T051 [P] Add `openJournalIndex(page)` (returns the card locator and the empty-state locator, whichever is present) and `firstJournalPostHref(page)` (the first card's link href, or `null`) to `e2e/support/content.ts`, in the file's existing documented style.
- [x] T052 Create `e2e/journeys/journal.ts` with four journeys from `contracts/test-surface.md`: listing → post (a card's link opens that post; `[data-journal-article]` is visible); the onward path (from the post, `[data-journal-cta]`'s contact link reaches `/contact` in one activation); the section is marked current (`aria-current="page"` on the Journal nav link on both pages — skip with a message if site settings have no Journal item yet); the empty journal (only when there is no live post: `[data-journal-empty]` is visible). Post-dependent journeys call `test.skip(true, "No live journal post — publish one in Sanity")` when `firstJournalPostHref` is `null`. Depends on T051.
- [x] T053 Create `e2e/journal.spec.ts` wiring T052's journeys through `underBothMotionPreferences("journal", { … })`, matching `e2e/navigation.spec.ts`. Depends on T052.
- [ ] T054 Run `PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e` and confirm the journal journeys pass (or skip, if the dataset has no live post) and the existing nine journeys are unaffected.
  - _Blocked:_ the suite's own `webServer` runs `npm run build`, which cannot pass until T014 is done. Once it can, the journal journeys will skip, not fail, while no post is live.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Bring the retrospective specs in line with what shipped, then run
every gate the hooks will run.

- [x] T055 [P] Update `specs/006-site-navigation-shell/spec.md`: FR-003/SC-002 cover the journal as a section whose listing and posts both mark the nav current; note the two new shell variants in Assumptions.
- [x] T056 [P] Update `specs/007-cms-studio-content-sync/spec.md`: add Journal posts and Journal page settings to FR-001's list of content types and to Key Entities.
- [x] T057 [P] Update `specs/008-seo-metadata/spec.md`: FR-001 (sitemap lists `/journal` and every live post with its images and own `lastModified`), FR-005a (journal listing and posts carry breadcrumbs), a new requirement or FR-006 extension for `BlogPosting` and the journal `CollectionPage`, and the "public pages" list in Assumptions.
- [x] T058 [P] Update the 013 entry in `specs/README.md` from "not yet built" to shipped, with the date and task count, matching how 009–011 are recorded.
- [x] T059 Run the full gate set and fix anything red: `npm run lint`, `npm run typecheck`, `npm run audit:design-system`, `npm test`, `npm run build`.
  - _Done 2026-09-19._ `npm run lint`, `typecheck`, `audit:design-system`, `npm test` (689 tests) and `npm run build` all pass, the build having been blocked until T014 published the Journal page. `.husky/pre-push` re-runs all of them, plus the browser suite (T054), when this branch is pushed.
  - _Status 2026-09-18:_ lint, typecheck, `audit:design-system` and `npm test` (689 tests) all pass. `npm run build` fails at exactly one place, prerendering `/journal`, with `Sanity document "journalPage" is required.` That is Principle I doing its job, and it clears once T014 is done.
- [ ] T060 Run every scenario in `specs/013-journal-section/quickstart.md` end to end, and put one live post URL through Google's Rich Results Test (SC-003); record the results at the bottom of `specs/013-journal-section/quickstart.md`.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: needs Setup. **Blocks every story.**
- **US1 (Phase 3)**: needs Phase 2, including **T014** (its call to action reads `journalPage`).
- **US2 (Phase 4)**: needs Phase 2. Its Studio work (T032–T036) is independent of US1; its end-to-end checks (T037–T038) view posts through US1's route.
- **US3 (Phase 5)**: needs Phase 2 and **T014** (prerendering `/journal` reads `journalPage`). Independent of US1's code, though its cards link to US1's pages.
- **Browser journeys (Phase 6)**: needs US1 and US3.
- **Polish (Phase 7)**: needs everything intended to ship.

### Within phases

- Tests before implementation; see them fail first.
- `_tokens.scss` before `_typography.scss` before the stylesheets that consume them (T021 → T022 → T025/T027; T043 → T046).
- Components before the client wrapper before the route (T024 → T025 → T027 → T028).
- Same-file tasks never run in parallel: T033–T036 all edit `journalPost.ts`; T021 and T043 both edit `_tokens.scss`; T023 and T044 both edit `structuredData.ts`; T029 and T048 both edit `PageShell.tsx`; T030 and T049 both edit `sitemap.ts`.

### Parallel opportunities

- Phase 1: T001, T002, T003 together.
- Phase 2: T004, T005, T006 together; then T007, T008, T010 together.
- US1: T015–T020 together; then T023, T024, T026, T029 together.
- US3: T039–T042 together; then T044, T045, T048 together.
- Phase 7: T055–T058 together.
- With two people, US2 (Studio) and US3 (listing) can proceed alongside each other once Phase 2 is done.

---

## Parallel Example: User Story 1

```bash
# All six US1 test files at once — different files, no shared state:
Task: "T015 BlogPosting tests in src/utils/structuredData.test.ts"
Task: "T016 embed rendering tests in src/components/journal/JournalEmbed/JournalEmbed.test.tsx"
Task: "T017 body rendering tests in src/components/journal/JournalBody/JournalBody.test.tsx"
Task: "T018 post route tests in src/app/(site)/journal/[slug]/page.test.tsx"
Task: "T019 journalPost shell variant test in src/components/layout/PageShell/PageShell.test.tsx"
Task: "T020 sitemap post entries in src/app/seo-routes.test.ts"

# Then the independent pieces of implementation:
Task: "T023 buildJournalPostSchema in src/utils/structuredData.ts"
Task: "T024 JournalEmbed in src/components/journal/JournalEmbed/"
Task: "T026 JournalCta in src/components/journal/JournalCta/"
Task: "T029 journalPost variant in src/components/layout/PageShell/PageShell.tsx"
```

---

## Implementation Strategy

### MVP first (User Story 1)

1. Phase 1 → Phase 2, and get **T014** done by the studio owner as soon as T011 lands.
2. Phase 3 (US1).
3. **Stop and validate**: one real post, reached by URL, correct metadata and JSON-LD, in the sitemap. This alone delivers the local-search value — a post can rank before a listing page exists.

### Incremental delivery

1. Setup + Foundational → the data spine, with its content-error guards tested.
2. - US1 → posts are readable and discoverable (MVP).
3. - US2 → the Studio makes scheduling and validation legible to the editor.
4. - US3 → the listing and the navigation entry.
5. - Browser journeys and Polish → the push hook's e2e run covers the journal, and the retrospective specs match reality.

### Pushing along the way

`.husky/pre-push` runs the build and the browser suite. Two consequences:

- From the moment `/journal` exists (T047), a push fails unless `journalPage` is
  published in the dataset — hence T014's position.
- The e2e journeys (Phase 6) skip rather than fail on an empty journal, so they
  can land before the first real post does.

---

## Notes

- **[Content]** tasks (T014, T050) are for the studio owner in the Studio, not
  for an implementing agent. An agent must not author her copy (Principle I).
- The embed allow-list in `contracts/embed-providers.md` is a security control;
  a provider change is a reviewed change with tests, not a quick edit.
- Commit after each task or logical group. Stop at any checkpoint to validate a story on its own.
