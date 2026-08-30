# Specification Quality Checklist: Browser End-to-End Tests

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-26
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

- **The tool is never named in the requirements or success criteria.** Playwright
  appears nowhere in FR-001 to FR-009 or SC-001 to SC-008 — they say "a real
  browser" and "the real animation and carousel libraries". The choice belongs to
  the plan, and writing it into the spec would make a tool swap look like a
  requirements change.
- **The premise this feature was requested under was wrong, and the spec says so.**
  It was described as reversing feature 009's FR-007. It does not: FR-007 forbids
  browser tests _in the Git hooks_ and states in the same sentence that E2E
  "remains available as a separate, manually- or CI-triggered process outside
  these hooks", and the constitution says the same. This feature fulfils what both
  already anticipated. Correcting that mattered because a feature framed as
  overturning a prior decision invites re-litigating it.
- **Counts in the Assumptions are deliberate**, as in features 010 and 011. A
  success criterion like "a visitor can move through a project's photographs" is
  only meaningful against a known starting point, and the 169-of-186 figure is
  what makes the case for a browser at all. It was 170 in the first draft, beside
  a table whose rows summed to 165; re-measuring on 2026-08-29 found the missing
  row and the off-by-one. Being deliberate about a count is worth nothing if the
  count is not checked, which is why `tasks.md` T038 makes re-measuring a task
  rather than a habit.
- **FR-007 and SC-008 exist because of one specific known duplicate**: the page
  heading reveal, written out identically in four route components. Testing one
  route would leave three copies free to drift while the suite reported success —
  the exact false assurance this feature exists to remove. Consolidating it first
  is recorded in Assumptions rather than left to the plan to notice.
- **FR-009 excludes visual comparison on its merits**, not by omission. On a site
  built around motion, screenshot diffing fails on font rendering and animation
  timing, and a suite nobody trusts is worse than no suite.

## What shipped (2026-08-29)

- **115 of the 169 browser-coupled statements are now exercised** — the gallery
  (96), the pointer follower (15) and the four route intro callbacks. The home
  page's scroll choreography (48) and the album layout's measurement code (6)
  are the named remainder, out of scope because FR-002 does not list them and no
  user story describes them. Roughly two thirds, said out loud rather than
  rounded up.
- **The Vitest coverage number does not move, and should not be expected to.**
  Re-measured after the work: 186 uncovered statements, the same four areas at
  the same counts. A browser suite reports no statement coverage into that
  number, so a reader comparing before and after will see nothing change. What
  changed is that the code is now exercised by something that fails when it
  breaks.
- **The suite found a real bug on its first honest run.** `PageTransition` set
  its "have we navigated yet" flag inside a 780 ms timeout, so a visitor who
  followed a link sooner than that lost the focus move and the route
  announcement for that navigation — hitting reduced-motion visitors hardest,
  because their content is on screen immediately and they can click sooner.
  Fixed, with a unit test that fails against the old code, so the push gate
  catches it without needing a browser. **The first fix was itself wrong**:
  setting the flag synchronously cured the race but broke under React Strict
  Mode, whose initial-mount replay then read as a navigation. Keyed on the
  pathname instead — the replay carries the same one, a real navigation does
  not. Caught in review, not by the suite.
- **One of the nine journeys could not fail, and review caught that too.** J8
  asserted only the finished state of the entrance animation, which is exactly
  what a page with no animation has. It now samples the heading's opacity at
  `larah:page-ready` — parked at `"0"` with motion, `"1"` under `reduce`. Worth
  recording plainly: this feature exists to stop tests passing while the thing
  they name is broken, and one of its own tests did that for a whole day.
- **Two silent-pass traps were hit while building this and are now designed
  out.** `test.use({ reducedMotion })` at file scope applies to a whole file, so
  the reduced-motion half would have run with motion on while the report still
  claimed two variants — the `underBothMotionPreferences` helper places it
  inside the describe by construction. And `reuseExistingServer` pointed the
  browser at another worktree's dev server for a whole run, passing six
  journeys against code that was not under change — hence `E2E_FRESH_BUILD` and
  `PORT`.
