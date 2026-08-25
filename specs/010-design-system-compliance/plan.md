# Implementation Plan: Design System Compliance

**Branch**: `010-design-system-compliance` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-design-system-compliance/spec.md`

## Summary

Make the codebase obey constitution Principle VII. Extend `src/styles/` with the token families it is missing — fluid type and spacing ramps, translucent overlays, and the lightbox's dark surface — then replace every literal that appears twice or more with the matching token. Extract the animation setup that four page-level components each restate into one shared hook. Add a test that fails when the TypeScript breakpoint mirror drifts from the stylesheet, and a repo-wide audit script that reports remaining drift. Every substitution is value-for-value identical, so nothing renders differently.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js 16.2.9 App Router, React 19.2.4, Sass

**Primary Dependencies**: none added. Every part of this feature uses what the stack already has — CSS custom properties, Sass mixins, and the Vitest suite from feature 009.

**Storage**: N/A — no runtime data

**Testing**: the existing Vitest suite gains one mirror test. Visual verification is manual (research.md §9); no visual-regression tooling is adopted here.

**Target Platform**: the browser, at every viewport width the app supports

**Project Type**: web application, single Next.js project

**Performance Goals**: unchanged. Custom properties resolve at paint like the literals they replace; token count has no measurable cost at this scale.

**Constraints**: FR-010 dominates — visible output MUST be identical before and after. That single constraint dictates the substitution rule in contracts/token-naming.md and rules out every tempting "while I'm here" cleanup: no rounding near-identical alphas together, no collapsing near-identical `clamp()` ramps, no normalising onto the nearest existing step.

**Scale/Scope**: 24 component stylesheets (~4,400 lines). Mandatory work is the measured duplicate set — 10 colour values across 28 uses, 5 type ramps across 12 uses, 1 repeated media query, 1 repeated animation setup across 4 files. Single-use literals are documented rather than eliminated (research.md §2).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                                     | Check                                                                                                                                                                                                                                                    | Result  |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I. Sanity Is the Sole Source of Content                       | No content or copy touched. Stylesheets and one hook only                                                                                                                                                                                                | ✅ Pass |
| II. Accessibility Is Non-Negotiable                           | Improves it slightly: the repeated `forced-colors` query becomes a named mixin beside the other accessibility mixins, making it discoverable rather than copy-pasted. No a11y rule relaxed, no markup semantics changed                                  | ✅ Pass |
| III. Performance and Image Delivery Are Deliberately Budgeted | `next.config.ts` untouched                                                                                                                                                                                                                               | N/A     |
| IV. Design Fidelity Through Shared Tokens                     | Directly served. IV governs the TypeScript constants motion code reads; this feature adds the test that proves those constants still match the stylesheet they mirror — the guarantee IV assumed but never verified                                      | ✅ Pass |
| V. Critical User Flows Require Test Coverage                  | No behaviour change to a critical flow. The hook extraction touches four page-level components, all async-Server-Component-adjacent Client Components; the existing suite plus `next build` cover the refactor, and Scenario 6 verifies rendering by eye | ✅ Pass |
| VI. Stay Current With This Next.js Version                    | No Next.js API used. Sass and CSS custom properties only                                                                                                                                                                                                 | N/A     |
| VII. One Design System, One Place For Shared UI               | This feature _is_ the principle's enforcement. The shared hook lands in `src/components/ui/`; every new token lands in `src/styles/`; the mirror rule VII states gains a test                                                                            | ✅ Pass |
| Technology Constraints (new deps)                             | None added. The audit script is shell over the existing tree; the mirror test uses Vitest, already present                                                                                                                                               | ✅ Pass |

No unjustified violations — the Complexity Tracking table below is empty by design.

**One tension worth naming**: Principle VII says a raw hex or bare `font-size` "is a violation, not a shortcut", which reads as zero-tolerance. This feature takes it at its word — zero literals, all three categories, no use-count threshold and no comment that excuses one (spec SC-001–SC-003). Two earlier drafts softened it, first to the two-or-more rule and then to strictness for colour alone, on the grounds that ~84 single-use fluid ramps would make the design system a lookup table. That objection was real and is answered structurally rather than by exception: the ramps get **semantic-tier** names describing the element they serve, so each is a decision with a home rather than a number in a table (research.md §2). The cost is a large token file — 156 new definitions over the 19 that exist today — and that cost was accepted knowingly. If it proves unworkable in practice, soften it by amendment rather than by informal drift.

_Post-Phase 1 re-check_: the design artifacts add no dependency and no new principle exposure. The `--overlay-*` and `--surface-dark-*` families expand what the token layer can express, which is the direction VII points. Gate still passes.

## Project Structure

### Documentation (this feature)

```text
specs/010-design-system-compliance/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — the measured baseline and the decisions
├── data-model.md        # Phase 1 — token families and artifact shapes
├── quickstart.md        # Phase 1 — six validation scenarios
├── contracts/
│   └── token-naming.md  # Phase 1 — naming, substitution rule, check semantics
└── tasks.md             # Phase 2 — NOT created by /speckit-plan
```

### Source Code (repository root)

```text
src/styles/
├── _tokens.scss          # + fluid type/space, overlay, dark-surface families
└── _mixins.scss          # + forced-colors mixin

src/components/ui/
└── usePageIntro/         # new — owns registerPlugin + playOnPageReady

src/constants/
└── breakpoints.test.ts   # new — fails when the mirror drifts

src/**/*.module.scss      # 24 files — literals replaced with tokens

scripts/
└── audit-design-system.sh  # new — reports remaining drift, not hook-wired

package.json              # + audit:design-system script
```

**Structure Decision**: tokens stay in one `_tokens.scss` with commented family blocks rather than splitting into per-family files. At ~60 tokens the single file is still readable end to end, and splitting it would mean four `@use` lines in every consumer for no gain. Revisit if the file passes roughly 150 tokens.

## Complexity Tracking

_No entries — no Constitution Check violations require justification._
