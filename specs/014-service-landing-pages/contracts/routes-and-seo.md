# Contract: Routes, Metadata, Structured Data, Sitemap and Links

**Feature**: 014-service-landing-pages | **Date**: 2026-10-07

Everything a crawler, a link-unfurler or another page of the site can observe.
Reasoning is in [research.md](../research.md) §1, §2, §6–§9. Below, `<heading>`
is the composed heading (`composeLandingHeading`) and `<url>` is
`absoluteUrl("/" + slug)`.

## Route

| Request                                                                                                                                | Result                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `GET /<slug>` for a live page                                                                                                          | 200, the landing page                                             |
| `GET /<slug>` for a switched-off, draft-only or deleted page                                                                           | 404, `noindex`, the site's `not-found` page                       |
| `GET /<segment>` that fails `LANDING_SLUG_PATTERN` (has a dot, capital, underscore…)                                                   | 404, `noindex`, **with no CMS read**                              |
| `GET /<segment>` that is in `RESERVED_ROOT_SEGMENTS` and not a real route                                                              | 404 with no CMS read                                              |
| `GET /work`, `/service`, `/about`, `/contact`, `/journal`, `/studio`, `/api/*`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | **Unchanged.** Static segments are matched before the dynamic one |
| `GET /pre-wedding-photographer-london-ontario`                                                                                         | 404. No alias exists (spec Assumptions)                           |

- File: `src/app/(site)/[landingSlug]/page.tsx`. Dynamic segment name:
  `landingSlug`.
- `generateStaticParams`: slugs of the live pages. `dynamicParams` is left at its
  default `true`, so a page created after the last build renders on first request
  and is then cached under the `sanity` tag (FR-009).
- Order inside the page component: shape gate → `getLandingPageBySlug` → `null`
  → `notFound()` → _then_ `getLandingPageSettings`, `getSiteSettings`,
  `getWorkProjects`. An unknown slug never pays for the settings reads, and
  missing settings raise rather than rendering a page with no call to action.
- `PageShell variant="landing"`; marks `/service` as the current navigation item.

## Metadata (`generateMetadata`)

| Output        | Value                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `title`       | `seoTitle` (the root template appends ` \| Larah Photo`)                                                         |
| `description` | `seoDescription`                                                                                                 |
| canonical     | `/<slug>`                                                                                                        |
| OG / Twitter  | the same title, description and URL; `images: [toOpenGraphImage({ src: package.image, alt: package.imageAlt })]` |
| Not live      | `{ title: "Page not found", robots: { index: false } }`                                                          |

Built with `pageMetadata`, as every other page is. No other page on the site
shares a landing page's title, description or canonical URL, and no other landing
page shares its preview image (SC-003). **One deliberate exception:** the services
page previews with the lead package's image (`service/page.tsx`) and is not
changed (FR-027), so the landing page for that one package shares that image with
the services page. Their titles, descriptions and canonicals still differ.

## Structured data

Four blocks on a live page: the business (emitted once by `PageShell`, unchanged)
plus three from the page. Each is its own `<script type="application/ld+json">`
through `JsonLd`, like the other pages. All text comes from what the page
displays (FR-025); none comes from a held-back page.

### `Service` — `buildLandingServiceSchema(page, settings, currency)`

The values below are illustrative.

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "<url>#service",
  "name": "Engagement",
  "alternateName": "Pre-wedding",
  "serviceType": "Engagement",
  "description": "<the introduction's paragraphs, joined by a space>",
  "url": "<url>",
  "image": "<package.image>",
  "areaServed": "<siteSettings.location>",
  "provider": { "@id": "<businessId>" },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": 450,
    "priceCurrency": "CAD",
    "availability": "https://schema.org/InStock"
  }
}
```

- `name` and `serviceType` are `serviceName`; `alternateName` is
  `alternateName` and is **omitted** (not empty) when unset, via `compact`.
- `description` is the visible introduction, not the search description.
- `offers` is built by one helper shared with `buildServiceListSchema`, so the
  services page and the landing page state "starting at" the same way; the price
  is `package.price`.
- `provider` is the `@id` reference to the business `PageShell` declares;
  the business is never restated (FR-022).

### `FAQPage` — `buildLandingFaqSchema(page)`

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "<url>#faq",
  "url": "<url>",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "<question>",
      "acceptedAnswer": { "@type": "Answer", "text": "<answer>" }
    }
  ]
}
```

Every question, in the editor's order, with the answer **byte-for-byte as
rendered** (plain text; research §9). A test asserts the schema's strings equal
the page's strings.

The spec's rich-result caveat (Assumptions) stands: this is valid markup that
mirrors the page; a search engine may or may not decorate the result.

### `BreadcrumbList` — `buildBreadcrumbSchema`

`Home` (`/`) › `Services` (`/service`) › `<heading>` (`/<slug>`).

## Sitemap (`src/app/sitemap.ts`)

Added per live page, from `getLandingPages()`:

```text
{ url: absoluteUrl("/" + slug), lastModified: new Date(updatedAt), images: [packageImage.src] }
```

- Not-live pages are not returned by the query, so they cannot appear.
- A malformed live page **raises** from the sitemap; it is never skipped
  (research §7).
- The three existing groups (static routes, projects, journal) are unchanged.

## Inbound links

Both read `getLandingPageLinks()`, which returns ready link text.

| Where                  | Rule                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Services page          | Each package whose `id` equals a link's `packageId` gets a link: `href="/<slug>"`, text `<heading>`. A package with none renders exactly as today (FR-027) |
| Project page           | A project with a link whose `category` matches (`categoriesMatch`) gets one link to it. None → nothing rendered, no error. The overlay does not render it  |
| Landing page → work    | Each shown project links to `/work/<slug>` through `WorkCard` (FR-014)                                                                                     |
| Landing page → contact | A call to action `Button href="/contact"` (FR-018) plus the package's own `ctaHref` booking button (FR-016)                                                |

Link text is always the composed heading (FR-029), never "learn more". Each
inbound link carries the identity attribute `data-landing-link` (see
[test-surface.md](./test-surface.md)).

## Not changed

The primary navigation's items, the work page and its client-side filter, the
home page, the existing structured-data builders other than the one shared
offer helper (its output for `buildServiceListSchema` is identical and a test
pins that), and the image configuration in `next.config.ts` (no new size, format
or quality; Principle III).
