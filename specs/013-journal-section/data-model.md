# Data Model: Journal Section

**Feature**: 013-journal-section | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

Two new Sanity document types, three new Portable Text member types, and the
TypeScript shapes the site maps them into. Field-level decisions trace to the
spec's requirements; the reasoning behind the shapes is in
[research.md](./research.md).

---

## Document: `journalPost`

| Field            | Type                    | Required | Rule                                                               | Source         |
| ---------------- | ----------------------- | -------- | ------------------------------------------------------------------ | -------------- |
| `title`          | `string`                | yes      | non-empty                                                          | FR-001         |
| `slug`           | `slug`                  | yes      | unique across `journalPost`; generated from `title`                | FR-001         |
| `coverImage`     | `image` + `alt`         | yes      | uses the existing `imageField()` helper, so alt text is required   | FR-001         |
| `excerpt`        | `text`                  | yes      | non-empty; **warning** above 200 characters                        | FR-001/005     |
| `body`           | `array` (Portable Text) | yes      | at least one member                                                | FR-001/002     |
| `location`       | `string`                | yes      | free text, "venue, city, province"                                 | FR-001         |
| `category`       | `string`                | yes      | one of `JOURNAL_CATEGORIES`                                        | FR-003         |
| `publishedAt`    | `date` (`YYYY-MM-DD`)   | yes      | defaults to today; a future value schedules the post               | FR-001/007a    |
| `seoTitle`       | `string`                | no       | **warning** above 60 characters; blank is treated as unset         | FR-001/005/017 |
| `seoDescription` | `text`                  | no       | **warning** above 160 characters; blank is treated as unset        | FR-001/005/017 |
| `_updatedAt`     | (Sanity system)         | —        | read only; becomes the sitemap's `lastModified` and `dateModified` | FR-019/021     |

**Preview**: title, with `Scheduled · <date>` as the subtitle while the date is
ahead and the date alone once it has arrived, and the cover image as media
(FR-007b). It never says "Live": a preview cannot see publish state, so an
unpublished draft would read as live. Sanity's draft/published badge carries
that half.

**Warnings vs errors**: `rule.required()` and the slug-uniqueness check block
publishing. The three length rules use `rule.warning()` — they advise and do not
block, which is FR-005 exactly.

### Lifecycle

```text
draft ──publish──▶ scheduled  (publishedAt > today in America/Toronto)
                        │
                   date arrives, next revalidation (≤ 1h)
                        ▼
                      live  ──unpublish/delete──▶ gone (URL 404s)
```

`scheduled` is not a stored state. It is what `publishedAt > $today` means at
query time, so nothing has to write it, and nothing can leave it stale
(research.md §2).

---

## Document: `journalPage` (singleton)

| Field               | Type            | Required | Rule                                                      | Source     |
| ------------------- | --------------- | -------- | --------------------------------------------------------- | ---------- |
| `titleWords`        | `array<string>` | yes      | reuses the shared `titleWordsField`; drives `PageHeading` | FR-006     |
| `emptyStateMessage` | `text`          | yes      | shown when no post is live                                | FR-006/015 |
| `ctaHeading`        | `string`        | yes      | end-of-post call to action                                | FR-006/011 |
| `ctaBody`           | `text`          | yes      | supporting line                                           | FR-006/011 |
| `ctaContactLabel`   | `string`        | yes      | link text to `/contact`                                   | FR-011     |
| `ctaWorkLabel`      | `string`        | yes      | link text to `/work`                                      | FR-011     |

All six are required: a missing one is a content error, not a silent default
(Principle I, FR-025). The destinations `/contact` and `/work` are structural
and stay in code — only the wording is editor-owned.

---

## Portable Text members

### `block` (the built-in)

- **Styles**: normal, `h2`, `h3`, `h4`, and `blockquote` (the pull quote,
  FR-002). No `h1` — the post title owns the page's only top-level heading, so
  the outline cannot be broken from the Studio (spec Edge Cases).
- **Lists**: bullet and numbered (FR-002).
- **Marks — decorators**: strong, em (FR-002).
- **Marks — annotations**: `link`, with a required `href` validated as
  `http`/`https`/`mailto`; internal links are written as site-relative paths.

