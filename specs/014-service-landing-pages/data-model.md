# Data Model: Service Landing Pages

**Feature**: 014-service-landing-pages | **Date**: 2026-10-07

Two new Sanity document types, one shared constants module, and the TypeScript
shapes the fetchers hand to the page. Nothing existing is migrated: both types
are additive and every current document is untouched. The Studio rules are
specified in [contracts/content-model.md](./contracts/content-model.md); this
file is the shape and the relationships.

## Sanity: `serviceLandingPage`

One document per landing page. A page is **live** when it is published in the
Studio and `published == true` (research §2).

| Field                  | Type                                | Required | Rule                                                                                                                        | Spec           |
| ---------------------- | ----------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `published`            | boolean                             | yes      | Default `false`. Cannot be set `true` unless `approvedAgainstBrief` and no text field contains `[[CONFIRM`                  | FR-002, FR-041 |
| `approvedAgainstBrief` | boolean                             | yes      | Default `false`. "I have checked every statement on this page against the content brief and the studio's real policies."    | FR-041         |
| `package`              | strong reference → `servicePackage` | yes      | At most one page per package                                                                                                | FR-001, FR-003 |
| `serviceName`          | string                              | yes      | The words a client searches, e.g. "Engagement". Not the package title                                                       | FR-043         |
| `alternateName`        | string                              | no       | e.g. "Pre-wedding". Blank or whitespace is treated as unset                                                                 | FR-007         |
| `category`             | string                              | yes      | Free text, matched to work projects ignoring case and spacing. At most one page per category. Advises if no project uses it | FR-001, FR-003 |
| `slug`                 | slug                                | yes      | `LANDING_SLUG_PATTERN`; unique; not in `RESERVED_ROOT_SEGMENTS`. Starting value `<serviceName>-photographer-london-ontario` | FR-004         |
| `introduction`         | array of string (paragraphs)        | yes      | At least 50 words in total                                                                                                  | FR-039         |
| `sections`             | array of `landingSection`           | yes      | At least 3                                                                                                                  | FR-038         |
| `faqs`                 | array of `landingFaq`               | yes      | At least 5                                                                                                                  | FR-001, FR-039 |
| `seoTitle`             | string                              | yes      | Advises over 60 characters                                                                                                  | FR-006, FR-021 |
| `seoDescription`       | text                                | yes      | Advises over 160 characters                                                                                                 | FR-006, FR-021 |

**`landingSection`** (object, in `sections`): `heading` (string, required) and
`body` (array of string paragraphs, required, at least 60 words in total).

**`landingFaq`** (object, in `faqs`): `question` (string, required) and `answer`
(text, required, at least 30 words, rendered as one paragraph).

**Plain text, not Portable Text, throughout** (research §9): the stored text is
the displayed text is the structured-data text.

**Preview** (the Studio list): title is `serviceName`; subtitle is
`Live once published` when `published` is true and `Held back` when it is false,
so an editor scanning the list sees which pages are switched off, the way the
journal shows "Scheduled". The preview cannot see Sanity's own draft/published
state (the Studio's badge already shows it), and the subtitle does not claim to.

### State: when does a visitor see the page?

| Studio state                | `published` | Visible?    | Why                                                                 |
| --------------------------- | ----------- | ----------- | ------------------------------------------------------------------- |
| Draft only                  | any         | No          | The client reads the `published` perspective                        |
| Published                   | `false`     | No          | The switch is the editor's hold-back (FR-002)                       |
| Published                   | `true`      | **Yes**     | Live: URL, sitemap, services-page link, project-page links, JSON-LD |
| Published, then deleted     | n/a         | No          | The document is gone; the next refresh drops it everywhere          |
| Draft of a live page edited | `true`      | Old version | The live page is the published version until the edit is published  |

Transitions that matter, and where they are enforced:

```text
 new → switch off ──edit──► approvedAgainstBrief ticked ──► switch on ──► publish ──► LIVE
        ▲                       (Studio: blocked while                        │
        │                        any [[CONFIRM]] remains)                     │
        └─────────────────────────── switch off, publish ◄────────────────────┘
```

The Studio blocks the arrow into "switch on" without approval and with open
markers. The site separately refuses to render a live page that still carries a
marker (a page that arrived by import with the switch already on).

## Sanity: `serviceLandingSettings` (singleton)

One document, read like `journalPage`. All required; a missing one is a content
error, never a default (FR-008, FR-031).

| Field              | Type   | Rule                                                                              | Spec           |
| ------------------ | ------ | --------------------------------------------------------------------------------- | -------------- |
| `headingPattern`   | string | Must contain `{service}` and `{city}`, e.g. `{service} Photographer in {city}`    | FR-043         |
| `projectsHeading`  | string | Heading above the project grid                                                    | FR-008         |
| `packageHeading`   | string | Heading above the package block                                                   | FR-008         |
| `packageBookLabel` | string | Text of the package block's booking button (links to the package's own `ctaHref`) | FR-008, FR-016 |
| `faqHeading`       | string | Heading above the questions                                                       | FR-008         |
| `ctaHeading`       | string | Contact call to action                                                            | FR-018         |
| `ctaBody`          | text   | Contact call to action                                                            | FR-018         |
| `ctaContactLabel`  | string | Link text of the contact button                                                   | FR-018         |

