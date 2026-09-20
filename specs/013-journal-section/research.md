# Research: Journal Section

**Feature**: 013-journal-section | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

Ten decisions. The two the clarification session flagged as risky — embeds (§4)
and scheduling (§2) — take the most space, because they are the only parts of
this feature the codebase has no precedent for.

---

## §1 Rendering the post body: Portable Text, no new dependency

**Decision**: model `body` as Sanity Portable Text — an array of `block`
members plus custom object members for inline images and embeds — and render it
with the `PortableText` component **re-exported from `next-sanity`**.

**Rationale**: FR-002 rules out a list of paragraph strings, which is what the
about page's `story` field is. Portable Text is Sanity's own answer and needs no
new package here: `@portabletext/react` 6.2.0 is already installed as a
dependency of `next-sanity` 13.1.1, and `next-sanity`'s root entry re-exports
`PortableText`, `toPlainText` and the component types (verified against the
installed package). Importing from `next-sanity` — a declared dependency in
`package.json` — rather than from `@portabletext/react` keeps us off a
transitive package that a future `next-sanity` release could drop.

`toPlainText` also comes free, which is what the post's structured-data
`wordCount`/description fallbacks and the excerpt-length advisory can use
without a second parser.

**Alternatives considered**:

- _Declare `@portabletext/react` directly_ — identical code, one more entry in
  `package.json` to keep in step with whatever version `next-sanity` resolves.
  Rejected as redundant; revisit only if we ever import something
  `next-sanity` does not re-export.
- _A markdown text field plus a parser_ — a genuinely new dependency
  (Technology Constraints require justification), no structured place for an
  image's alt text or an embed's provider, and validation becomes string
  matching. Rejected.
- _A hand-rolled array of typed section objects_ — no new dependency, but it
  reimplements Portable Text badly: no editor affordances for inline marks, and
  every consumer writes its own renderer. Rejected.

---

## §2 Scheduling: a date filter in the query, not a scheduler

**Decision**: `publishedAt` is a Sanity `date` (calendar day, `YYYY-MM-DD`).
Every public query filters `publishedAt <= $today`, where `$today` is computed
on the server as the current calendar date in `America/Toronto`. Caching is
unchanged: the existing one-hour `revalidate` and the shared `sanity` tag.

**Rationale**: FR-007a says a future-dated post stays off the site — its URL,
the listing, the sitemap and all structured data — and then appears on its own
within an hour. Filtering in GROQ puts that rule in exactly one place, so a new
call site cannot forget it; the post page, listing, sitemap and
`generateStaticParams` all inherit it from the query.

Two details that matter:

- **Why a JS-computed `$today` and not GROQ's `now()`**: `now()` is a datetime
  and `publishedAt` is a date, so the comparison needs a cast, and the cast
  needs a time zone — which drags DST into a GROQ string. Computing the date in
  TypeScript puts the rule where `src/sanity/fetchers.test.ts` can reach it.
  ISO dates also compare correctly as strings, so the GROQ side stays trivial.
- **Why the delay is bounded by an hour, not by anything new**: query params are
  part of the fetch cache key, so the first request after midnight in Toronto is
  a fresh key and re-queries Sanity. The visitor-facing delay comes from the
  prerendered page itself, which refreshes on the existing hourly
  `revalidate` — precisely the bound SC-002 promises. No cron, no new
  infrastructure.

**Alternatives considered**:

- _Sanity Scheduled Drafts / Releases_ — Sanity's own scheduled publishing.
  It is explicitly disabled in `sanity.config.ts`
  (`scheduledDrafts: { enabled: false }`, `releases: { enabled: false }`), it
  moves the schedule onto Sanity's scheduler rather than the site's content
  rules, and the same publish date would then exist twice: once as the
  schedule, once as the date the post displays and sorts by. Rejected for now;
  it is the right thing to revisit if the studio ever needs publishing at a
  specific _time_, which the spec puts out of scope.
- _Fetch every post and filter in JavaScript_ — scheduled content would reach
  the server on every request and leak through any code path that forgot the
  filter. Rejected: one GROQ predicate is a smaller thing to get right.
