# Specification Quality Checklist: Service Landing Pages

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-06
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

- Validated on 2026-10-06. All 16 items pass on the first iteration.
- "CMS Studio", "sitemap", "structured data" and "canonical URL" are kept as
  domain vocabulary — the same terms specs 007, 008 and 013 use — rather than
  implementation detail. No framework, query language, schema library or file
  path appears in a requirement; the only paths named are the existing routes
  an editor's slug must not collide with (FR-004, an observable behaviour) and
  the retrospective specs flagged for downstream update in Assumptions.
- No [NEEDS CLARIFICATION] markers were raised. Every open decision had a
  reasonable default and is recorded in Assumptions instead, so none blocks
  planning. The three the user is most likely to want to overrule:
  1. **"Both names resolve to the one Engagement page" means one page serving
     both searches, with no alias URL or redirect for pre-wedding.** The brief
     could be read as asking for a redirect; the spec reads it as the opposite
     of a second page, and notes redirects are out of scope. Cheapest to
     change before planning.
  2. **Search title and description are required fields, not optional
     overrides** (unlike the journal). The Engagement page must carry both
     names in them, so the editor writes them explicitly.
  3. **The social preview image is the service package's image.** It gives
     each page a distinct image with no extra upload and keeps the services
     page and landing page in agreement; a per-page override is out of scope.
- Brief correction recorded in Edge Cases and Assumptions: the work page's
  categories are free text (spec 002), not a fixed list, so the landing page
  matches categories ignoring case and spacing and the Studio advises on a
  category that matches no project, rather than the spec assuming a vocabulary
  that does not exist.
- A risk carried into planning, recorded in Assumptions: because a malformed
  live page raises a content error everywhere it is read, one broken page can
  fail sitemap generation as well. This matches the journal's behaviour and the
  constitution's no-silent-fallback rule; planning should weigh it, not
  rediscover it.
- Landing pages sit at the top level of the site (`/<slug>`), unlike the
  journal's `/journal/<slug>`. Planning must therefore handle slug-vs-route
  collisions (FR-004) and serving a new slug with no deploy (FR-009), neither
  of which the journal needed.
- SC-011 (search impressions) is a post-launch business outcome and is marked
  as not a release gate, since ranking depends on the search engine. FAQ
  rich-result display is likewise not promised (Assumptions).

## Re-validation — 2026-10-07 (spec amended before planning)

The spec was amended before `/speckit-plan` to require substantial, accurate,
locally specific content on every page: FR-038 to FR-043, the Story 3 scenarios
9 and 10, four edge cases, Key Entities (Content Section, Content Brief), SC-012
and SC-013, and four Assumptions. All 16 items still pass.

- No `[NEEDS CLARIFICATION]` markers were added. The word numbers (50, 3 × 60, 5
  × 30, 400) are recorded in Assumptions as tunable defaults, as instructed.
- FR-039's numbers are the first requirements with fixed thresholds. They are
  measurable and testable, and Assumptions says plainly that they measure length,
  not quality, so no success criterion overclaims.
- **Two additions go beyond the amendment text** and should be confirmed:
  FR-043 (a required `serviceName` field and a heading pattern in the shared
  settings, because the package title cannot be assumed to read as a search
  term), and the `approvedAgainstBrief` checkbox described in plan research §10
  (this one is in the plan and data model, not the spec's requirements, which
  say only that approval must happen before the switch is turned on).
- No duplicate-text detection requirement exists anywhere in the spec, per the
  instruction. The only mention is the Assumption that Claude checks the launch
  pages itself and that the Studio does not.
- Checklist item "No implementation details" still passes: the new requirements
  describe words, sections and approvals, not fields or validators. The mapping
  to fields is in the plan.

## Analysis follow-up — 2026-10-08 (`/speckit-analyze`)

Three findings were fixed; the checklist still passes on all 16 items.

- **C1 (Principle I)**: the package block's booking button would have been a
  third hardcoded "Book now" in a new component. FR-008 and Key Entities now list
  a required `packageBookLabel` in the shared settings; no landing component
  carries a literal. The existing literals on the services and home pages are
  untouched (the brief forbids changing the home page's copy).
- **I1 (ordering)**: nothing created the settings document before the first
  manual check that puts a page live. `tasks.md` gains T023 (write
  `settings.json`) and T024 (publish it) in Phase 2, ahead of T048, T060 and
  T068; the later tasks were renumbered (91 tasks) and the quickstart
  prerequisites say so.
- **I2 (SC-003 / FR-021)**: the services page already previews with the lead
  package's image, so the landing page for that package cannot have a preview
  image of its own. The requirement now says the title, description and canonical
  URL are shared with no other page, the preview image with no other landing
  page, and names the one exception. The alternative (changing the services
  page's preview) was rejected as an unrelated edit to a page FR-027 promises not
  to alter.
