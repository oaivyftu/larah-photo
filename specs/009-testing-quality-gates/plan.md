# Implementation Plan: Testing & Git Quality Gates

**Branch**: `009-testing-quality-gates` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-testing-quality-gates/spec.md`

## Summary

Add an automated Vitest-based unit/mock test suite (covering pure utilities, Client Components, and CMS-dependent code with the Sanity client mocked), then wire Husky + lint-staged Git hooks so `git commit` blocks on lint/format/type-check/test failures and `git push` additionally blocks on a failed production build. Playwright/E2E testing is deliberately kept out of both hooks and left as a manual/CI-only command, per research.md §4.

## Technical Context

**Language/Version**: TypeScript (strict mode), Next.js 16.2.9 App Router, React 19.2.4

**Primary Dependencies (new, dev-only)**: `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `prettier`, `eslint-config-prettier`, `husky`, `lint-staged`

**Storage**: N/A — no runtime data; all artifacts are dev-tooling config

**Testing**: Vitest (unit + mock) run via `vitest run`; React Testing Library for Client Component rendering; module-boundary mocking (`vi.mock`) for `src/sanity/client` — no MSW/network-layer mocking added (research.md §3)

**Target Platform**: Local developer machines (Git hooks); no CI pipeline exists in this repo today (research.md §5, confirmed via `.github` absence)

**Project Type**: Web application (Next.js single project — no separate frontend/backend split)

**Performance Goals**: Pre-commit hook should complete in the time it takes to lint/type-check/test the project locally (no numeric SLA specified by the spec); pre-push adds one `next build` on top. No goal is set for `test:e2e`, which is explicitly out of hook scope.

**Constraints**: Async Server Component pages (every `src/app/(site)/**/page.tsx`) are not unit-testable with Vitest (research.md §2) — out of scope for this feature's unit/mock coverage, left to manual/future-E2E coverage. No new runtime (non-dev) dependency introduced, per constitution Technology Constraints. Type-checking runs against `tsconfig.typecheck.json`, not the base `tsconfig.json`, because the base config includes `.next/types/**/*.ts` and a stale `.next/` makes `tsc` fail on generated build output rather than on source (research.md §8 — verified failing before this feature was started). Formatting corrects rather than blocks (research.md §9, spec FR-003a).

**Scale/Scope**: Test-infrastructure + 2 Git hooks; initial test coverage seeded on a representative slice (one utility, one Client Component, one fetcher) rather than exhaustive coverage of every existing component — full backfill is a separate, larger effort tracked via `/speckit-tasks`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                                     | Check                                                                                                                                                                                                                                                                                                                                                                                                                                  | Result                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| I. Sanity Is the Sole Source of Content                       | Feature adds no production content/UI; mock tests stub the Sanity client only inside test files, never in shipped code                                                                                                                                                                                                                                                                                                                 | ✅ Pass                                                             |
| II. Accessibility Is Non-Negotiable                           | No new UI. Existing `jsx-a11y` ESLint rules continue to run as part of the pre-commit/pre-push `lint`/lint-staged step, so this feature reinforces rather than weakens the gate                                                                                                                                                                                                                                                        | ✅ Pass                                                             |
| III. Performance and Image Delivery Are Deliberately Budgeted | Not touched — no `next.config.ts` image changes                                                                                                                                                                                                                                                                                                                                                                                        | N/A                                                                 |
| IV. Design Fidelity Through Shared Tokens                     | Not touched — no visual/motion values introduced                                                                                                                                                                                                                                                                                                                                                                                       | N/A                                                                 |
| V. Critical User Flows Require Test Coverage                  | This feature is the framework adoption the principle calls for. Constitution v2.1.0 (2026-08-24) already names Vitest as the selected framework ahead of implementation; its interim clause keeps the manual-test-plan fallback alive until `npm test` exists. **Follow-up required**: once this feature ships, amend again (PATCH) to delete that interim clause and point the Development Workflow gates at the hook scripts by name | ⚠️ Pass with required follow-up (tracked, not a blocking violation) |
| VI. Stay Current With This Next.js Version                    | Vitest choice and its async-Server-Component limitation were verified against `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` for this pinned version, not memorized conventions                                                                                                                                                                                                                                      | ✅ Pass                                                             |
| Technology Constraints (new deps)                             | New dev dependencies (`vitest`, Testing Library, `prettier`, `husky`, `lint-staged`, etc.) solve a problem (test framework, formatting, hook management) not already solved by the existing stack; justified in research.md §1, §5, §7. No new `any`, strict mode untouched                                                                                                                                                            | ✅ Pass                                                             |

No unjustified violations — Complexity Tracking table below is empty by design.

_Post-Phase 1 re-check_: Design artifacts (data-model.md, contracts/npm-scripts.md, quickstart.md) introduce no additional dependencies or principle exposure beyond what's listed above. Gate still passes.

## Project Structure

### Documentation (this feature)

```text
specs/009-testing-quality-gates/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── npm-scripts.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.husky/
├── pre-commit            # lint-staged → typecheck
└── pre-push              # same as pre-commit, plus `vitest run` and `next build`

src/
├── **/*.test.ts           # unit tests, colocated next to the module under test
├── **/*.test.tsx           # component unit/mock tests, colocated
├── sanity/
│   └── fetchers.test.ts   # mock tests: Sanity client mocked via vi.mock
└── utils/
    └── formatWorkCategory.test.ts  # representative unit test

vitest.config.mts          # Vitest + @vitejs/plugin-react + vite-tsconfig-paths, jsdom env
vitest.setup.ts            # Testing Library jest-dom matchers, global test setup
tsconfig.typecheck.json    # extends tsconfig.json, drops/excludes .next (research.md §8) — ALREADY ADDED
.prettierrc                # Prettier config (new)
package.json               # + test/typecheck/format scripts, lint-staged config, "prepare": "husky"
```

**Structure Decision**: Single Next.js project (no frontend/backend split — Option 1 from the template, adapted). Tests are colocated with the code they cover (`*.test.ts(x)` next to the source file) rather than a separate top-level `tests/` tree, matching the Next.js Vitest guide's convention and keeping mock setup close to what it mocks. Git hook scripts live in the standard Husky `.husky/` directory at the repo root.

## Complexity Tracking

_No entries — no Constitution Check violations require justification._
