# Contract: Journal Content Model

**Feature**: 013-journal-section | **Date**: 2026-09-15

What the Studio offers an editor, and what it refuses. Field tables live in
[data-model.md](../data-model.md); this file is the behavioural contract — what
blocks a publish, what merely advises, and what the editor sees.

---

## Blocks publishing (validation errors)

| Condition                                            | Message the editor should see                                                | Source  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | ------- |
| Any required field empty                             | the field's own required message                                             | FR-004  |
| A slug already used by another post                  | "Slug is already in use" — Sanity's built-in slug check, not duplicated here | FR-001  |
| An inline image with no alt text                     | "Alt text is required."                                                      | FR-002a |
| An embed URL outside the allow-list                  | names the three accepted providers                                           | FR-002b |
| An embed with no description                         | "Describe what this embed shows."                                            | FR-002c |
| A link annotation with no or non-http(s)/mailto href | "Enter a valid link."                                                        | FR-002  |
| Journal page settings missing any of its six fields  | the field's own required message                                             | FR-006  |

## Advises only (warnings)

| Condition                      | Why it is a warning and not an error                        | Source |
| ------------------------------ | ----------------------------------------------------------- | ------ |
| Excerpt over 200 characters    | search results truncate; the editor may still want the copy | FR-005 |
| SEO title over 60 characters   | same                                                        | FR-005 |
| SEO description over 160 chars | same                                                        | FR-005 |

## What the editor must be able to tell at a glance

- **Whether a published post is live or scheduled** (FR-007b). The document
  preview's subtitle reads `Scheduled · <date>` while the date is ahead, and
  just the date once it has arrived. It deliberately never says "Live": a
  preview cannot see publish state, so an unpublished draft would read as live.
  Sanity's own draft/published badge carries that half.
- **That changing a live post's slug breaks its existing links** — a description
  on the slug field, since the site creates no redirects (spec Edge Cases).

## Body composition

Available: `h2`/`h3`/`h4`, normal paragraphs, pull quotes (the `blockquote`
style), bullet and numbered lists, bold, italic, links, images (alt required,
caption optional), embeds. Not available:
`h1` — the post title is the page's only top-level heading, and the Studio is
where that is enforced rather than hoped for.

## Where the category list lives

`src/constants/journalCategories.ts`, imported by both the schema and the
fetcher (research.md §10). Adding one is a code change and a deploy; publishing
a post in an existing category never is.

`workProject.category` is unaffected and stays free text.

## Studio structure

Both new types appear in the Studio's document list: `journalPost` as a
collection, `journalPage` as a singleton alongside the other page settings
documents. The Studio route stays excluded from indexing, as spec 007 requires —
nothing about this feature changes that.
