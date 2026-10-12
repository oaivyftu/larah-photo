# Contract: Studio Content Model

**Feature**: 014-service-landing-pages | **Date**: 2026-10-07

What the Studio offers an editor, what it refuses, and what it only advises.
This is the contract between the schema and the person using it; the shape of
the data is [data-model.md](../data-model.md), the reasoning is
[research.md](../research.md) §4.

**Blocks** = a validation _error_: the Studio will not let the document publish.
**Advises** = a validation _warning_: shown, never blocking (the same split
`journalPost` uses for its 200/60/160 character guidance).

All counting uses `countWords` (research §4a): whitespace-split tokens that
contain a Unicode letter or digit. A lone dash or ampersand is not a word;
whitespace-only is zero; exactly the minimum passes, one under fails.

## Document: Service landing page

### Fields as the editor sees them

| Field (label)              | Help text shown under it                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Published                  | "Off until you switch it on. A page that is off is invisible to visitors, the sitemap and search engines, and nothing links to it. Needs the approval box below and no [[CONFIRM …]] left in the text." |
| Approved against the brief | "Tick when you have checked every statement on this page — prices, times, policies, places — against the content brief and the studio's real practice."                                                 |
| Service package            | "The package this page sells. One page per package."                                                                                                                                                    |
| Service name               | "The words clients search for, e.g. Engagement. Used in the heading. Not the package title."                                                                                                            |
| Alternate name             | "Optional. Another name clients search for, e.g. Pre-wedding. Shown in the heading and declared in the page's search data."                                                                             |
| Project category           | "The work category this page shows, e.g. Engagement. Matched to work projects ignoring capitals and spacing. One page per category."                                                                    |
| Slug                       | "The page's address: /<slug>. Changing it on a published page breaks every existing link to it — nothing redirects the old address."                                                                    |
| Introduction               | "Opens the page. At least 50 words. One paragraph per entry."                                                                                                                                           |
| Sections                   | "What is particular to this service: what a session involves, where in London it happens, how to prepare, what happens after. At least 3, each body at least 60 words."                                 |
| Frequently asked questions | "At least 5. Each answer at least 30 words, plain text. These are also sent to search engines as the page's question-and-answer data."                                                                  |
| Search title               | "The title shown in search results and when the link is shared. Search results cut titles off around 60 characters."                                                                                    |
| Search description         | "Shown in search results. Search results cut descriptions off around 160 characters."                                                                                                                   |

### Blocking (publish refused)

| Rule                                                                | Message the editor sees (shape)                                                                                                                          |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any required field empty                                            | Field name and "is required"                                                                                                                             |
| Another page already uses this package                              | "The page “<serviceName>” already uses this package. Open that page instead."                                                                            |
| Another page already uses this category (ignoring case and spacing) | "The page “<serviceName>” already shows this category."                                                                                                  |
| Slug not lower-case letters, digits and hyphens                     | "Use lower-case letters, digits and hyphens only."                                                                                                       |
| Slug already used by another landing page                           | Sanity's built-in "Slug is already in use"                                                                                                               |
| Slug is a reserved address                                          | "“work” is an existing page of the site. Choose another slug."                                                                                           |
| Introduction under 50 words                                         | "The introduction has 38 words; it needs at least 50 (12 more)."                                                                                         |
| Fewer than 3 sections                                               | "The page has 2 sections; it needs at least 3."                                                                                                          |
| A section body under 60 words                                       | "The section “<heading>” has 44 words; it needs at least 60 (16 more)."                                                                                  |
| Fewer than 5 questions                                              | "The page has 4 questions; it needs at least 5."                                                                                                         |
| An answer under 30 words                                            | "The answer to “<question>” has 21 words; it needs at least 30 (9 more)."                                                                                |
| Total editorial text under 400 words                                | "The page has 361 words of its own text; it needs at least 400 (39 more). Add to the introduction, a section or an answer." (points at the introduction) |
| **Published** switched on without approval                          | "Tick “Approved against the brief” before switching this page on."                                                                                       |
| **Published** switched on while any text contains `[[CONFIRM`       | "Replace every [[CONFIRM …]] with the real detail before switching this page on. Found in: <field names>."                                               |

Total editorial text counts the introduction, every section heading and body,
and every question and answer. It does not count the package, the search title,
or the search description.

### Advising (publish allowed)

| Rule                                             | Message                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Search title over 60 characters                  | "Search results cut titles off around 60 characters."                                            |
| Search description over 160 characters           | "Search results cut descriptions off around 160 characters."                                     |
| Category matches no work project                 | "No work project uses “<category>”. The page will publish with no projects. Check the spelling." |
| Slug changed on a page that is already published | "This page is published at /<old>. Changing the slug breaks every existing link to it."          |

### Uniqueness checks are against other landing pages only

They count the other documents of this type, excluding this one in both its draft
and published ids. They do **not** look at the text of other pages. There is no
check that one page's wording differs from another's (spec Assumptions).

## Document: Service landing settings (one)

| Field                 | Rule                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Heading pattern       | Blocks unless it contains both `{service}` and `{city}`. Help: "e.g. {service} Photographer in {city}."  |
| Projects heading      | Required                                                                                                 |
| Package heading       | Required                                                                                                 |
| Package booking label | Required. The text of the package block's booking button; the link itself is the package's own `ctaHref` |
| Questions heading     | Required                                                                                                 |
| Call to action        | Heading, text and contact link label, all required                                                       |

## What the site enforces on top (fetcher guards)

The Studio's rules are the editor's feedback. The site re-checks the **structure**
it cannot render without, and raises a content error naming the document and field
(Principle I):

- every required field present and non-blank; every paragraph, heading, question
  and answer non-blank;
- at least one section and at least one question (not the Studio minimums — the
  floor, not the policy; research §4b);
- the package resolves, is published, and has a price and an image;
- no text field contains `[[CONFIRM`;
- the settings document complete, with a valid heading pattern.

The site deliberately does **not** re-check the word minimums at read time.

## Registering the types

`serviceLandingPage` and `serviceLandingSettings` are added to `schemaTypes` in
`src/sanity/schemaTypes/index.ts`. The revalidation webhook already busts one
site-wide cache tag for any document type (spec 007), so no change there.