- _A midnight cron hitting the revalidate endpoint_ — new infrastructure and a
  new failure mode to buy precision the spec explicitly does not require.
  Rejected.

---

## §3 Dates: date-only, formatted without `new Date("YYYY-MM-DD")`

**Decision**: store and pass the date as a `YYYY-MM-DD` string end to end.
Display it by formatting from its parts (or `Intl.DateTimeFormat` with
`timeZone: "UTC"` on a date-only value), never by `new Date("2026-09-15")` and
local-time formatting. "Today" for the schedule filter comes from
`Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" })`, which yields a
sortable `YYYY-MM-DD`.

**Rationale**: FR-010 requires the date the editor chose, for every visitor.
`new Date("2026-09-15")` parses as UTC midnight and formats as **14 September**
for anyone west of Greenwich — the single most common bug in this area, and one
that would show a wrong date on every post for local readers. `en-CA` is used
for the "today" computation because its numeric format _is_ ISO order, not for
display purposes.

**Alternatives considered**:

- _A `datetime` field_ — implies a publication time the editor never chose and
  invites "why did it appear at 7pm" questions. Rejected; the spec scopes
  time-of-day out.
- _Storing a UTC instant and converting per visitor_ — same off-by-one, plus a
  post's date would differ between readers. Rejected.

---

## §4 Embeds: an allow-list of three URL shapes, rendered as a plain iframe

**Decision**: one Portable Text member type, `embed`, holding a provider,
the original URL and an editor-written description. Allowed providers and the
exact URL each is normalised to:

| Provider    | Editor pastes                                                           | Rendered `src`                                |
| ----------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| Google Maps | the "Share → Embed a map" URL, `https://www.google.com/maps/embed?pb=…` | unchanged                                     |
| YouTube     | any `youtube.com/watch?v=…` or `youtu.be/…`                             | `https://www.youtube-nocookie.com/embed/<id>` |
| Vimeo       | any `vimeo.com/<id>`                                                    | `https://player.vimeo.com/video/<id>?dnt=1`   |

Validation runs twice, deliberately: in the Studio schema, so FR-002b's refusal
happens at publish time with an explanation, and in the fetcher, so a URL that
somehow reaches the site unrecognised raises a content error rather than
rendering an unknown third party's frame (Principle I).

**Rationale**:

- **No API key, on purpose.** The Maps _Embed API_ (`/maps/embed/v1/`) requires
  a key, which would be a new secret to provision, rotate and keep out of the
  client. The share-embed URL the Maps UI hands an editor needs none. That is
  also the URL the studio owner can actually obtain without a developer.
- **Privacy modes are the default, not an option.** The site has no
  cookie-consent banner and this feature does not add one (spec Assumptions), so
  the only embeds allowed are the ones that do not set tracking cookies on
  arrival: `youtube-nocookie.com` and Vimeo's `dnt=1`. Normalising on our side
  rather than trusting the pasted URL is what makes that guarantee hold.
- **A plain `<iframe>`, no library.** `loading="lazy"` satisfies FR-002c's
  "don't load until scrolled near"; an `aspect-ratio` wrapper reserves the space
  so nothing shifts; `title` carries the editor's description;
  `referrerpolicy="strict-origin-when-cross-origin"` limits what the provider
  learns. A failed or blocked embed leaves an empty reserved box and the article
  reads on, which is FR-002d.
- **No `sandbox` attribute.** Making these providers work inside a sandbox
  requires `allow-scripts allow-same-origin`, which together neutralise the
  isolation — it would be security theatre. The allow-list is the real control,
  and it is the thing tests assert.

**Alternatives considered**:

- _`react-player`, `lite-youtube-embed` or similar_ — new runtime dependencies
  for markup we can write in ten lines. Rejected under Technology Constraints.
- _Server-side oEmbed lookup_ — a network call per embed at render time, and it
  returns provider HTML we would have to inject. Rejected: slower and strictly
  more dangerous than building the URL ourselves.
- _A free-text HTML/embed-code field_ — what most CMS blogs do, and what
  FR-002b forbids. Rejected by the spec.