The contact destination `/contact` is structure, not copy, and stays in code, as
the journal's `/contact` and `/work` do.

## Existing documents, and how this feature reads them

| Document         | Read for                                                                                                        | Written? |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| `servicePackage` | The package block (via `package->`) and the social preview image. Same fields, same mapper as the services page | No       |
| `workProject`    | Projects shown, via the existing cached `getWorkProjects()`; `category` is already normalised                   | No       |
| `siteSettings`   | `location` (the city in every heading) and `priceCurrency`                                                      | No       |

## Shared constants (not Sanity)

`src/constants/landingPage.ts` — imported by the schema (relatively), the
mapper, the utilities and the tests:

| Constant                 | Value                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `LANDING_QUALITY`        | `introMinWords 50 · minSections 3 · sectionMinWords 60 · minFaqs 5 · faqAnswerMinWords 30 · totalMinWords 400` |
| `LANDING_CONFIRM_MARKER` | `"[[CONFIRM"`                                                                                                  |
| `LANDING_SLUG_PATTERN`   | `^[a-z0-9]+(?:-[a-z0-9]+)*$`                                                                                   |
| `LANDING_SLUG_SUFFIX`    | `"photographer-london-ontario"`                                                                                |
| `HEADING_PLACEHOLDERS`   | `{ service: "{service}", city: "{city}" }`                                                                     |

`src/constants/reservedRoutes.ts` — `RESERVED_ROOT_SEGMENTS`: `work`, `service`,
`about`, `contact`, `journal`, `studio`, `api`. A drift test keeps it equal to
the static top-level routes (research §1).

## TypeScript shapes (`src/types/landing.ts`)

```text
LandingFaq        = { question: string; answer: string }
LandingSection    = { heading: string; paragraphs: string[] }

LandingPageSummary = {            // from getLandingPages(); sitemap, links, params
  slug: string
  serviceName: string
  alternateName?: string
  category: string
  packageId: string               // coalesce(package->id, package->_id)
  packageImage: ProjectImage
  updatedAt: string               // ISO, from _updatedAt
}

LandingPage = LandingPageSummary & {   // from getLandingPageBySlug()
  introduction: string[]
  sections: LandingSection[]
  faqs: LandingFaq[]
  seoTitle: string
  seoDescription: string
  package: ServicePackage              // the existing type, via mapSanityService
}

LandingPageLink = {               // from getLandingPageLinks(); services + project pages
  slug: string
  href: string                    // "/" + slug
  heading: string                 // composed once; link text, breadcrumb, h1
  packageId: string
  category: string
}

LandingPageSettings = {
  headingPattern: string
  projectsHeading: string
  packageHeading: string
  packageBookLabel: string
  faqHeading: string
  cta: { heading: string; body: string; contactLabel: string }
}
```

`alternateName` is trimmed and left `undefined` when blank, the way the journal's
`optionalString` handles an override.

## Derived values

| Value                | Computed from                                                                       | Used by                                                    |
| -------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Heading              | `composeLandingHeading(pattern, serviceName, alternateName, siteSettings.location)` | `h1`, every inbound link's text, breadcrumb, JSON-LD names |
| Projects shown       | `getWorkProjects().filter(p => categoriesMatch(p.category, page.category))`         | The projects section; empty → section omitted              |
| Editorial word count | intro + section headings and bodies + questions and answers                         | `assessLandingPageQuality`; the total-400 rule             |
| Social preview image | `package.image` / `package.imageAlt`                                                | `pageMetadata` images; sitemap `images`                    |
| Last modified        | the landing document's `_updatedAt`                                                 | Sitemap `lastModified`                                     |

## What deliberately does not exist

- No field linking a project to a landing page. The link is derived from the
  category (research §3, §6), so a project never needs editing to be linked.
- No stored heading. It is derived, so a change of `siteSettings.location` or of
  the pattern moves every page at once.
- No cross-page uniqueness field or check (instruction; spec Assumptions).
- No redirect table. A changed slug moves the page and 404s the old URL.
