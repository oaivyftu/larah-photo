# Contract: Journal Routes, Metadata and Structured Data

**Feature**: 013-journal-section | **Date**: 2026-09-15

What the two new routes must emit. Everything here is assertable without a
browser, and most of it is asserted in `src/app/seo-routes.test.ts`'s style.

---

## Routes

| Route             | Renders                                   | Shell variant | Not-found when                          |
| ----------------- | ----------------------------------------- | ------------- | --------------------------------------- |
| `/journal`        | listing, newest first, or the empty state | `journal`     | never (an empty journal is valid)       |
| `/journal/[slug]` | one post                                  | `journalPost` | slug unknown, unpublished, or scheduled |

Both prerender and refresh on the existing hourly ISR under the shared `sanity`
cache tag. `generateStaticParams` returns live slugs only; `dynamicParams` keeps
its default so a newly-live post renders on first request (research.md §6).

`PageShell`'s `activeHrefByVariant` maps **both** variants to `/journal`, so the
navigation marks the section as current on the listing and on every post
(FR-024) — the same way `project` maps to `/work`.

## Metadata

| Route             | Title                                         | Description                                           | Canonical         | OG image                                   |
| ----------------- | --------------------------------------------- | ----------------------------------------------------- | ----------------- | ------------------------------------------ |
| `/journal`        | "Journal"                                     | derived, naming the studio's location                 | `/journal`        | newest post's cover, else the site default |
| `/journal/[slug]` | `seoTitle` if set and non-blank, else `title` | `seoDescription` if set and non-blank, else `excerpt` | `/journal/<slug>` | the post's cover, via `toOpenGraphImage`   |

Blank-after-trim overrides count as unset (spec Edge Cases). A slug that
resolves to nothing returns `{ title: "Post not found", robots: { index: false } }`,
matching `/work/[slug]`'s existing handling.

All of it goes through the existing `pageMetadata()` helper — this feature adds
no second way to build metadata.

## Structured data

| Route             | Emits                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `/journal`        | `CollectionPage` + `ItemList` of live posts; breadcrumb Home › Journal |
| `/journal/[slug]` | `BlogPosting`; breadcrumb Home › Journal › post title                  |

`BlogPosting` carries `headline`, `description`, `image`, `datePublished`
(the authored date), `dateModified` (`_updatedAt`), `author` and `publisher` as
`{ "@id": businessId }`, `mainEntityOfPage`, `isPartOf: websiteId`,
`inLanguage: "en"`, `articleSection` (category) and `contentLocation`
(location). The business itself is still emitted once by `PageShell`, and is
referenced by `@id` rather than restated (spec 008 FR-005).

Both builders live in `src/utils/structuredData.ts` beside the existing ones and
reuse `compact()`, so no empty property is ever claimed (SC-003).

## Sitemap

`src/app/sitemap.ts` gains `/journal` plus one entry per live post:

```text
{ url: absoluteUrl(`/journal/${slug}`),
  lastModified: post.updatedAt,        // the post's own last edit
  images: [coverImage, ...bodyImages] }
```

Scheduled, unpublished and deleted posts appear nowhere (FR-022). Per-post
`lastModified` deliberately differs from the work entries' build-time stamp
(research.md §6).

## Navigation

The `/journal` entry is added by an editor in site settings, not in code
(FR-024, Principle I). Until she adds it, the section is reachable by URL,
search and sitemap but absent from the header — a valid intermediate state, and
one the quickstart calls out.
