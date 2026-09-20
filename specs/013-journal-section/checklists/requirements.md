# Specification Quality Checklist: Journal Section

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-14
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Validated on 2026-09-14; re-validated on 2026-09-15 after `/speckit-clarify`.
  All 16 items pass; no item changed state in either pass.
- "CMS Studio", "sitemap", "structured data" and "canonical URL" are kept as
  domain vocabulary — the same terms specs 007 and 008 use — rather than
  implementation detail. No framework, query language, schema library or file
  path appears in a requirement; the only paths named are the three
  retrospective specs flagged for downstream update in Assumptions.
- No [NEEDS CLARIFICATION] markers were ever raised. The five open decisions
  were instead resolved in the clarification session recorded at the top of
  the spec:
  1. Category is a **fixed list** (five work categories + Location Guide +
     Behind the Scenes), not free text like work projects.
  2. The section lives at **`/journal`**, posts at `/journal/<slug>`, labelled
     "Journal" in the navigation. Treated as permanent once indexed.
  3. Every post ends with the **same call-to-action** to Contact and Work,
     worded in Journal page settings. No per-post related-projects field.
  4. A future published date **schedules** the post (FR-007a/FR-007b). This
     overrode the drafted default, which showed such posts immediately; the
     spec's "live vs scheduled" wording now carries through the listing,
     sitemap, structured data and SC-002.
  5. The body is **rich**: lists, image captions, pull quotes, emphasis, and
     map/video embeds (FR-002 through FR-002d). Embeds are the only
     third-party content on a journal page, so they are constrained to an
     allow-list, cannot be raw markup, and cannot block the post from reading.
- Brief correction recorded in Assumptions: the brief describes SEO
  title/description overrides as an existing site pattern. No content type has
  editor-set SEO fields today; the journal introduces them.
- SC-008 (search impressions) is a post-launch business outcome and is marked
  as not a release gate, since ranking depends on the search engine.
- Two areas carry more risk into planning than the rest, both from answer 5:
  the embed allow-list (which providers, and their privacy-preserving modes,
  given the site has no cookie-consent banner) and scheduling's reliance on
  the site's hourly refresh, which makes a post's appearance approximate
  rather than exact. Both are decided in the spec; what remains is execution.
