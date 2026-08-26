# Implementation Plan: Typography and Motion Tokens

**Branch**: `011-typography-motion-tokens` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-typography-motion-tokens/spec.md`

## Summary

Extend feature 010's zero-literal rule to the four categories its check never inspected: line height, font weight, letter spacing, and motion. Add the scale families each one needs — three line-height steps beside the four that already exist, a `--tracking-*` family, a `--font-weight-*` family, `--duration-*` and `--ease-*` — then replace all 185 literals across 24 stylesheets. Extend the audit to cover them, and give it a written coverage declaration so a category cannot fall outside the rule unnoticed again, which is how these four drifted. Every value is byte-identical to the literal it replaces, so nothing renders differently and nothing moves at a different speed.

## Technical Context

**Language/Version**: TypeScript (strict), Next.js 16.2.9 App Router, React 19.2.4, Sass

**Primary Dependencies**: none added. A stylesheet linter was considered for this feature specifically and rejected (research.md §7).

**Storage**: N/A — no runtime data

**Testing**: the existing Vitest suite gains one test, asserting the audit's coverage declaration matches what it inspects. Rendering equivalence is verified by `npm run audit:css-diff`, built in feature 010.

**Target Platform**: the browser, at every viewport width the app supports

**Project Type**: web application, single Next.js project

**Performance Goals**: unchanged. Custom properties resolve at paint like the literals they replace.

**Constraints**: FR-005 dominates, as FR-010 did in feature 010 — output must be identical, and every transition must run for the same length of time on the same curve. That rules out the tempting cleanup in every category: no rounding `1.15` onto `1.18`, no collapsing `140`/`150`/`160`ms, no promoting `650` to `700`.

**Scale/Scope**: 24 component stylesheets. 185 literals across 57 distinct values: line height 48/17, font weight 53/6, letter spacing 17/8, duration 53/21, easing 14/5. Unlike feature 010, a small recurring set covers 71–98% of each category, so most of this is scale-tier work.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                                     | Check                                                                                                                                      | Result  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| I. Sanity Is the Sole Source of Content                       | No content or copy touched. Stylesheets and one script                                                                                     | ✅ Pass |
| II. Accessibility Is Non-Negotiable                           | Untouched. Durations are preserved byte for byte, so the `reduced-motion` guards behave exactly as before                                  | ✅ Pass |
| III. Performance and Image Delivery Are Deliberately Budgeted | `next.config.ts` untouched                                                                                                                 | N/A     |
| IV. Design Fidelity Through Shared Tokens                     | Directly served, and this is the principle the feature exists for                                                                          | ✅ Pass |
| V. Critical User Flows Require Test Coverage                  | No behaviour change to a critical flow. The one new test guards the coverage declaration, which is the mechanism protecting the whole rule | ✅ Pass |
| VI. Stay Current With This Next.js Version                    | No Next.js API used                                                                                                                        | N/A     |
| VII. One Design System, One Place For Shared UI               | This feature is the principle's enforcement, extended to the properties 010 left out. Every new token lands in `src/styles/`               | ✅ Pass |
| Technology Constraints (new deps)                             | None added. The rejection of `stylelint` is reasoned in research.md §7 rather than assumed                                                 | ✅ Pass |

No unjustified violations — the Complexity Tracking table is empty by design.

**One tension worth naming**: feature 010 accepted a large token file as the price of zero literals, on the argument that a semantic name makes a one-off value a decision rather than a dictionary entry. That argument has a limit, and this feature runs closer to it than 010 did. Twenty-one duration tokens for twenty-one durations is defensible only because naming them is what makes the case for consolidating them (research.md §6); if that consolidation never happens, the tokens will have moved the problem rather than solved it. The mitigation is that §6 is written with the evidence and `npm run audit:css-diff` makes each proposed merge provable rather than arguable — the same tooling that showed two of feature 010's "distinct" colours were already identical in shipped output.

_Post-Phase 1 re-check_: the design artifacts add no dependency and no new principle exposure. The coverage declaration strengthens VII by making its enforcement legible. Gate still passes.

## Project Structure

### Documentation (this feature)

```text
specs/011-typography-motion-tokens/
├── plan.md              # This file
├── research.md          # Phase 0 — why these drifted, and how each family is named
├── data-model.md        # Phase 1 — the token families and the coverage declaration
├── quickstart.md        # Phase 1 — validation scenarios
├── contracts/
│   └── token-naming.md  # Phase 1 — naming rules and check semantics for these categories
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/styles/
├── _tokens.scss         # all new families land here
└── _typography.scss     # the only current consumer of the line-height tokens

src/components/          # 20 stylesheets carrying literals
src/app/(site)/          # 4 route stylesheets carrying literals

scripts/
├── audit-design-system.mjs   # extended: four categories + coverage declaration
└── compare-built-css.mjs     # unchanged; verifies each pass

src/styles/
└── coverage.test.ts     # new: asserts the declaration matches what is inspected
```

**Structure Decision**: no new directories. This feature adds definitions to one file, edits stylesheets in place, extends one script, and adds one test. The shape is deliberately identical to feature 010 so the two read as one line of work.

## Complexity Tracking

> Empty by design — the Constitution Check records no violations.