- _Allowing arbitrary iframe URLs with a warning_ — one typo away from
  embedding anything. Rejected.

---

## §5 Structured data: `BlogPosting` for a post, the house pattern for the list

**Decision**: the post page emits a `BlogPosting`; the listing emits
`CollectionPage` + `ItemList`, matching `buildWorkCollectionSchema`. Both reuse
the existing `buildBreadcrumbSchema`, and both reference the studio by `@id`
rather than restating it, exactly as the current builders do.

`BlogPosting` fields: `headline`, `description`, `image`, `datePublished`,
`dateModified`, `author`/`publisher` as `{ "@id": businessId }`,
`mainEntityOfPage`, `isPartOf: websiteId`, `inLanguage`, `articleSection` (the
category) and `contentLocation` (the location) — the last two being the fields
that carry this feature's local-search intent into the markup.

**Rationale**: `BlogPosting` is the Article subtype Google documents for blog
posts, and the existing `compact()` helper already drops empty values so a
validator sees no empty claims (SC-003). Keeping the listing on
`CollectionPage` + `ItemList` means the journal index and the work index
describe themselves the same way, which is one less pattern for a future
reader to reconcile.

**Alternatives considered**:

- _`Blog` + `blogPost` for the listing_ — more precise vocabulary, but it breaks
  symmetry with the work index for no rich-result gain (article rich results
  attach to the post page, not the index). Rejected on consistency.
- _Plain `Article`_ — valid but less specific. Rejected.
- _`NewsArticle`_ — wrong genre; carries news-specific expectations. Rejected.

---

## §6 Routes, prerendering and the sitemap

**Decision**: `/journal` and `/journal/[slug]`, both prerendered and refreshed
by the existing hourly ISR. `generateStaticParams` returns **live** slugs only;
`dynamicParams` keeps its default (`true`) so a post whose date has just arrived
renders on first request instead of 404ing. The page calls `notFound()` when the
by-slug fetcher returns `null`, which the `$today` filter makes true for a
scheduled post. The sitemap gains `/journal` plus one entry per live post,
carrying the post's cover and body images and `lastModified: _updatedAt`.

**Rationale**: this is `/work/[slug]`'s shape with one added predicate, so the
route behaves like the rest of the site under the same cache tag and the same
webhook. Per-post `lastModified` is a small departure from the work entries
(which stamp build time) and is worth it here: an edited article's freshness is
a ranking-relevant signal, and Sanity already maintains `_updatedAt`. The
installed `SitemapFile` type (`next/dist/lib/metadata/types/metadata-interface.d.ts`)
confirms `images?: string[]` and `lastModified?: string | Date`.

**Alternatives considered**:

- _Prerender every slug including scheduled ones_ — build-time `notFound()` gets
  cached, so the post would stay 404 until the next revalidate even after its
  date. Rejected.
- _`export const dynamic = "force-dynamic"`_ — makes scheduling exact, at the
  cost of the site's entire caching model and a Sanity query per request.
  Rejected; the spec accepts an hour.

---

## §7 Design system: a `--journal-*` semantic family, and one reused primitive

