# Research: Service Landing Pages

**Feature**: 014-service-landing-pages | **Date**: 2026-10-07

Eleven decisions, each with what was rejected, plus three that came out of
reading the code rather than the brief (§12–§14). Where a decision rests on
behaviour I could reason about but not run here, it says so and names the check
in [quickstart.md](./quickstart.md) that settles it.

## Findings that shaped the decisions

These are facts from the tree and the pinned Next.js docs. Several are not what
the spec assumed.

| #   | Finding                                                                                                                                                                                                                                   | Consequence                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1  | **There is no content-import tooling.** Spec 007's "content sync" is the embedded Studio plus the revalidate webhook (`src/app/api/revalidate/route.ts`). `scripts/` holds only the design audit, the CSS diff and the browser installer. | The prompt's "deliver through the content-sync path in spec 007" has no path to follow. §10 decides one.                                                                 |
| F2  | **No `.env.local` exists in this checkout**, so the live dataset cannot be read from here. The real service package titles, their `id` fields, and the exact category strings on the projects are unseen.                                 | The heading cannot safely be built from the package title (§8). The launch content cannot be finished until the dataset is read at implementation time, and §10 says so. |
| F3  | `mapSanityProject` already normalises `category` (`normalizeWorkCategory`: trim, lowercase, spaces to hyphens). A `Project.category` is `"graduation"`, never `"Graduation "`.                                                            | The matcher compares normalised on both sides (§3), and is idempotent so it works on raw or already-normalised input.                                                    |
| F4  | `projectFields` in `src/sanity/queries.ts` selects `serviceCategory`, a field that is in no schema and is read by nothing.                                                                                                                | Observed, not touched. It is not a link between projects and packages, and this feature does not use it. Out of scope.                                                   |
| F5  | `revalidateTag(tag, "max")` marks tagged data **stale** and serves it while it refreshes in the background (`revalidateTag.md`). A cached query is therefore stale for the first visit after a publish.                                   | A lookup that reuses a shared cached query can still answer "no" for a page created seconds ago. §1 picks the lookup that cannot.                                        |
| F6  | `notFound()` returns **404 for non-streamed responses and 200 for streamed ones** (`not-found.md`). There is no `loading.tsx` under `(site)`, and the existing `/work/[slug]` and `/journal/[slug]` pages already depend on a 404.        | Same discipline here: decide before any streaming starts. A real-browser test asserts the status code (§13).                                                             |
| F7  | The `@modal` parallel slot has a `[...catchAll]` that returns `null`. It intercepts nothing at the root.                                                                                                                                  | A new top-level dynamic page is not disturbed by it, and it does not intercept landing pages.                                                                            |
| F8  | `getServices()` validates a package inline inside a `.map`. There is no function that maps one package.                                                                                                                                   | §5 extracts one, so the landing page and the services page share a single mapper.                                                                                        |
| F9  | `JournalCta` is a section with a heading, a paragraph and an action row. This feature needs the same block. `ServiceExperience` renders features plus a "STARTING FROM" price; this feature needs the same.                               | Constitution Principle VII ("two or more places") makes both promotions mandatory. §12.                                                                                  |

## 1. Root-level routing: `/<slug>` beside static routes, with no deploy

**Decision.** One dynamic segment: `src/app/(site)/[landingSlug]/page.tsx`.

