# Quickstart: Validating the Journal Section

**Feature**: 013-journal-section | **Date**: 2026-09-15

How to prove the feature works, end to end, once it is built. Scenarios are
ordered so each builds on the last. Field definitions are in
[data-model.md](./data-model.md); expected route output is in
[contracts/routes-and-seo.md](./contracts/routes-and-seo.md).

## Prerequisites

- `.env.local` with `NEXT_PUBLIC_SANITY_PROJECT_ID` and
  `NEXT_PUBLIC_SANITY_DATASET` (the app raises without them, by design).
- Studio access to the dataset.
- `npm install` has run.

```bash
npm run dev
```

Studio is at `/studio`, the journal at `/journal`.

---

## Scenario 1 — The empty journal is not an error

With no posts published yet, open `/journal`.

**Expect**: the page heading and the empty-state message from Journal page
settings. No error, no blank area, no placeholder copy. `/sitemap.xml` lists
`/journal` and no post URLs. (FR-015, spec Edge Cases)

If Journal page settings do not exist yet, expect the opposite: an explicit
content error naming the missing document. That is FR-025 working.

---

## Scenario 2 — Publish a post, see it live

In the Studio, create a journal post. First try to publish it with the body
empty and an inline image with no alt text.

**Expect**: publishing is blocked, and the messages name the fields.
(FR-004, contracts/content-model.md)

Complete it — title, slug, cover with alt, excerpt, body, location, category,
today's date — and publish.

**Expect**: within about a minute (the webhook, not the hourly fallback), the
post is at `/journal/<slug>`, on `/journal`, and in `/sitemap.xml` with its
cover image and its own `lastModified`. No deploy. (SC-001, FR-007, FR-021)

---

## Scenario 3 — A rich body renders as an article

Add to the post: two `h2` sections, a numbered list, a bulleted list, a
bold/italic phrase, an internal link to `/work`, an image with a caption, and a
YouTube link pasted as `youtube.com/watch?v=…`.

**Expect**:

- Headings render as `h2`; the post title is the page's only `h1`.
- The caption is visible; the alt text is not (it is on the image).
- The internal link uses the site's normal page transition; the embed's
  `iframe` `src` points at **`youtube-nocookie.com`**, not `youtube.com`.
  (research.md §4, contracts/embed-providers.md)
- Scrolling to the embed is what loads it; the space it occupies was reserved
  before that.

Now paste a URL from an unlisted provider into a new embed.

**Expect**: the Studio refuses to publish and names the three accepted
providers. (FR-002b)

---

## Scenario 4 — Scheduling

Set the post's date a few days ahead and publish.

**Expect**: `/journal/<slug>` returns not-found; the post is absent from
`/journal` and `/sitemap.xml`; the Studio shows it as scheduled.
(FR-007a, FR-007b, FR-022)

To verify the appearance without waiting days, set the date back to today and
wait for revalidation (or restart `npm run dev`).

**Expect**: the post returns, with no further Studio action.

A date-display check worth doing once: with a post dated today, confirm the
rendered date is today for a visitor in a timezone behind Toronto — this is the
UTC-parse trap in research.md §3, and it shows up as yesterday's date.

---

## Scenario 5 — Metadata, structured data, navigation

With at least one live post:

```bash
curl -s localhost:3000/journal/<slug> | grep -o '<title>[^<]*'
curl -s localhost:3000/journal/<slug> | python3 -c "import sys,re,json; [print(json.dumps(json.loads(m),indent=1)[:400]) for m in re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', sys.stdin.read(), re.S)]"
```

**Expect**: the title is the post's (or `seoTitle` when set); the JSON-LD
includes the studio business, a `BlogPosting` with `datePublished`,
`dateModified`, `articleSection` and `contentLocation`, and a breadcrumb
Home › Journal › title. Validate against Google's Rich Results Test before
launch (SC-003).

Add a Journal entry to the primary navigation in site settings.

**Expect**: it appears in the header, and is marked current on both `/journal`
and a post page. Until it is added, the section is still reachable by URL and
sitemap — a valid state (FR-024).

Finally, check the end of the post.

**Expect**: the call-to-action's two links reach `/contact` and `/work` in one
activation, using the wording from Journal page settings. (FR-011, SC-006)

---

## Scenario 6 — The gates

```bash
npm run lint
npm run typecheck
npm run audit:design-system
npm test
npm run build
```

All five must pass; the audit must report zero literals from the new
stylesheets. Then the browser suite, which the push hook runs anyway:

```bash
PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e
```

**Expect**: the journal journeys pass with a live post present, and skip with a
clear message when the dataset has none — not fail.
(contracts/test-surface.md)