**Decision**: add a `--journal-*` semantic token family to `_tokens.scss` and
the long-form type styles to `_typography.scss`, including a measure token for
article line length and size/leading pairs named only by property
(`--journal-body-size` / `--journal-body-leading`), per the naming rule in
`AGENTS.md`. The listing page reuses `PageHeading` (its words come from Journal
page settings' `titleWords`); the **post** page does not.

**Rationale**: `PageHeading` takes `words: string[]` and mask-reveals each word
as a flex item — right for a two-word section title, wrong for a
twelve-word article headline, which would wrap as a word-per-item grid. A post
title is a different element with a different job, so it gets its own `h1` and a
simpler reveal through the shared `usePageIntro`. This is not the duplication
Principle VII forbids: nothing is copied, and the shared intro hook is still
shared.

Every value lands in `src/styles/` first; `npm run audit:design-system` must
exit 0, which for new surfaces means no literal survives review.

**Alternatives considered**:

- _Reuse `PageHeading` for post titles by splitting the title on spaces_ —
  tempting (the accessible name is already fixed by its `aria-label`), but the
  layout is built for short titles. Rejected.
- _Scale-tier tokens for article typography_ — `--space-lg` and friends already
  exist and are reused; what is genuinely new (measure, body leading, caption,
  pull quote) belongs to one surface and takes the semantic tier.

---

## §8 Testing: three layers, and one dataset hazard

**Decision**:

- **Unit** — the today-in-Toronto helper and date formatting (including the
  UTC-parse trap from §3), embed URL normalisation and rejection per provider,
  the new structured-data builders, and the fetcher guards (missing required
  field raises; a scheduled post is absent).
- **Integration** — the listing and post Server Components called and awaited
  directly (the pattern `src/app/(site)/work/[slug]/page.test.tsx` established),
  covering the 404 path, the content-error path, `generateMetadata` override vs
  fallback, and the empty state.
- **End-to-end** — one new `e2e/journal.spec.ts` run under
  `underBothMotionPreferences`, covering listing → post → call-to-action, and
  the navigation's current-section marking on both pages.

**The hazard**: journal journeys need a live post, and on the day this ships
the dataset has none — an e2e suite that hard-fails on an empty journal would
block every push (`.husky/pre-push`) for a content reason, which is exactly the
"test reporting on the dataset" failure `e2e/support/content.ts` was written to
avoid. So the journal journeys **discover** their fixture: with no live post,
they assert the empty state and skip the post-specific journeys with a message
naming what to add in Sanity. Recorded in
[contracts/test-surface.md](./contracts/test-surface.md).

**Alternatives considered**:

- _Seed a fixture post from the test run_ — writes to the shared Sanity dataset
  from a Git hook. Rejected outright.
- _Hardcode a known slug_ — breaks the moment an editor renames it, and 012's
  contract forbids it. Rejected.

---

## §9 Next.js docs: consulted — and a correction to this plan's first draft

**Correction**: the first draft of this section said `node_modules/next/dist/docs/`
does not exist in `next@16.2.9`. **That was wrong.** It was checked against the
main checkout's `node_modules`, which turned out to be an incomplete install —
the right Next version string, but no `dist/docs/` and no `@playwright/test`
either, despite both being in `package.json`/the lockfile. A clean `npm ci` in
the worktree has both. The docs ship with the package; Principle VI can be
followed as written, and was, during implementation.

**What the docs changed**:

- **`preload` vs `loading="eager"` for listing cards.** `image.md` reserves
  `preload` for the single image that is the page's largest paint, and says not
  to use it "when you have multiple images that could be considered the LCP
  element depending on the viewport" — which a row of cards is. The index's
  first row uses `loading="eager"`; only the post's cover uses `preload`.
  (`priority` is deprecated in 16 in favour of `preload`, so the cover uses the
  new prop.)

**What the docs confirmed**:

- `dynamicParams` defaults to `true` (`route-segment-config/dynamicParams.md`):
  a slug not returned by `generateStaticParams` renders at request time, which
  is what lets a post whose date arrives after the build appear without a
  deploy (§6).
- Sitemap entries take `images: string[]` and `lastModified`
  (`metadata/sitemap.md`), matching the installed `SitemapFile` type.

**Housekeeping, out of scope here**: whoever uses the main checkout should run
`npm ci` there. A test or type-check run from that checkout is currently
running against a different dependency tree from the lockfile's.

---

## §10 Where the category list lives

**Decision**: one exported constant — `src/constants/journalCategories.ts` —
imported by both the Sanity schema (as its `options.list`) and the fetcher (as
the set it validates against). Not a mirror in the Principle VII sense: both
sides import the same module, so they cannot drift.

**Rationale**: FR-003 fixes the list; a single import is what makes "fixed"
true in both the Studio and the running site. Adding a category is then a
one-line change plus a deploy, which is what the clarification accepted.

**Note on the work gallery**: `workProject.category` stays free text and keeps
deriving its filters from the data (spec 002 FR-002). This constant does not
attempt to constrain it — the five shared names are shared by convention, and
unifying them is a separate change to a shipped feature.