- **Precedence.** `work`, `service`, `about`, `contact` and `journal` are static
  folders under `(site)`; `studio` and `api` are static folders at the app root;
  `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `icon.svg`,
  `apple-icon.png` and `favicon.ico` are metadata routes. Next resolves a static
  segment ahead of a dynamic one, so the dynamic page only receives paths nothing
  else claims. I am relying on that rule from the framework's behaviour, not from
  a sentence I found in the pinned docs; the dynamic-routes guide shows the
  convention but is silent on precedence. **Verified, not assumed:** the
  quickstart (step 0) and an e2e journey assert `/work`, `/service` and
  `/sitemap.xml` still render their own pages after the route lands.
- **A shape gate before any fetch.** The page first tests the segment against
  `LANDING_SLUG_PATTERN` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) and the reserved list,
  and calls `notFound()` without touching Sanity if either fails. Bot traffic for
  `/wp-login.php`, `/apple-touch-icon.png` and `/.env` (all contain a dot) then
  costs nothing.
- **Lookup by slug, not by membership.** A valid-shaped slug is looked up with
  `getLandingPageBySlug(slug)`, one query keyed on that slug, exactly as
  `getJournalPostBySlug` does. A brand-new slug has never been queried, so its
  cache key is new and the first request reads fresh data (F5). `null` means
  `notFound()`.
- **`generateStaticParams`** returns the live slugs, so existing pages prerender.
  **`dynamicParams` stays at its default `true`**, so a page created after the
  build renders on its first request and is then cached. That is what FR-009's
  "a slug that did not exist before" needs.
- **Not-found.** `notFound()` before anything streams (F6); `generateMetadata`
  returns `{ title: "Page not found", robots: { index: false } }`, as the work
  and journal pages do, so a crawler reading only the head files nothing under a
  plausible title.
- **Where the reserved list lives.** `src/constants/reservedRoutes.ts`, a plain
  TypeScript module with no imports, so the Studio bundle (which cannot read the
  `@/` alias) can import it by relative path, as `journalCategories.ts` already
  is. The page imports the same list. A **drift test** reads the actual
  directory names under `src/app` and `src/app/(site)` and fails if a static
  top-level route is missing from the list, so adding `/pricing` tomorrow cannot
  silently become a slug an editor can claim and never see.

**Rejected.**

| Alternative                                           | Why not                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamicParams = false`                               | Any slug not in the build 404s, so a new page needs a deploy. That breaks FR-009 and SC-001 outright.                                                                                                                                              |
| Check membership in one cached list of slugs          | Under F5 the list is stale for the first visit after a publish. The first request for a new slug would answer "not found", and that 404 would be cached against the path for up to an hour. This is the subtle failure the per-slug lookup avoids. |
| `[...slug]` catch-all                                 | Matches `/a/b/c` as well. Landing pages are one segment; a catch-all widens the surface for nothing.                                                                                                                                               |
| One `page.tsx` per landing page                       | Every new page becomes a code change. The brief forbids that.                                                                                                                                                                                      |
| Rewrites or a proxy mapping slugs to a single route   | `next.config.ts` rewrites cannot read the CMS, and a proxy runs before the cache. Adds a moving part to do what a dynamic segment does.                                                                                                            |
| Putting the pages under a prefix (`/services/<slug>`) | The brief fixes the URL pattern `/<service>-photographer-london-ontario`. A prefix would dilute the match with the query, and also contradicts the user's stated URLs.                                                                             |

**Cost, stated plainly.** Each distinct valid-shaped unknown path (`/pricing`,
`/about-us`) costs one small Sanity query and one cached 404. That is accepted:
it is the same cost `/work/<anything>` and `/journal/<anything>` already carry,
and the Sanity CDN absorbs it.

## 2. "Live" is decided once, in the query

**Decision.** A shared GROQ fragment, written once beside
`liveJournalPostFilter`:

```text
_type == "serviceLandingPage" && published == true && defined(slug.current)
```

Every landing-page query (`bySlug`, the summaries list, the sitemap and link
reads, which share the list) is built from it. The client already reads the
`published` perspective (`src/sanity/client.ts`), so a Studio draft never
matches: "published in the Studio AND switch on" is the fragment plus the
perspective, with no caller able to forget either half.

`approvedAgainstBrief` is **not** in the filter. It gates the _switch_ in the
Studio (§10), and a second runtime gate would make "why is this page not
showing?" a two-variable question.

**Rejected.** Filtering in the fetcher after fetching all pages (a caller could
skip it, and a held-back page's content would travel through the cache);
two filters in two files (the exact drift this fragment prevents).

## 3. One category matcher

**Decision.** `categoriesMatch(a, b)` is added to `src/utils/formatWorkCategory.ts`
beside the function it uses:

```text
categoriesMatch(a, b) = normalizeWorkCategory(a) === normalizeWorkCategory(b)
```

Three callers, one function: the landing page filtering `getWorkProjects()`, the
project page finding its landing link, and the Studio's non-blocking "this
category matches no work project" warning (which fetches the distinct
`workProject.category` values and compares with the same function). Because
`normalizeWorkCategory` is idempotent (F3), it is correct whether the input is a
raw Studio string or an already-normalised `Project.category`.

The landing page takes its projects from the existing cached `getWorkProjects()`
and filters in memory, rather than adding a category-filtered query: GROQ has no
equivalent of the whitespace collapse, so a server-side filter would be a second,
subtly different matcher. The dataset is dozens of projects; the full list is
already warmed by `/work` and the sitemap, and costs no extra network call.

