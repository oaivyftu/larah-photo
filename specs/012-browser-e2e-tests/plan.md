# Implementation Plan: Browser End-to-End Tests

**Branch**: `012-browser-e2e-tests` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-browser-e2e-tests/spec.md`

## Summary

Adopt Playwright Test — already named by the constitution, already documented by
this Next.js version — and write nine visitor journeys covering gallery
navigation, page-to-page navigation, and the reduced-motion variant of each.
Consolidate the page-heading reveal into `usePageIntro` first, because four
byte-identical copies mean a test on one route reports success while three
drift. Write the run location down as a deliverable: on demand, by a person, via
`npm run test:e2e`, and in neither Git hook — the same position features 009 and
the constitution already took, now stated somewhere a reviewer can check it.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js 16.2.9 App Router, React 19.2.4

**Primary Dependencies**: one added — `@playwright/test` (1.62.1) as a dev
dependency, plus its Chromium binary. This is the feature's only new dependency
and the justification the constitution requires is in research.md §1: the
existing runner is jsdom, which has no layout engine, no compositor and no
scrolling, so the 169 uncovered browser-coupled statements are unreachable there
by construction. Vitest 4's browser mode was evaluated as the
stack-already-solves-it candidate and rejected on structure, not preference
(§2) — it needs Playwright as a provider anyway, and its unit is a mounted
component rather than a served route, which puts the App Router navigation, the
intercepting `@modal` route and the page-transition curtain out of its reach.

**Storage**: N/A — no runtime data. The suite reads content from Sanity through
the app, and hardcodes none of it.

**Testing**: this feature _is_ testing. Vitest keeps the unit and integration
suite unchanged, in `src/**/*.test.{ts,tsx}`; Playwright owns `e2e/*.spec.ts`.
The two runners cannot collide — `vitest.config.mts` includes only `src/`.

**Target Platform**: Chromium, desktop viewport, against a production build
served by `next start`. One engine, deliberately (research.md §3); the run cost
falls on a developer's machine, and cross-engine compatibility is a different
goal with a different trigger.

**Project Type**: web application, single Next.js project

**Performance Goals**: not the suite's subject. Its own budget is the thing that
matters: the run must stay short enough that a person actually runs it, which is
the whole argument for one browser and nine journeys rather than three browsers
and thirty.

**Constraints**: FR-004 and SC-005 dominate. Nothing may make a commit or a
routine push slower, which rules out the tempting shortcut of "just add it to
pre-push and see". FR-009 rules out the other tempting shortcut: no screenshot
comparison, no transform values, no bounding boxes. And FR-003 rules out the
shortcut that would make all of this easy — asserting that a function was
called.

**Scale/Scope**: nine journeys × two motion preferences = 18 tests. One new dev
dependency, one new top-level directory (`e2e/`), two new npm scripts, one
config, one global setup. In `src/`: one hook gains the heading reveal, four
route components lose their copy of it, two components gain an identity
attribute. Documentation: `README.md`, `AGENTS.md`, and a PATCH amendment to the
constitution.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                                     | Check                                                                                                                                                                                                                         | Result  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I. Sanity Is the Sole Source of Content                       | No content added or hardcoded. Journeys discover slugs, titles and counts at run time precisely because content is editor-owned (research.md §5)                                                                              | ✅ Pass |
| II. Accessibility Is Non-Negotiable                           | Strengthened. US3 is an accessibility story, J6 asserts focus lands in page content, and most of the test surface is the ARIA markup this principle already requires                                                          | ✅ Pass |
| III. Performance and Image Delivery Are Deliberately Budgeted | `next.config.ts` untouched                                                                                                                                                                                                    | N/A     |
| IV. Design Fidelity Through Shared Tokens                     | Directly served by the §10 consolidation: seven motion values duplicated across four components become one definition                                                                                                         | ✅ Pass |
| V. Critical User Flows Require Test Coverage                  | The feature's entire subject. Work gallery navigation gets the end-to-end coverage this principle says it lacks. Needs a PATCH amendment — see below                                                                          | ✅ Pass |
| VI. Stay Current With This Next.js Version                    | `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md` read and followed, as `vitest.md` was for `vitest.config.mts`. Its `index.md` independently recommends E2E over unit testing for async Server Components | ✅ Pass |
| VII. One Design System, One Place For Shared UI               | No UI added. Two identity `data-*` attributes are added to existing components, matching the convention already in the tree                                                                                                   | ✅ Pass |
| Technology Constraints (new deps)                             | One dependency, justified in research.md §1, with the strongest alternative evaluated and rejected on its merits in §2                                                                                                        | ✅ Pass |

No unjustified violations — the Complexity Tracking table is empty by design.

**Two things this gate obliges the feature to do, not just to claim:**

1. **Principle V needs a PATCH amendment.** It currently says work gallery
   navigation "is covered only at the component level (`WorkFilters.test.tsx`)".
   That stopped being true when `WorkGalleryClient.test.tsx` landed, and it
   stops being true a second way when this feature ships. It also says the
   gallery flow "remains uncovered until an E2E tool is adopted" — this is the
   adoption. The spec's Assumptions already flag the first half; the second half
   is this feature's own doing, so both go in one amendment.
2. **The new dependency's justification is a deliverable, not a paragraph in a
   PR.** FR-008 requires it written down. research.md §1 and §2 are that
   record, and the Constitution Check above points at them rather than
   restating them.

**One tension worth naming**, in the spirit of the 011 plan's: this feature adds
a gate that nothing enforces. Every other check in this project runs whether the
author remembers it or not; this one runs when someone chooses to. That is the
right trade while there is no CI — research.md §7 and contracts/run-location.md
both argue it — but it should be named rather than smoothed over. The mitigation
is the one available: the run location is written in three places, the trigger
conditions are listed explicitly, and the revisit condition is on the record so
the day CI arrives nobody has to rediscover why.

_Post-Phase 1 re-check_: the design artifacts add no further dependency. The
test-surface contract slightly strengthens II by making the accessibility markup
load-bearing — a change that breaks the accessible name now breaks a test. The
two identity attributes are names, not behaviour. Gate still passes.

## Project Structure

### Documentation (this feature)

```text
specs/012-browser-e2e-tests/
├── plan.md                    # This file
├── research.md                # Phase 0 — the tool, the alternatives, the gaps left open
├── data-model.md              # Phase 1 — journeys, variants, observables, run location
├── quickstart.md              # Phase 1 — how to run it, and how to prove it works
├── contracts/
│   ├── run-location.md        # Phase 1 — FR-004's written statement, in full
│   └── test-surface.md        # Phase 1 — the DOM handles the suite depends on
├── checklists/
│   └── requirements.md        # Spec quality checklist
└── tasks.md                   # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
e2e/                           # new — Playwright's testDir
├── journeys/                  # journey bodies, imported by both motion variants
│   ├── gallery.ts             # J1–J4
│   ├── navigation.ts          # J5–J7
│   └── motion.ts              # J8, J9
├── support/
│   ├── content.ts             # discovers a project from the work index; no slugs
│   └── observables.ts         # the assertions of contracts/test-surface.md
├── gallery.spec.ts            # J1–J4, both variants
├── navigation.spec.ts         # J5–J7, both variants
├── motion.spec.ts             # J8, J9, both variants
└── global-setup.ts            # fails fast and by name when content is missing

playwright.config.ts           # new — Chromium, webServer, reduced-motion projects

src/utils/usePageIntro.ts      # gains the page-heading reveal
src/app/(site)/about/AboutExperience.tsx       # loses its copy
src/app/(site)/service/ServiceExperience.tsx   # loses its copy
src/app/(site)/contact/ContactExperience.tsx   # loses its copy
src/app/(site)/work/WorkGalleryClient.tsx      # loses its copy
src/components/work/WorkProjectGallery/WorkProjectGalleryClient.tsx  # + data-gallery-controls
src/components/ui/GlassPointer/GlassPointer.tsx                      # + data-glass-pointer

package.json                   # + @playwright/test, + test:e2e and postinstall scripts
eslint.config.mjs              # + playwright-report/, test-results/ ignores
.gitignore                     # + the same two directories
README.md                      # quality-gates table and the hook paragraph
AGENTS.md                      # §5, and the spec table's row for 012
.specify/memory/constitution.md  # Principle V, PATCH
```

**Structure Decision**: `e2e/` sits at the repository root rather than under
`src/`. Two reasons, both mechanical: `vitest.config.mts` includes only
`src/**/*.test.{ts,tsx}`, so a root directory is invisible to the unit runner
without any config change on either side; and the two runners both define a
global named `test` with different semantics, so keeping them in separate trees
with different filename suffixes (`.spec.ts` against `.test.ts`) makes which
runner owns a file readable from the path. `tsconfig.typecheck.json` includes
`**/*.ts` and ESLint ignores nothing there, so the new directory is type-checked
and linted by the existing hooks without being executed by them — which is
exactly the split FR-004 asks for.

## Scope boundary worth stating up front

FR-002 names three things the suite must cover, and this plan covers those three
and stops. Two areas are **not** covered — the home page's scroll choreography
(48 statements) and the project album layout's measurement code (6) — because no
user story in the spec describes a journey through either, and adding one in the
plan would be inventing a requirement in the wrong document.

In numbers: 115 of the 169 browser-coupled uncovered statements are in scope
(gallery 96, pointer follower 15, the four route intro callbacks 4), and 54 are
not. This is stated here, in the Summary's neighbourhood rather than buried in
research.md §11, because the feature's headline case is "169 statements are
unreachable without a browser" and a reader deserves to know up front that this
delivers roughly two thirds of that. The spec's Assumptions now say the same
thing, so the two documents agree rather than the plan quietly narrowing what the
spec promised. The machinery installed here — config, server, variant pattern,
run-location statement — is what a follow-up feature would build on, so the
remainder is a spec-and-tasks addition rather than new infrastructure.

## Complexity Tracking

> Empty by design — the Constitution Check records no violations. The one new
> dependency is justified under Technology Constraints rather than tracked as a
> violation, with the rejected alternative reasoned in research.md §2 rather
> than asserted.
