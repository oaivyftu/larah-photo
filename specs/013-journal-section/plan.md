# Implementation Plan: Journal Section

**Branch**: `claude/larah-photo-journal-section-b8238c` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-journal-section/spec.md`

## Summary

Add a Journal section — `/journal` and `/journal/<slug>` — publishable entirely
from the Studio, carrying `BlogPosting` and breadcrumb structured data into the
sitemap and the primary navigation. Almost all of it is the `/work` pattern with
different fields: same shell, same cache tag and webhook, same content-error
discipline, same metadata helper.

Three parts have no precedent in this codebase, and they are where the risk is:
a **rich body** (Portable Text, rendered with the component `next-sanity`
already re-exports, so no new dependency), **scheduling** (a `publishedAt <=
$today` predicate written once into a shared GROQ fragment, with the existing
hourly ISR supplying the "within an hour" the spec promises), and **embeds**
(three allow-listed providers, normalised server-side to their no-tracking URLs,
rendered as a lazy `iframe` in a space-reserving box).

## Technical Context

**Language/Version**: TypeScript (strict), Next.js 16.2.9 App Router, React 19.2.4

**Primary Dependencies**: **none added.** Portable Text rendering comes from
`@portabletext/react` 6.2.0, already installed as a `next-sanity` 13.1.1
dependency and re-exported from its root entry; the code imports `PortableText`
from `next-sanity`, a declared dependency, rather than reaching into a
transitive one (research.md §1). Embeds are plain iframes — no player library
(§4). This keeps the feature inside Technology Constraints without needing a
justification clause.

**Storage**: Sanity Content Lake. Two new document types (`journalPost`,
`journalPage`) and three Portable Text member types. No other datastore; no
migration — new types are additive and existing documents are untouched.

**Testing**: Vitest for unit and integration (including async Server Components
called and awaited directly, per `AGENTS.md`); Playwright for one new
`e2e/journal.spec.ts` under `underBothMotionPreferences`. Coverage plan in
research.md §8; DOM handles and the empty-dataset rule in
contracts/test-surface.md.

**Target Platform**: the existing Next.js app on Vercel, prerendered and
revalidated hourly under the shared `sanity` cache tag.

**Project Type**: web application, single Next.js project.

**Performance Goals**: no new image budget (Principle III) — journal images use
the existing `deviceSizes`/`qualities` allow-list, so `next.config.ts` is
untouched and no tradeoff statement is required. Embeds must not delay the
article: lazy-loaded, space reserved, and a blocked embed leaves the post fully
readable (FR-002d, SC-007a).

**Constraints**: Principle I dominates the data path — every required field
raises rather than degrading, including the new Journal page settings, with the
one deliberate exception that a third-party embed failing to load is not a
content error (contracts/embed-providers.md). Principle VII dominates the view
layer: new values become `--journal-*` tokens before they are used, and
`npm run audit:design-system` must exit 0. Scheduling is approximate by
construction — bounded by the hourly revalidate, which is what SC-002 states.

**Scale/Scope**: a couple of posts a month; single unpaginated listing. Roughly
two routes, two schema types, three Portable Text members, four fetchers, two
structured-data builders, one sitemap change, one `PageShell` variant pair, one
new token family, and the test files for each.

## Constitution Check

_GATE: checked before Phase 0, re-checked after Phase 1 design._

| Principle                                       | Gate                                                              | Status after design                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Sanity is the sole source of content         | No hardcoded copy; missing required data raises                   | **Pass.** All post and listing copy — including the empty state and the call-to-action wording — comes from `journalPage`/`journalPost`. Only `/contact` and `/work` destinations stay in code, as structure rather than copy. Guards reuse `requireString`/`resolveSanityImage`. The embed exception is stated and scoped (contracts/embed-providers.md rule 3). |
| II. Accessibility is non-negotiable             | jsx-a11y clean; correct semantics before merge                    | **Pass by design.** Post title is the page's only `h1` and the Studio cannot offer `h1` in the body; inline images require alt; captions never substitute for alt; every embed `iframe` carries an editor-written `title`; reduced-motion variant covered in e2e.                                                                                                 |
| III. Performance and image delivery budgeted    | `next.config.ts` image changes must state a tradeoff              | **Pass — no change.** No new sizes, formats or qualities. Embeds are lazy and space-reserving.                                                                                                                                                                                                                                                                    |
| IV. Design fidelity through shared tokens       | Motion/visual values shared, not duplicated                       | **Pass.** Reuses `usePageIntro` for both routes' entry animation; adds no new motion constants.                                                                                                                                                                                                                                                                   |
| V. Critical flows require test coverage         | Content-error handling is a named critical flow                   | **Pass.** Fetcher guard tests extend `src/sanity/fetchers.test.ts`; route-level content-error and 404 paths covered as integration tests; e2e adds the journal journeys (research.md §8).                                                                                                                                                                         |
| VI. Stay current with this Next.js version      | Consult `node_modules/next/dist/docs/` before using a Next.js API | **Pass — after a correction.** The plan's first draft wrongly said the docs were not installed; that came from an incomplete `node_modules` in the main checkout (research.md §9). The docs were consulted during implementation, and they changed one decision: listing cards use `loading="eager"`, not `preload`.                                              |
| VII. One design system, one place for shared UI | Check `src/components/ui/` first; promote on second use           | **Pass.** Reuses `PageHeading`, `LarahImage`, `JsonLd`, `PageShell`. The post `h1` is deliberately _not_ `PageHeading` — different element, different layout need, nothing copied (research.md §7). New Portable Text renderer components live under `src/components/journal/` and compose existing primitives.                                                   |

No violations to justify, so **Complexity Tracking is omitted**.

## Project Structure

### Documentation (this feature)

```text
specs/013-journal-section/
├── plan.md              # This file
├── spec.md
├── research.md          # Phase 0 — ten decisions
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 — validation scenarios
├── contracts/           # Phase 1
│   ├── content-model.md     # what the Studio offers and refuses
│   ├── embed-providers.md   # the allow-list, and why it is the control
│   ├── routes-and-seo.md    # routes, metadata, structured data, sitemap
│   └── test-surface.md      # DOM handles + the empty-dataset rule
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 — /speckit-tasks, not created here
```

### Source code

```text
src/
├── app/
│   ├── (site)/journal/
│   │   ├── page.tsx                  # listing + metadata + CollectionPage JSON-LD
│   │   ├── page.test.tsx
│   │   ├── JournalListClient.tsx     # entry animation via usePageIntro
│   │   ├── journal.module.scss
│   │   └── [slug]/
│   │       ├── page.tsx              # post + metadata + BlogPosting JSON-LD
│   │       ├── page.test.tsx
│   │       ├── JournalPostClient.tsx
│   │       └── post.module.scss
│   └── sitemap.ts                    # + /journal and live posts
├── components/journal/               # composes ui/ primitives, adds no duplicates
│   ├── JournalCard/
│   ├── JournalBody/                  # PortableText component map
│   ├── JournalEmbed/
│   └── JournalCta/
├── components/layout/PageShell/PageShell.tsx   # + journal, journalPost variants
├── constants/journalCategories.ts    # imported by schema AND fetcher
├── sanity/
│   ├── schemaTypes/journalPost.ts
│   ├── schemaTypes/journalPage.ts
│   ├── schemaTypes/index.ts          # register both
│   ├── queries.ts                    # + 4 queries sharing one live-post fragment
│   └── fetchers.ts                   # + 4 fetchers, 2 new guards
├── types/journal.ts
├── utils/
│   ├── journalDate.ts                # today-in-Toronto + display formatting
│   ├── journalEmbed.ts               # provider match + normalisation
│   └── structuredData.ts             # + buildJournalPostSchema, buildJournalCollectionSchema
└── styles/
    ├── _tokens.scss                  # + --journal-* semantic family
    └── _typography.scss              # + long-form type styles