**Rejected.** A GROQ `category match` filter (a second matcher, disagrees on
spacing); a fixed list of categories (work categories are free text by design,
spec 002, and the spec's Assumptions rule this out).

## 4. Studio validation: what blocks, what advises, and what Sanity can express

**Decision.** Every rule below is a Sanity validator that calls a **pure
function** from `src/utils/`; the function, not the validator, holds the logic,
so Vitest tests it without a Studio. All use relative imports, because the Sanity
CLI bundler does not read the `@/` alias (the same reason `journalPost.ts`
imports relatively).

| Rule                                                | Level | Mechanism                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Required fields (FR-005)                            | Error | `rule.required()`                                                                                                                                                                                                                                                                                                        |
| One page per package (FR-003)                       | Error | Field `custom` on `package` using `context.getClient` to count other pages (draft and published ids excluded) with the same `package._ref`                                                                                                                                                                               |
| One page per category (FR-003)                      | Error | Field `custom` on `category`: fetch the other pages' categories and compare with `categoriesMatch`                                                                                                                                                                                                                       |
| Slug shape, uniqueness, reserved routes (FR-004)    | Error | `type: "slug"` with the built-in `isUnique`, plus a `custom` applying `LANDING_SLUG_PATTERN` and `RESERVED_ROOT_SEGMENTS`                                                                                                                                                                                                |
| Slug starting value (FR-004)                        | n/a   | `options.source` as a function: `<serviceName>-photographer-london-ontario`, slugified. A suggestion only, never forced                                                                                                                                                                                                  |
| Slug changed on a published page (FR-006)           | Warn  | `custom(...).warning()` comparing against the published document's slug via `getClient`                                                                                                                                                                                                                                  |
| Category matches no work project (FR-006)           | Warn  | `custom(...).warning()`; fetches distinct project categories, compares with `categoriesMatch`                                                                                                                                                                                                                            |
| Search title over 60, description over 160 (FR-006) | Warn  | `.max(60).warning(...)`, `.max(160).warning(...)`, as `journalPost` does                                                                                                                                                                                                                                                 |
| Introduction at least 50 words (FR-039)             | Error | Field `custom`, message names the count and the shortfall                                                                                                                                                                                                                                                                |
| At least 3 sections (FR-038)                        | Error | `rule.min(3)` on `sections`                                                                                                                                                                                                                                                                                              |
| Each section body at least 60 words (FR-039)        | Error | `custom` on the section `body`                                                                                                                                                                                                                                                                                           |
| At least 5 questions, answers at least 30 (FR-039)  | Error | `rule.min(5)` on `faqs`, `custom` on each `answer`                                                                                                                                                                                                                                                                       |
| Total editorial text at least 400 words (FR-039)    | Error | **Document-level** `custom`. It returns a `ValidationError` with a `path` (e.g. `["introduction"]`, relative to the document), which `@sanity/types` 6.x declares as the supported prop; its older `paths` is marked deprecated, so `path` is used. The message then points at the intro rather than floating at the top |
| Switch on needs approval and no open markers        | Error | `custom` on `published`: refuses `true` while `approvedAgainstBrief` is false or any text field contains `[[CONFIRM` (§10)                                                                                                                                                                                               |
| Heading pattern holds both placeholders (FR-043)    | Error | `custom` on the settings document's `headingPattern`: must contain `{service}` and `{city}`                                                                                                                                                                                                                              |

**(a) Word counting.** `countWords(text)` in `src/utils/wordCount.ts`: split on
whitespace, count tokens that contain at least one Unicode letter or digit
(`/[\p{L}\p{N}]/u`). A lone dash, ampersand or bullet does not count;
`pre-wedding` counts as one; whitespace-only is zero; exactly the minimum passes
and one under fails. Plain text throughout (§9 explains why it must be plain),
so the count is the same in the Studio, the tests and the quickstart.

**Total editorial words** = introduction + every section heading and body +
every question and answer. Package text is excluded (FR-042).

**(b) Is the same rule asserted outside the Studio?** Yes, in two places, and
deliberately no third.

1. A Vitest suite runs `assessLandingPageQuality` over the **launch content
   files** (§10). Launch content reaches the dataset by import, which skips
   Studio validation entirely, so this is the only check that stands between a
   thin imported page and the live site. It runs in `npm test`, which runs on
   every push.
2. The Studio validators call the same function.

**Rejected: enforcing the word minimums at read time in the fetcher.** A page at
390 words is thin, not _missing_ data, and the fetcher's job under Principle I
is to refuse missing or malformed data. Making a floor a runtime error means
raising it later (an editorial decision) takes down every live page that the old
floor allowed, and it would fail the sitemap with it (§7). The fetcher keeps the
**structural** guards the page cannot render without: at least one section and
one question, every field non-blank. Missing data is loud; short data is the
Studio's and the test's to refuse. If the owner disagrees, this is the one
decision in this plan to reverse; it is a few lines in the mapper.

**Where every threshold lives.** One module,
`src/constants/landingPage.ts`:

```text
LANDING_QUALITY = {
  introMinWords: 50,
  minSections: 3,  sectionMinWords: 60,
  minFaqs: 5,      faqAnswerMinWords: 30,
  totalMinWords: 400,
}
```

It is imported by the schema validators, by `assessLandingPageQuality`, by the
mapper's structural guards (`minSections`/`minFaqs` are _not_ used there, only
"at least one"), and by the tests, which compute their boundary cases from the
constants so retuning a number moves the tests with it. It is not duplicated
because there is exactly one definition and four importers; the Studio imports
it relatively, the app through `@/`, and both resolve to the same file.