### `bodyImage`

| Field     | Type     | Required | Rule                                         | Source  |
| --------- | -------- | -------- | -------------------------------------------- | ------- |
| `asset`   | image    | yes      | hotspot enabled, as elsewhere on the site    | FR-002  |
| `alt`     | `string` | yes      | blocks publishing when empty                 | FR-002a |
| `caption` | `string` | no       | displayed to everyone; never substitutes alt | FR-002a |

### `embed`

| Field   | Type     | Required | Rule                                                       | Source  |
| ------- | -------- | -------- | ---------------------------------------------------------- | ------- |
| `url`   | `url`    | yes      | must match an allowed provider pattern, else publish fails | FR-002b |
| `title` | `string` | yes      | the accessible name of the frame                           | FR-002c |

The provider is **derived** from the URL, not chosen by the editor — one field
fewer to get wrong, and it cannot contradict the URL. Patterns, normalisation
and rendering rules are in
[contracts/embed-providers.md](./contracts/embed-providers.md).

---

## Runtime types (`src/types/journal.ts`)

```ts
export type JournalPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // YYYY-MM-DD, as authored
  category: JournalCategory; // from JOURNAL_CATEGORIES
  location: string;
  coverImage: ProjectImage; // the existing resolved-image shape
  updatedAt: string; // ISO, from _updatedAt
  bodyImages: ProjectImage[]; // flattened, for the sitemap
};

export type JournalPost = JournalPostSummary & {
  body: JournalBodyBlock[]; // Portable Text | resolved image | resolved embed
  seoTitle?: string;
  seoDescription?: string;
};

export type JournalPageContent = {
  titleWords: string[];
  emptyStateMessage: string;
  cta: {
    heading: string;
    body: string;
    contactLabel: string;
    workLabel: string;
  };
};
```

`updatedAt` and `bodyImages` sit on the **summary**, not only on the full post.
The first draft put them on the full post, but the sitemap reads summaries and
needs both. The summary query projects `bodyImages` directly
(`body[_type == "bodyImage"]{…}`), so the index never fetches whole bodies.

`ProjectImage` is reused rather than re-declared: `resolveSanityImage()` already
produces it and already throws when an asset, its alt text or its dimensions are
missing, which is FR-025 for free.

---

## Queries (`src/sanity/queries.ts`)

Every public query carries the same predicate, `_type == "journalPost" &&
defined(slug.current) && publishedAt <= $today`, written once as a shared
fragment so a new query cannot omit it.

| Query                    | Returns                                               | Used by                                   |
| ------------------------ | ----------------------------------------------------- | ----------------------------------------- |
| `journalPageQuery`       | the singleton                                         | listing, post CTA                         |
| `journalPostsQuery`      | summaries, `order(publishedAt desc, _createdAt desc)` | listing, sitemap, listing structured data |
| `journalPostBySlugQuery` | one full post, or null                                | post page, `generateMetadata`             |
| `journalPostSlugsQuery`  | live slugs only                                       | `generateStaticParams`, sitemap           |

The `_createdAt desc` tiebreak is FR-013's "stable order for posts sharing a
date", resolved in the query rather than in a JS sort, so every consumer agrees.

---

## Fetchers (`src/sanity/fetchers.ts`)

New: `getJournalPage()`, `getJournalPosts()`, `getJournalPostBySlug(slug)`,
`getJournalPostSlugs()`. They follow the existing shape exactly — `fetchSanity`
for the cache tag and the configuration guard, `requireString` /
`requireValue` / `requireDocument` for the field guards, `resolveSanityImage`
for images — and add two of their own:

- `requireJournalCategory(value, field)` — membership in `JOURNAL_CATEGORIES`.
- `requireEmbed(value, field)` — provider match and normalisation, so an
  unrecognised URL raises at the boundary rather than rendering (FR-002b).

`getJournalPostBySlug` returns `null` for an unknown **or scheduled** slug,
mirroring `getWorkProjectBySlug`, so the page can call `notFound()` while
`generateMetadata` returns early without throwing.

`todayInStudioTimeZone()` lives in `src/utils/journalDate.ts` alongside the
display formatter, and is the single supplier of `$today`.