e2e/
├── journal.spec.ts
├── journeys/journal.ts
└── support/content.ts                # + openJournalIndex, firstJournalPost
```

**Structure Decision**: mirrors `/work` — route folder with a client component
for the animated shell, a feature component folder under `src/components/`, and
schema/query/fetcher/type/util changes in their existing homes. No new top-level
directory. `src/components/journal/` is a feature folder in the Principle VII
sense: it composes `ui/` primitives and owns nothing shareable. If a second
surface ever needs the embed or the Portable Text renderer, they get promoted
to `src/components/ui/` at that point, not pre-emptively.

## Downstream spec updates (do these in the same change)

The spec's Assumptions already name these; repeating them here so they land in
`tasks.md` rather than being remembered:

- `specs/006-site-navigation-shell/spec.md` — two new shell variants and a
  section the nav can mark current.
- `specs/007-cms-studio-content-sync/spec.md` — FR-001's list of content types
  the Studio must cover.
- `specs/008-seo-metadata/spec.md` — FR-001's sitemap contents and the list of
  public pages and structured-data types.
- `specs/README.md` — move 013 from "not yet planned" once tasks exist.

## Phase status

- **Phase 0 (research)**: complete — [research.md](./research.md), ten
  decisions, no unresolved NEEDS CLARIFICATION.
- **Phase 1 (design)**: complete — [data-model.md](./data-model.md), four
  contracts, [quickstart.md](./quickstart.md). Constitution re-checked above.
- **Phase 2 (tasks)**: not started. `/speckit-tasks` next.