**Rejected.** A document `validation` on each field only (cannot express the
total); a custom Studio input component with a live word counter (a new
component and a Studio-bundle dependency for a nicety; the validation message
already states the count and the shortfall, which is what the editor needs).

## 5. Content errors, and one mapper for the package

**Decision.** The journal's guard suite is the template: `requireString`,
`requireStringArray`, `requireDocument` and `resolveSanityImage` already
produce messages that name the document and the field.

- **`mapLandingPage(raw, prefix)`** in `fetchers.ts`, with the prefix
  `serviceLandingPage("<slug>")`. It requires: `slug` (and its shape),
  `serviceName`, `category`, every introduction paragraph non-blank, **at least
  one** section with a non-blank heading and non-blank paragraphs, **at least
  one** question with a non-blank question and answer, `seoTitle`,
  `seoDescription`, and rejects any text containing the `[[CONFIRM` marker
  (a placeholder reaching production is exactly what Principle I forbids; see
  §10).
- **The package.** `package->{…}` is joined in the same query. When it resolves
  to `null` — deleted, or draft-only under the published perspective — the
  mapper throws `Sanity document "serviceLandingPage(\"<slug>\").package" is
required — the service package it points to is missing or unpublished.` The
  Studio makes that state nearly unreachable: `package` is a **strong**
  reference, so Sanity refuses to publish a page pointing at an unpublished
  package and refuses to delete a package that is still referenced.
- **One mapper, so the two pages cannot disagree.** The inline body of
  `getServices` becomes `mapSanityService(service, prefix)`, and both
  `getServices` and `mapLandingPage` call it. The package fields in GROQ become
  one fragment, `servicePackageFields`, used by `servicesQuery` and by the
  landing query's `package->{…}`. A price or image rule changed once now changes
  on both pages. "No price" is therefore already a content error
  (`requireValue(service.price, …)` existed; it simply applies here too).
- **Settings.** `getLandingPageSettings()` follows `getJournalPage()`: every field
  `requireString`, plus a check that `headingPattern` holds `{service}` and
  `{city}`.

**Rejected.** Fetching the package with a second query by `_ref` (two cache
entries that can be stale at different times, so the pages could briefly show
different prices); validating the minimums here (§4).

## 6. Internal links without N extra queries

**Decision.** One cached summaries query, `getLandingPages()`, returns every
live page's `{ slug, serviceName, alternateName, category, packageId,
packageImage, updatedAt }`. Three consumers share it:

- `generateStaticParams` and the sitemap read it directly.
- **`getLandingPageLinks()`** wraps it: it also reads `getSiteSettings()` and
  `getLandingPageSettings()` (both already cached per render) and composes each
  page's `heading`, returning `{ slug, href, heading, packageId, category }[]`.
  Consumers receive ready link text and never compose a heading themselves.

`packageId` is `coalesce(package->id, package->_id)` in GROQ, mirroring
`getServices`' `service.id ?? service._id`, so it is the key the services page
already uses.

- **Services page:** `ServiceExperience` gains a `landingLinks` prop, a record
  keyed by `packageId`. A package with no entry renders exactly as it does today,
  satisfying "output unchanged". The prop is a plain object, so it crosses the
  server/client boundary.
- **Project page:** finds `links.find((l) => categoriesMatch(l.category,
project.category))` and passes it to `WorkDetailGallery` as `landingLink`. It
  renders only when `presentation === "page"` (the overlay is not required to
  carry it; spec Assumptions).

Cost: one cached query that every page of the site that needs it shares.
Nothing is queried per package or per project.

**Blast radius, accepted.** A malformed summary now errors the services page and
every project page, not just the landing page. That is the same loud failure as
§7 and is bounded by required Studio fields and the strong reference. It is
named here so it is a decision rather than a surprise.

**Rejected.** A reverse reference from `servicePackage` to its landing page
(editing a second document for every page, two sources of truth); querying per
package (N+1); an `Array<Link>` prop searched at render (the keyed record is the
same data with an O(1) read).

## 7. The sitemap risk stays loud

**Decision.** `sitemap.ts` calls `getLandingPages()` alongside the existing
reads and adds, per page, `{ url, lastModified: new Date(updatedAt), images:
[packageImage.src] }`. There is **no `try/catch` and no skip**. A malformed live
page raises, the same as a malformed project does today.

Mitigations, in order of how much they prevent: Studio required fields and the
strong package reference (§5) stop it at the source; fetcher tests cover every
required field (SC-009); the sitemap test asserts it raises rather than omits.
The residual risk, that an unforeseen content-model change makes one live page
fail the sitemap, is the cost of "no silent fallbacks" and is stated in the
spec's Assumptions. It is the same trade `/journal` made.

**Rejected.** Skipping a bad page in the sitemap only (the page would still 500
on its own URL and the services page links to it: a half-silent failure is
worse than a loud one); wrapping the sitemap so one failure yields the static
routes (hides that the site is broken from the one consumer, a crawler, who
cannot report it).

## 8. The heading, the alternate name, and why `serviceName` exists

**The problem the spec did not see.** FR-011 says the heading names the service.
The obvious source is the package's `title`. But `servicePackage.title` is
written for the _services page_ — it may read "Engagement Session", "The
Graduation Collection" or "Portrait Experience" — and F2 says I cannot see them.
"Engagement Session Photographer in London, Ontario" is not what anyone types
into a search box, and the heading is the strongest on-page signal on the page.

**Decision (this adds a field the spec's FR-001 list did not name, recorded as
FR-043).** A required `serviceName` on the landing page, the words a client would
search ("Engagement", "Portrait", "Family", "Graduation"). It is independent of
the package title. The words around it come from one required setting,
`headingPattern`, in the shared Service Landing Page settings:

```text
headingPattern: "{service} Photographer in {city}"
```

```text
composeLandingHeading({ pattern, serviceName, alternateName, city })
  service = alternateName ? `${serviceName} & ${alternateName}` : serviceName
  return pattern.replace("{service}", service).replace("{city}", city)
