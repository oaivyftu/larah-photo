# Implementation Plan: Service Landing Pages

**Branch**: `claude/larah-service-landing-pages-2c6a15` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-service-landing-pages/spec.md`

## Summary

One landing page per service package, served at `/<slug>` (for example
`/engagement-photographer-london-ontario`), created, held back and removed by an
editor in the Studio with no code change. Each page carries the studio's own
substantial text — an introduction, at least three content sections and at least
five questions — plus the published projects in its category, the matching
service package with its starting price, and a route to the contact page. It
declares `Service`, `FAQPage` and breadcrumb structured data tied to the existing
business identity, appears in the sitemap only while live, and is linked from the
services page and from each matching project.

Most of this is the journal pattern again (one cache tag and webhook, one
fetcher discipline, one metadata helper). Four parts have no precedent here, and
they are where the risk is:

1. **A top-level dynamic route** beside static ones, that must go live for a
   never-seen slug without a deploy (research §1). Chosen: one `[landingSlug]`
   segment, a shape gate before any CMS read, and a **per-slug** lookup rather
   than a shared slug list, because under `revalidateTag(…, "max")` a shared list
   is stale on the first visit after a publish.
2. **Quality enforced as data, not as hope** (research §4): word minimums as pure
   functions behind Studio validators, one constants module, and a check of the
   launch content in `npm test` — because launch content arrives by import, which
   skips the Studio entirely.
3. **Honesty enforced mechanically** (research §10): AI-written copy marks every
   unknown studio fact `[[CONFIRM: …]]`; the Studio refuses to switch a page on
   while one remains or without the owner's approval, and the site refuses to
   render one.
4. **One source for the package** (research §5): the services page and the
   landing page share one GROQ fragment and one mapper, and two components
   (`CallToAction`, `ServicePackageDetails`) are promoted into shared code because
   this feature is their second use.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js 16.2.9 App Router, React 19.2.4

**Primary Dependencies**: **none added.** Sanity (`sanity` 6.3.0, `next-sanity`
13.1.1) for the content types and fetchers; `@sanity/types` for the validator
result shape. No Portable Text (plain-text paragraphs; research §9), no
accordion, no word-count or diff library (a ten-line `countWords`). This keeps
the feature inside Technology Constraints with no justification clause.

**Storage**: Sanity Content Lake. Two new document types, `serviceLandingPage`
and `serviceLandingSettings`, additive; no migration. Launch content arrives by
`sanity dataset import --missing` (research §10).

**Testing**: Vitest for unit and integration, including async Server Components
called and awaited directly (`AGENTS.md`); Playwright for one new
`e2e/landing.spec.ts` under `underBothMotionPreferences`. Layer-by-layer plan in
research §13; handles in [contracts/test-surface.md](./contracts/test-surface.md).

**Target Platform**: the existing Next.js app on Vercel, prerendered and
revalidated hourly under the shared `sanity` cache tag; the webhook busts it
within seconds of a publish.

**Project Type**: web application, single Next.js project.

**Performance Goals**: no new image budget (Principle III): the package image,
project cards and any media reuse the existing `deviceSizes`, `imageSizes` and
`qualities`, so `next.config.ts` is untouched and no tradeoff statement is
needed. Only images in or near the first viewport load eagerly (FR-034). The
landing page adds no client JavaScript beyond `WorkCard` and `usePageIntro`,
both already on `/work`.

**Constraints**: Principle I dominates the data path: every required field
raises rather than degrades, including the package, the settings and any
`[[CONFIRM`. Principle VII dominates the view layer: new values become
`--landing-*` and `--cta-*` tokens first; `npm run audit:design-system` exits 0;
nothing is copied between feature folders. A route at the site root must not
shadow `/work` and its siblings (research §1).

**Scale/Scope**: four pages at launch, a few more over time; dozens of projects;
one new route, two schema types, one shared constants module, four utilities,
three fetchers plus one extraction, three structured-data builders and one
shared offer helper, one sitemap change, one `PageShell` variant, two promoted
shared components, one new component folder, one e2e spec, four content briefs
and one content import file.

## Constitution Check

_GATE: checked before Phase 0, re-checked after Phase 1 design._

| Principle                                       | Gate                                                       | Status after design                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Sanity is the sole source of content         | No hardcoded copy; missing required data raises            | **Pass, with one noted relocation.** Every landing word — heading pattern, service name, introduction, sections, questions, headings, call-to-action wording, search title and description — is in `serviceLandingPage` / `serviceLandingSettings`. Guards use `requireString` / `resolveSanityImage`, and a leftover `[[CONFIRM` raises (a placeholder cannot reach a visitor). The package block's "STARTING FROM" is moved, unchanged, into the shared `ServicePackageDetails` (a relocation, not new copy); its booking button's text is the settings field `packageBookLabel`, so no landing component carries a literal. The existing "Book now" literals on the services and home pages are left alone, as the brief forbids touching the home page's copy (research §12). The `" & "` joiner is punctuation between two editor-supplied names, not copy. |
| II. Accessibility is non-negotiable             | jsx-a11y clean; correct semantics before merge             | **Pass by design.** One `h1`; section, project, package and question headings nested beneath it; the FAQ is always open, so no new interactive element exists to mislabel (research §9); every image has editor alt text; reduced motion covered in e2e; the project and package links are real links with descriptive text (FR-029).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| III. Performance and image delivery budgeted    | `next.config.ts` image changes must state a tradeoff       | **Pass — no change.** No new sizes, formats or qualities.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| IV. Design fidelity through shared tokens       | Motion/visual values shared, not duplicated                | **Pass.** The entry animation is `usePageIntro`; no motion constant is added. Visual values become tokens first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| V. Critical flows require test coverage         | Content-error handling is a named critical flow            | **Pass.** Fetcher guard tests extend `src/sanity/fetchers.test.ts` for every landing field, the package states and the marker; the page's 404 and content-error paths are integration-tested; the e2e spec covers the real navigation and the HTTP status. The coverage map below ties each FR to a test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| VI. Stay current with this Next.js version      | Consult `node_modules/next/dist/docs/` before using an API | **Pass.** Read: `dynamic-routes`, `dynamicParams`, `generate-static-params`, `not-found` (file and function), `revalidateTag`, `incremental-static-regeneration`, `sitemap`. Two findings changed the design: stale-while-revalidate (per-slug lookup, research F5) and `notFound()` returning 200 when streamed (a status-code e2e check, F6). One thing the docs do not state — static-over-dynamic precedence — is verified by test, not assumed (research §1).                                                                                                                                                                                                                                                                                                                                                                                               |
| VII. One design system, one place for shared UI | Check `src/components/ui/` first; promote on second use    | **Pass, by two promotions.** `CallToAction` (second use after `JournalCta`) moves to `src/components/ui/`; `ServicePackageDetails` (second use after `ServiceExperience`) moves to `src/components/service/`. Both prior consumers become call sites of the shared version, with `audit:css-diff` proving no visible change. `PageHeading`, `Button`, `LarahImage`, `WorkCard`, `JsonLd` and `PageShell` are reused as they are. The FAQ and sections have one consumer and stay in `components/landing/`.                                                                                                                                                                                                                                                                                                                                                       |

**Technology Constraints:** stack unchanged, no new dependency, `any` not
introduced. **Development Workflow gates:** lint, typecheck, `npm test`,
`npm run build` and `npm run test:e2e` all apply and are in the quickstart.

No violations to justify, so **Complexity Tracking is omitted.**

## Requirements coverage

Where each requirement is satisfied, and the test that proves it.

| Requirement                                                              | Satisfied by                                                                                  | Proven by                                                                                                                                     |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001, FR-005, FR-007, FR-008, FR-043 — content model                   | `serviceLandingPage.ts`, `serviceLandingSettings.ts`                                          | `landingPage.test.ts` (declared fields and rules); Studio load, quickstart §3                                                                 |
| FR-002 — live = published AND switch on                                  | `liveLandingPageFilter` in `queries.ts`; `published` field; `approvedAgainstBrief`            | `fetchers.test.ts` (filter appears in every landing query); sitemap, services and project tests with a held-back page                         |
| FR-003, FR-004, FR-006 — uniqueness, slug, advisories                    | Studio validators calling `categoriesMatch`, `LANDING_SLUG_PATTERN`, `RESERVED_ROOT_SEGMENTS` | `landingSlug.test.ts`, `formatWorkCategory.test.ts`, reserved-route drift test                                                                |
| FR-009 — live with no deploy, new slugs included                         | `[landingSlug]` + default `dynamicParams` + per-slug lookup + shared cache tag                | Page test (unknown → 404, known → renders); quickstart §7 (needs a live Studio and webhook)                                                   |
| FR-010, FR-019, FR-020 — route, 404, shell                               | `[landingSlug]/page.tsx`, `PageShell variant="landing"`                                       | Page test (`notFound` throws); e2e L5 (status code); `PageShell.test.tsx`                                                                     |
| FR-011, FR-013, FR-029, FR-043 — heading, alternate name, link text      | `composeLandingHeading`, `PageHeading`                                                        | `landingHeading.test.ts` (with and without alternate name, pattern); page test (single `h1`, both names)                                      |
| FR-012, FR-038, FR-042 — intro, sections, editor text the larger share   | `page.tsx` (composition order), `LandingSections`                                             | Page test (order); share test (editor words exceed package words at the minimums)                                                             |
| FR-014, FR-015 — projects, thin and empty                                | `LandingProjects` over `getWorkProjects()` + `categoriesMatch`                                | Page test with 2 projects, with 0; `categoriesMatch` with case and spacing variants                                                           |
| FR-016 — package, same data as the services page                         | `servicePackageFields`, `mapSanityService`, `ServicePackageDetails`                           | `fetchers.test.ts` (`getServices` unchanged; landing package equals services package); page test                                              |
| FR-017 — questions                                                       | `LandingFaq` (always open)                                                                    | Page test (every answer present); e2e L4                                                                                                      |
| FR-018 — contact route                                                   | `LandingCta` over `CallToAction`                                                              | Page test (`a[href="/contact"]` in `data-landing-cta`); e2e L2                                                                                |
| FR-021 — metadata                                                        | `generateMetadata` via `pageMetadata`                                                         | Page test (`generateMetadata` for live and not live)                                                                                          |
| FR-022 to FR-025 — structured data                                       | `buildLandingServiceSchema`, `buildLandingFaqSchema`, shared offer helper, breadcrumb         | `structuredData.test.ts` (alternateName only when set; `@id` reference; FAQ text equals page text; `buildServiceListSchema` output unchanged) |
| FR-026 — sitemap                                                         | `sitemap.ts` + `getLandingPages()`                                                            | `seo-routes.test.ts` (live listed with image and `lastModified`; held back absent; malformed raises)                                          |
| FR-027, FR-028 — inbound links                                           | `getLandingPageLinks()`; `ServiceExperience` prop; `WorkDetailGallery` `landingLink`          | Services and project page tests (link only for live); e2e L1, L3                                                                              |
| FR-030 — nothing else changes                                            | No edit to nav items, work filter or home copy                                                | Existing suites stay green; `PageShell` test pins nav items                                                                                   |
| FR-031 — content errors                                                  | `mapLandingPage`, `getLandingPageSettings`, package join                                      | `fetchers.test.ts`, one case per required field, missing/unpublished/priceless package, `[[CONFIRM`                                           |
| FR-032 to FR-036 — alt text, reduced motion, image loading, a11y, tokens | `LarahImage`, `usePageIntro`, tokens, jsx-a11y                                                | Lint; `audit:design-system`; e2e under `reduce`; page test                                                                                    |
| FR-039, FR-040 — minimums, accuracy                                      | `assessLandingPageQuality`, Studio validators, `[[CONFIRM` rule                               | `landingPageQuality.test.ts` (exact, one under, whitespace-only, lone punctuation); launch-content suite                                      |
| FR-041 — brief and approval                                              | `contracts/briefs/`, `approvedAgainstBrief`, `published` validator                            | Quickstart §3 and §9; launch-content suite (`approvedAgainstBrief: false`)                                                                    |
| FR-037 — coverage list                                                   | This table                                                                                    | Every row above                                                                                                                               |

## Project Structure

### Documentation (this feature)

```text
specs/014-service-landing-pages/
├── plan.md              # This file
├── spec.md              # Amended 2026-10-07: FR-038–FR-043, SC-012, SC-013
├── research.md          # Phase 0 — 9 findings and 14 numbered sections
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 — ten validation scenarios
├── contracts/           # Phase 1
│   ├── content-model.md     # what the Studio offers, blocks and advises
│   ├── routes-and-seo.md    # routes, metadata, JSON-LD, sitemap, links
│   ├── test-surface.md      # DOM handles + the empty-dataset rule + journeys
│   └── briefs/              # per-service content briefs (FR-041)
│       ├── README.md
│       ├── portrait.md
│       ├── engagement.md
│       ├── family.md
│       └── graduation.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 — /speckit-tasks, not created here
```

### Source code

```text
src/
├── app/
│   ├── (site)/
│   │   ├── [landingSlug]/
│   │   │   ├── page.tsx                  # shape gate, lookup, metadata, JSON-LD, 404
│   │   │   ├── page.test.tsx
│   │   │   ├── LandingExperience.tsx     # client wrapper: usePageIntro only
│   │   │   └── landing.module.scss
│   │   ├── service/page.tsx              # + getLandingPageLinks → ServiceExperience
│   │   ├── service/ServiceExperience.tsx # + landingLinks prop; uses ServicePackageDetails
│   │   └── work/[slug]/page.tsx          # + landing link → WorkDetailGallery
│   ├── sitemap.ts                        # + live landing pages
│   └── seo-routes.test.ts                # + landing cases
├── components/
│   ├── landing/                          # composes ui/ primitives, adds no duplicates
│   │   ├── LandingSections/
│   │   ├── LandingProjects/              # WorkCard in a plain grid (no Isotope)
│   │   ├── LandingPackage/               # ServicePackageDetails + Button + LarahImage
│   │   ├── LandingFaq/
│   │   └── LandingCta/                   # CallToAction wrapper
│   ├── ui/CallToAction/                  # PROMOTED from journal/JournalCta
│   ├── service/ServicePackageDetails/    # PROMOTED from ServiceExperience
│   ├── journal/JournalCta/               # now a thin wrapper over CallToAction
│   ├── work/WorkDetailGallery/           # + optional landingLink (page presentation only)
│   └── layout/PageShell/                 # + "landing" variant → "/service" current
├── constants/
│   ├── landingPage.ts                    # quality numbers, marker, slug rules, placeholders
│   └── reservedRoutes.ts                 # imported by the Studio and the page
├── sanity/
│   ├── schemaTypes/serviceLandingPage.ts
│   ├── schemaTypes/serviceLandingSettings.ts
│   ├── schemaTypes/landingPage.test.ts
│   ├── schemaTypes/index.ts              # register both
│   ├── queries.ts                        # + servicePackageFields, liveLandingPageFilter, 4 queries
│   └── fetchers.ts                       # + 3 fetchers, mapSanityService extracted
├── types/landing.ts
├── utils/
│   ├── wordCount.ts
│   ├── landingPageQuality.ts             # assessLandingPageQuality — Studio + tests share it
│   ├── landingHeading.ts
│   ├── landingSlug.ts
│   ├── formatWorkCategory.ts             # + categoriesMatch
│   └── structuredData.ts                 # + 2 builders, shared offer helper
└── styles/_tokens.scss                   # + --landing-*, --cta-* (replaces --journal-cta-*)

e2e/
├── landing.spec.ts
├── journeys/landing.ts
└── support/content.ts                    # + firstLandingPageHref

content/service-landing-pages/
├── README.md                             # what this is; the import command; not edited after import
├── settings.json                         # the shared settings document
├── portrait.json  engagement.json
└── family.json    graduation.json        # one document each; published:false, approved:false

specs/ (retrospective edits, same change)
002-work-gallery · 004-services-page · 006-site-navigation-shell ·
007-cms-studio-content-sync · 008-seo-metadata
```

**Structure Decision:** single Next.js project. The route and its client
wrapper live where the journal's do. Shared logic is pure TypeScript in
`src/utils/` and `src/constants/` with **no `@/` imports** in anything the Studio
loads (the Sanity CLI bundler does not read the alias; `journalPost.ts` imports
relatively for the same reason). `content/` is new and top-level because the launch
copy is production content that is neither documentation (`specs/`) nor code
(`src/`).

## Phase 0 and Phase 1 outputs

| Artifact                                                                         | Status                                |
| -------------------------------------------------------------------------------- | ------------------------------------- |
| [research.md](./research.md)                                                     | Done                                  |
| [data-model.md](./data-model.md)                                                 | Done                                  |
| [contracts/](./contracts/) — content-model, routes-and-seo, test-surface, briefs | Done                                  |
| [quickstart.md](./quickstart.md)                                                 | Done                                  |
| `tasks.md`                                                                       | **Not created.** Run `/speckit-tasks` |

## Open decisions for the owner

The plan took a position on each of these. They are cheap to reverse now and
costly after the pages are indexed. In order of how much each matters:

1. **Thin content is refused by the Studio and the launch test, not by the site at
   run time** (research §4b). A page at 390 words is short, not missing data; a
   runtime floor would take live pages down when the floor is raised later. The
   cost: content that bypasses the Studio is only caught by the launch-content
   test, so a future bulk import would need its own check.
2. **`serviceName` and `headingPattern` are new fields** (FR-043, research §8). The
   heading is built from them, not from the package title, because the package
   title is written for the services page and could not be seen from here. The
   cost: one extra field per page.
3. **The Studio carries an `approvedAgainstBrief` checkbox**, and refuses the
   switch without it (research §10). It makes "the owner approved it" a step the
   Studio enforces rather than a note in git the owner will never see. The cost:
   one tick per page.
4. **Projects sit after the sections and before the package** (research §9). A
   service page explains, shows proof, then prices. With Portrait's 13 projects the
   price is below a long grid; moving the work up is a four-line change if the
   numbers say people leave first.
5. **Landing pages mark Services as the current navigation item.** The nav's items
   do not change (FR-030).
6. **No rich text** in sections or answers (research §9). The FAQ markup must
   equal the visible text; plain text makes that true by construction.

**Two things this plan could not do from here**, both for the same reason (no
`.env.local`, so no dataset read): confirm the real package titles, and confirm
that `/work` keeps winning over `[landingSlug]` and a new slug goes live inside a
minute. The first is quickstart §9, the second quickstart §2 and §7. Neither is a
reason to doubt the design, but neither is yet observed.