```

`city` is `siteSettings.location`, the value the business schema already uses as
`areaServed`, so the heading cannot drift from the studio's declared location
(FR-011). The Engagement page reads **Engagement & Pre-wedding Photographer in
London, Ontario**.

- **One source for everything that names the page.** The composed heading is the
  `h1` (via `PageHeading`, split into words, with `aria-label` carrying the full
  string), the text of every inbound link (FR-029) and the breadcrumb's last
  name. The alternate name is therefore **visible** in the heading whenever it
  is set (FR-013), and it is the same field that feeds the Service schema's
  `alternateName` (§ routes-and-seo.md). One field, no way to show one and
  declare another.
- **The `" & "` joiner is a constant in code, not a setting.** It is punctuation
  joining two editor-supplied names, not production copy. If the owner prefers
  "and", it is one character in `src/utils/landingHeading.ts`.
- **Page title and description are not the heading.** `seoTitle` and
  `seoDescription` are separate required fields (spec Assumptions), written for
  the result list, and are where "pre-wedding photographer London Ontario" is
  matched.

**Rejected.** `package.title` as the service name (see above; F2); one
editor-written `heading` per page (the city would be typed copy that can drift
from site settings, which FR-011 forbids); a free-form `{service}`/`{city}`
template per page (a pattern is a site-wide editorial decision, and four pages
with four patterns is how headings stop being consistent).

## 9. Page composition, and why the FAQ is always open

**Layout order: confirmed as the prompt gave it.** Heading, introduction,
**sections, projects, package, questions, contact call to action.**

Why this order and not photographs first: this is a service page, not a
portfolio. A visitor arriving from "family photographer London Ontario" is
deciding whether to enquire. The persuasion order is explain, show proof,
price, answer objections, ask. Photographs-first suits `/work`, which exists for
that. FR-012 only pins the introduction first.

The trade-off I would name to the owner: with Portrait's 13 projects, the grid
sits between 400+ words of text and the package, so a visitor who wants the price
scrolls past it. Section order lives in one component
(`page.tsx`), so moving the projects up is a four-line change if
analytics show people bounce before reaching the work. I would not change it
before there is data.

**FR-042 (the editor's text is the larger share) is true by construction**, not
by a rule the site checks: FR-039 forces at least 400 words of editor text, and
the package block is a title, one description and a feature list. A unit test
renders a fixture page at exactly the minimums and asserts the editor's words
exceed the package's, so a future change that bulks up the package block (or
lowers the floor) fails a test rather than quietly turning the page into a copy
of `/service`.

**Sections and the introduction are plain-text paragraphs, not Portable Text.**
The introduction and each section body are an **array of strings** (one per
paragraph), the shape `aboutPage.story` already uses. Reasons that matter:

1. **The FAQ structured data must equal the visible text** (FR-023, FR-025).
   Plain-text answers are the same bytes in the page and in the `FAQPage`
   `acceptedAnswer.text`. Rich text would need a HTML subset conversion for the
   schema and a test proving the two agree.
2. **Word counting is exact.** `countWords` over strings is trivial; over Portable
   Text it needs a walker that has to agree with the Studio's.
3. **No new renderer.** The journal's Portable Text renderer is built around its
   own block set, images and embeds; reusing it would drag that in for text that
   needs none of it.

The cost: no bold, no lists, no inline links inside these paragraphs. The
internal links the page needs (to projects, to contact) are structural and
rendered by the page itself. If the owner later wants lists inside a section,
that is a content-model change, and the choice is reversible: the stored shape
(`string[]`) can be wrapped, but the reverse is lossy.

**The FAQ is always open, a list of headings and paragraphs, not an accordion.**

| Option                               | Verdict                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Always visible** (chosen)          | Satisfies FR-017 literally: every answer is in the accessibility tree and the indexed text _whether or not anyone interacts_. No state, no script, no new interactive element, nothing for a keyboard user to miss. Five answers of 30-80 words is a short block.                                           |
| Native `<details>`                   | Keyboard-operable and announces its state for free, which is why I considered it. But a closed `<details>` removes its contents from the accessibility tree until opened, so "available to assistive technology whether or not it is open" is not true; and answers hidden by default may be weighted less. |
| JS accordion (GSAP height animation) | A new stateful component, `aria-expanded` wiring, a height animation to reconcile with reduced motion, and an e2e test, to hide five short paragraphs.                                                                                                                                                      |

The markup is `<section aria-labelledby>` with an `h2` (the setting
`faqHeading`) and, per item, an `h3` question and a `p` answer, so a screen
reader can navigate by heading. It lives in
`src/components/landing/LandingFaq/` (one consumer, so not promoted).

**Projects reuse `WorkCard`** in a plain CSS grid, not `WorkMasonryGrid` (which
brings Isotope and the work page's filter classes). `WorkCard` already links to
`/work/<slug>`, carries the pointer label, and sizes its image.

## 10. Launch content, the briefs, and "owner approved"

**How the four pages get into the dataset (F1).** Authoring them in the Studio by
hand would be four pages of 800-1,200 words typed or pasted in. Instead:

- The content is written as **one readable JSON file per document** in
  `content/service-landing-pages/` (`portrait.json`, `engagement.json`,
  `family.json`, `graduation.json`, `settings.json`), with deterministic ids
  (`serviceLandingPage-portrait`, `-engagement`, `-family`, `-graduation`, and
  `serviceLandingSettings`). **No id may contain a dot**: Sanity treats a dotted id
  as a private path (the way `drafts.<id>` is), readable only with a token, and
  this site reads without one, so a dotted page would never be visible even once
  published. One file per document, with paragraphs as separate
  array entries, because the owner has to _read_ about a thousand words of
  prose per page in a pull request, and a one-document-per-line NDJSON file
  would put each page on a single unreadable line. `content/` is a new top-level
  folder with a short README, because `specs/` holds documentation, `src/` holds
  code, and this is neither.
- Imported with the Sanity CLI that is already a dependency. The importer reads
  one JSON document per line, so a one-line `node -e` command joins the files
  into that stream and pipes it to `npx sanity dataset import - production
--missing` (the exact command is in quickstart §9e, with the fallback if the
  installed CLI will not read standard input). **`--missing` skips ids that
  already exist**, so re-running it can never overwrite the owner's edits; it
  only creates what is absent. It needs a write-capable login (`sanity login`)
  that the owner or the developer holds; nothing in the repo stores a token.
- The documents arrive as **published documents** (no `drafts.` prefix) with
  `published: false` and `approvedAgainstBrief: false`, so nothing is live until
  the owner acts.
- Package references need real `_id`s (F2). The implementer reads them from the
  dataset (`*[_type == "servicePackage"]{_id, id, title}`, readable with the
  public project id) and writes them into the file. **The owner confirms the
  package-to-service mapping** before import. This is the one step that cannot
  be finished without the live data.

**Nothing about the studio is invented; open facts are marked, and the marks
block going live.** Draft copy uses only (a) what is in the CMS (package title,
description, features, price) and (b) what the spec states. Every other studio
fact is written as `[[CONFIRM: <what the owner must supply>]]` inside the
sentence that needs it, for example "…delivered within [[CONFIRM: delivery
time]] of your session". This makes FR-040 mechanical rather than a promise:

- The `published` switch validator **refuses `true` while any text field
  contains `[[CONFIRM`** (§4).
- The mapper **rejects a live page that contains it** (§5), so even a page
  imported with the switch on cannot show the marker to a visitor.

The marker, the minimum numbers and the slug rules all live in
`src/constants/landingPage.ts`.

**"Owner approved" is a checkbox in the Studio, not a note in git.** The owner
is not a git user. `approvedAgainstBrief` (boolean, default false, described as
"I have checked every statement on this page against the content brief and the
studio's real policies") must be true before the `published` switch will accept
`true`. It is one deliberate step per page, it lives where the owner already
works, and it is verifiable: the Studio itself refuses the switch without it.
This adds a field the spec's FR-001 did not list; it implements FR-041's "not
switched on until the owner has approved it" and is recorded in data-model.md.

**The briefs.** `contracts/briefs/<service>.md` — one per launch service — hold
the checklist FR-041 requires: the questions a client of that service wants
answered, the London-specific detail the page should carry (named as
_candidates to confirm_, never as claims about the studio), and the facts the
owner must confirm. The Studio field description summarises the approval; the
briefs are what she approves against. Each brief states in its header which
`[[CONFIRM]]` markers its page carries.

**The distinctness check Claude runs before delivery** (a drafting step; the
result goes in the PR description; it is not shipped tooling and not a product
requirement):

1. Split every text field of the four pages **and** the services page's package
   copy (description and features, read from the dataset) into sentences;
   lower-case; strip punctuation.
2. **Exact repeats:** any sentence that appears twice, within or across pages.
   Allowed: zero.
3. **Near repeats:** any run of eight consecutive words shared by two different
   pages' editorial text. Allowed: zero, except runs that are a deliberate quote
   of a package fact (a price), which are listed and justified.
4. **FAQ answers:** pairwise comparison across all four pages; any two answers
   identical or differing by one phrase swap. Allowed: zero.
5. **Metadata:** the four `seoTitle`s are pairwise distinct, the four
   `seoDescription`s are pairwise distinct, and none shares its first five words
   with another.
6. **Services-page overlap:** no sentence of a landing page's introduction or
   sections appears in any package's description. Package facts may be restated
   only in the sentence's own words.
7. The result (counts, and each exception with its reason) is pasted into the
   PR description. The throwaway script is not committed.

**Rejected.** Writing the pages in the Studio (the cost above, and no
reviewable diff); committing copy as Markdown the owner pastes (the same cost,
plus transcription errors); a seed script using `@sanity/client` with a token
(new tooling and a credential in the workflow, to do what `dataset import`
already does); leaving `[[CONFIRM]]` as a convention with no enforcement (the
first forgotten one is a placeholder on a live page).

## 11. Retrospective specs that change

Done in the same change as the code, as the spec's Assumptions require:

| Spec                          | Edit                                                                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `002-work-gallery`            | Project page: a link to the matching live landing page when one exists (FR-028). The work filter is unchanged; say so.                                                                                                                                  |
| `004-services-page`           | Each package with a live landing page links to it (FR-027); packages without one render as before. Note the shared `ServicePackageDetails` component (§12).                                                                                             |
| `007-cms-studio-content-sync` | Two new content types (`serviceLandingPage`, `serviceLandingSettings`) in the Studio's coverage list (FR-001 and Key Entities there). The invalidation tag already covers any type. Note that bulk import is a separate path with no Studio validation. |
| `008-seo-metadata`            | New public pages in "public pages"; sitemap entries; new structured-data types (`Service`, `FAQPage`) and the breadcrumb Home › Services › page; FR-005a's list of sub-pages; FR-007's note that the services page schema is unchanged.                 |

`006-site-navigation-shell` also changes by one line: landing pages mark
**Services** as the current section (§12). The primary navigation's _items_ are
untouched, which is what FR-030 protects.

## 12. Shared components and tokens (Principle VII)

**Two promotions, forced by F9 and the "two or more places" rule.**

1. **`src/components/ui/CallToAction/`** — a `section` with an `h2`, a body
   paragraph and an actions row, with an `id` for `aria-labelledby`. `JournalCta`
   becomes a thin wrapper that supplies its two buttons and its outer placement
   (width and margin come from the caller's `className`, since they are journal
   article layout, not call-to-action design). The `--journal-cta-heading-size`,
   `-pad` and `-gap` tokens become `--cta-*`. The journal's rendering must not
   change; the existing journal page tests and the CSS-diff script
   (`npm run audit:css-diff`) prove it. `LandingCta` is then a wrapper too.
2. **`src/components/service/ServicePackageDetails/`** — the features list and
   the "STARTING FROM" price, moved out of `ServiceExperience`. The services page
   uses it with no visual change (same `--service-detail-*` tokens, checked with
   the CSS-diff script); the landing page's package block uses it too, which is
   what makes FR-016's "the same details the services page shows" a fact about
   the code rather than about two components agreeing.

Not promoted, with the reason: the **package booking button** (a `Button` with a
label, which already is the shared primitive); the **FAQ** and **sections**
(one consumer each).

**Pre-existing tension, contained and not widened.** "Book now" and "STARTING
FROM" are written in code today (`ServiceExperience`, `HomeExperience`), which
sits uneasily with Principle I. Moving them to the CMS would change the services
page and the home page, and the brief forbids touching the home page's copy, so
those two existing literals stay where they are. This feature does not add a
third. "STARTING FROM" moves, unchanged, into the shared `ServicePackageDetails`
(a relocation of one existing string, not a new one). The landing page's booking
button takes its text from a required `packageBookLabel` in the shared settings,
so the new component carries no literal. (An earlier draft reused the literal
"Book now" in `LandingPackage` and called it "no new copy"; the analysis pass
rightly counted it as a new hardcoded string in a new component.)

**Tokens.** New values are added to `src/styles/_tokens.scss` first, under a
`--landing-*` family (header and section padding, text measure, section gap,
heading and body sizes paired with their leadings, project grid gap, FAQ item
gap) and a `--cta-*` family replacing `--journal-cta-*`. Breakpoints use the
`media-max`/`media-min` mixins. `npm run audit:design-system` must exit 0.

**`PageShell`** gains a `landing` variant that marks `/service` as current. A
landing page sits in the services section the way a project sits in work, and
its breadcrumb says so. This changes which nav item is _highlighted_, not what
the navigation contains. It needs `.page-shell__main--landing` in the main-region
selector list and a `PageShell.test.tsx` case.

## 13. Test approach

The plan's tests, by boundary. Which files cover which requirement is in
[plan.md](./plan.md).

| Layer       | What                                                                                                                                                                                                         | Mocked boundary                                                                                                | Why                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `countWords`, `assessLandingPageQuality` (boundary: exactly the minimum, one under, whitespace-only, lone punctuation), `categoriesMatch`, `composeLandingHeading`, slug rules, reserved-route drift         | none                                                                                                           | Pure functions                                                                                                                                           |
| Unit        | `buildLandingServiceSchema`, `buildLandingFaqSchema`, shared offer builder                                                                                                                                   | none                                                                                                           | Pure; assert `@id` references, `alternateName` present only when set, FAQ text equal to page text                                                        |
| Integration | `fetchers.test.ts` extensions: every required landing field raises, missing/unpublished/priceless package raises, the marker raises, the live filter appears in every landing query, `getServices` unchanged | `sanityClient.fetch` (the module boundary every other fetcher test uses)                                       | No network; this is the established seam                                                                                                                 |
| Integration | The landing page, awaited as a Server Component (`work/[slug]/page.test.tsx` pattern): renders every section in order, 2 projects, 0 projects, 404 on bad shape (no fetch), 404 on unknown, content error    | `@/sanity/fetchers`, `next/navigation` (`notFound` throws, so a returning mock cannot hide a bug), `PageShell` | The page's contract with each is narrow; a real `PageShell` is async and cannot nest in Testing Library                                                  |
| Integration | Services page and project page: link present only for a live page; `ServiceExperience` unchanged for a package without one                                                                                   | fetchers                                                                                                       | Same                                                                                                                                                     |
| Integration | `seo-routes.test.ts` extensions: live pages in the sitemap with image and `lastModified`, switched-off absent, malformed raises                                                                              | fetchers                                                                                                       | Existing pattern                                                                                                                                         |
| Integration | The launch content files pass `assessLandingPageQuality`, contain no `[[CONFIRM` in a document that has `published: true`, and have `published: false` and `approvedAgainstBrief: false`                     | none (reads the file)                                                                                          | The only check on imported content (§4b)                                                                                                                 |
| Browser     | Playwright `e2e/landing.spec.ts` under `underBothMotionPreferences`: services → landing; landing → contact; project → landing → back to the project; unknown root path is a real 404; static routes unharmed | none                                                                                                           | Real navigation, the page transition and the HTTP status (F6) are what jsdom cannot show. Browser-only behaviour is not faked in a unit test (AGENTS.md) |

Studio validators are **not** unit-tested through Sanity (the Studio is not
mocked; `src/sanity/schemaTypes/**` is excluded from coverage by design). Their
logic is the pure functions above, which are tested; the validators are thin
calls into them, checked once by loading the Studio (quickstart step 2), the
same standard `journalPost` is held to. `journalPost.test.ts` shows the one
thing worth testing on a schema: its declared fields and rules, which a
`landingPage.test.ts` mirrors.

Two e2e behaviours stay manual by nature and are in the quickstart instead: a
brand-new slug going live within a minute of publishing (needs a live Studio
and a webhook), and the FAQ rich-result question (needs a search engine).

## 14. What the amended spec now says about all this

Step 0 of this plan edited `spec.md`: FR-038 to FR-043 (sections, the quality
minimums, accuracy, the brief, the package-is-not-the-bulk rule, and the
`serviceName`/`headingPattern` fields), the Story 3 scenarios, edge cases for
thin pages, miscounted words, import bypass and package contradiction, Key
Entities (Content Section, Content Brief), SC-012 and SC-013, and Assumptions
(who writes the launch content, the distinctness check, tunable numbers, and
that Studio blocking does not reach imports). No duplicate-text detection was
added anywhere, per the instruction. Two things go slightly beyond the text you
gave me, both flagged at the end of the plan run: **FR-043** (`serviceName` and
`headingPattern`, §8) and the **`approvedAgainstBrief` field** (§10).
