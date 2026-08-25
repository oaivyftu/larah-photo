---

description: "Task list for Testing & Git Quality Gates"
---

# Tasks: Testing & Git Quality Gates

**Input**: Design documents from `/specs/009-testing-quality-gates/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/npm-scripts.md, quickstart.md

**Tests**: This feature *is* the test infrastructure, so test files are first-class deliverables (US1), not optional add-ons. There is no "write a failing test first" TDD layer on top of them — the suite itself is the product.

**Organization**: Tasks are grouped by user story so each can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task

## Path Conventions

Single Next.js project. Tests are **colocated** next to the module under test (`*.test.ts` / `*.test.tsx`), not in a top-level `tests/` tree — per plan.md Structure Decision and the Next.js Vitest guide. Hook scripts live in `.husky/` at the repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the dev-only dependency set. No runtime dependency is added (constitution Technology Constraints).

- [ ] T001 Install Vitest runner dependencies as devDependencies in `package.json`: `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom` (run `npm install -D`; commits `package.json` + `package-lock.json`)
- [ ] T002 [P] Install formatting dependencies as devDependencies in `package.json`: `prettier`, `eslint-config-prettier`
- [ ] T003 [P] Install Git-hook dependencies as devDependencies in `package.json`: `husky`, `lint-staged`
- [ ] T004 Verify `tsconfig.typecheck.json` at repo root still gates correctly: `npx tsc --noEmit -p tsconfig.typecheck.json` exits 0 on a clean tree, and exits non-zero when a deliberate type error is injected into `src/utils/formatWorkCategory.ts` (revert after). File already exists — this task confirms it, does not create it (research.md §8)

**Checkpoint**: All tooling installed; nothing wired up yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Test runner + formatter config that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — US1 cannot run a test without a Vitest config, and US2/US3 hooks invoke scripts defined here.

- [ ] T005 Create `vitest.config.mts` at repo root: `@vitejs/plugin-react` + `vite-tsconfig-paths` plugins, `test.environment: "jsdom"`, `test.setupFiles: ["./vitest.setup.ts"]`, and `test.globals: true`. Follow `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` for this pinned Next.js version rather than memorized config (constitution Principle VI)
- [ ] T006 Create `vitest.setup.ts` at repo root importing `@testing-library/jest-dom/vitest` so DOM matchers are available in every test file
- [ ] T007 [P] Create `.prettierrc` at repo root matching the existing code style observed across `src/` — double quotes, semicolons, trailing commas (research.md §7)
- [ ] T008 [P] Create `.prettierignore` at repo root excluding `.next/`, `node_modules/`, `package-lock.json`, `.claude/`, and `public/` build artifacts
- [ ] T009 Append `eslint-config-prettier` as the last entry in the `defineConfig([...])` array in `eslint.config.mjs`, so it disables ESLint formatting rules that conflict with Prettier. It MUST come after `nextVitals`/`nextTs`/the jsx-a11y rules block, and MUST NOT disable any jsx-a11y rule (constitution Principle II)
- [ ] T010 Add scripts to `package.json` exactly per `contracts/npm-scripts.md`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"typecheck": "tsc --noEmit -p tsconfig.typecheck.json"`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`. Leave the existing `"lint": "eslint"` unchanged
- [ ] T011 Verify the runner boots: `npm test` exits 0 (Vitest reporting "no tests found" is an acceptable pass at this checkpoint), and `npm run typecheck` exits 0

**Checkpoint**: Runner and formatter work standalone. User stories can now begin.

---

## Phase 3: User Story 1 - Verify logic with an automated test suite (Priority: P1) 🎯 MVP

**Goal**: A real unit + mock test suite exists and passes, so every gate in US2/US3 has something meaningful to run.

**Independent Test**: From a clean checkout, `npm test` runs both isolated-logic tests and CMS-dependent tests (with the Sanity client mocked, no real network call) and reports pass/fail per test.

**Scope note**: A representative slice, not exhaustive backfill (plan.md Scale/Scope). Async Server Components (`src/app/(site)/**/page.tsx`) are deliberately excluded — Vitest cannot test them (research.md §2).

- [ ] T012 [P] [US1] Write unit tests in `src/utils/formatWorkCategory.test.ts` covering both exports: `normalizeWorkCategory` (trims, lowercases, collapses whitespace to hyphens) and `formatWorkCategory` (title-cases each hyphen-separated word). Include multi-word and already-hyphenated inputs
- [ ] T013 [P] [US1] Write unit tests in `src/utils/structuredData.test.ts` for at least two pure builders (e.g. `buildBreadcrumbSchema`, `buildProjectSchema`) asserting the emitted JSON-LD graph shape and that `businessId`/`websiteId` are referenced correctly. No mocking needed — these are pure functions over passed-in data
- [ ] T014 [US1] Write a component test in `src/components/work/WorkFilters/WorkFilters.test.tsx` using `@testing-library/react`: render with a `filters` array, assert each filter label appears, assert the `activeFilter` one is marked active, and assert `onFilterChange` fires with the right value on click. Also assert the accessible group name is present (guards the a11y fix documented in the component's own comment)
- [ ] T015 [US1] Write mock tests in `src/sanity/fetchers.test.ts`: `vi.mock("@/sanity/client")` to stub `sanityClient.fetch`, then cover (a) a success path — e.g. `getWorkProjectSlugs()` returns mapped slugs from fixture data; (b) the validation failure path — a fetcher throws `Sanity field "..." is required.` when a required field is missing (`requireString`/`requireValue` behavior, `src/sanity/fetchers.ts:153`); (c) the wrapper failure path — a rejected client call surfaces as `Unable to load ... from Sanity.` (`src/sanity/fetchers.ts:144`). This directly exercises constitution Principle I (errors surface, no silent fallback)
- [ ] T016 [US1] Assert no real network happens: in `src/sanity/fetchers.test.ts`, confirm the mocked `sanityClient.fetch` is the only call path (e.g. `expect(fetchSpy).toHaveBeenCalledTimes(n)`) and that `globalThis.fetch` is never invoked during the run — satisfies FR-002 and data-model.md's Mock Test validation rule
- [ ] T017 [US1] Run quickstart.md Scenario 1: `npm test` passes with both categories present, exit code 0

**Checkpoint**: US1 is independently deliverable — the project has a working test suite even if no hook is ever wired up.

---

## Phase 4: User Story 2 - Catch problems before they're committed (Priority: P2)

**Goal**: `git commit` auto-formats staged files and blocks on lint, type, or test failure.

**Independent Test**: Introduce a lint violation, a type error, or a failing test; attempt to commit; confirm it is blocked with the failing step named. Fix it; confirm the commit succeeds.

**Depends on**: US1 (the hook's `test` step needs tests to run).

- [ ] T018 [US2] Resolve the open decision recorded in `contracts/npm-scripts.md` ("do warnings block?"): choose either plain `eslint` or `--max-warnings=0` for the hook path, and record the choice plus its reason as a comment in `.husky/pre-commit`. If `--max-warnings=0` is chosen, first remove the dead `InquiryForm` import in `src/app/(site)/contact/ContactExperience.tsx` — otherwise the repo's one existing warning blocks every commit from day one
- [ ] T019 [US2] Add the `lint-staged` key to `package.json` per data-model.md: `"*.{ts,tsx,js,jsx}": "eslint --fix"` and `"*.{ts,tsx,js,jsx,scss,json,md}": "prettier --write"`. lint-staged re-stages what it rewrites, which is what makes formatting a correction rather than a gate (FR-003a, research.md §9)
- [ ] T020 [US2] Add `"prepare": "husky"` to `package.json` scripts and run `npx husky init` to create the `.husky/` directory, so hooks install automatically on `npm install` with no manual step (FR-006)
- [ ] T021 [US2] Write `.husky/pre-commit` running three separately-invoked, individually-labelled steps in order: `npx lint-staged` → `npm run typecheck` → `npm test`. Each step must echo its own name before running so a failure identifies itself (FR-005/SC-004). It MUST NOT invoke `next build` or any E2E command (FR-007), and MUST NOT run `prettier --check` (FR-003a)
- [ ] T022 [US2] Validate quickstart.md Scenario 2 — one failure at a time (an ESLint error that `--fix` cannot repair; a type error; a broken expectation in `src/utils/formatWorkCategory.test.ts`), confirming each blocks the commit and names its step. Revert each and confirm a clean commit succeeds
- [ ] T023 [US2] Validate quickstart.md Scenario 2a — append badly-formatted-but-valid code to `src/utils/formatWorkCategory.ts`, commit, and confirm the commit **succeeds** and `git diff HEAD` is empty, proving Prettier's rewrite was re-staged into the commit rather than left behind (FR-003a, SC-001)
- [ ] T024 [US2] Validate quickstart.md Scenario 4 — from a fresh clone, `npm install` then `git commit --allow-empty` fires the hook with no separate `husky install` step (FR-006, SC-003)

**Checkpoint**: Commits are gated. US1 + US2 together are a shippable increment.

---

## Phase 5: User Story 3 - Catch problems before they're pushed (Priority: P3)

**Goal**: `git push` re-runs the commit-level checks and additionally verifies the production build.

**Independent Test**: Introduce a change that passes every pre-commit check but breaks `next build`; attempt to push; confirm it is blocked with the build step named as the failure.

**Depends on**: US2 (pre-push reuses the same check set).

- [ ] T025 [US3] Write `.husky/pre-push` running the full pre-commit check set plus a final `npm run build` step, each separately invoked and labelled. Per the spec's Edge Cases, pre-push is **not** a lighter version of pre-commit — it runs everything, then builds. It MUST NOT invoke any E2E command (FR-007)
- [ ] T026 [US3] Validate quickstart.md Scenario 3 — introduce a change that lints, type-checks and tests clean but fails `next build`, attempt a push, and confirm the push is blocked with the build step distinguishable from lint/type/test failures (FR-004, SC-002)
- [ ] T027 [US3] Validate quickstart.md Scenario 2b — run `rm -rf .next && npm run typecheck` and confirm exit 0 with no `.next/types/validator.ts` TS2307 errors, proving the type-check result is independent of build state whether `.next/` is absent, fresh, or stale (research.md §8)

**Checkpoint**: All three user stories functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T028 [P] Validate quickstart.md Scenario 5: `grep -r "playwright" .husky/` returns no matches, confirming E2E stays outside both hooks (FR-007, research.md §4)
- [ ] T029 [P] Document the new commands (`npm test`, `npm run typecheck`, `npm run format`) and the two hooks in `README.md`, including how to bypass with `--no-verify` and when that is legitimate (spec Edge Cases)
- [ ] T030 Run every quickstart.md scenario end-to-end on a scratch branch in one pass, confirming no scenario regressed while a later one was being built
- [ ] T031 Amend `.specify/memory/constitution.md` to **2.1.1 (PATCH)** now that the suite exists: delete Principle V's interim clause (the manual-test-plan fallback and its "not implemented yet" note), and change the Development Workflow "Tests" bullet plus the "Until the Git hooks are implemented..." paragraph to reference `.husky/pre-commit` and `.husky/pre-push` by name. Update the Sync Impact Report and the `**Last Amended**` date. This is the follow-up already tracked in `plan.md` Constitution Check and `research.md` §1 — do NOT skip it

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on US1 — the pre-commit hook's `test` step is meaningless without a suite
- **US3 (Phase 5)**: Depends on US2 — pre-push reuses the same check set
- **Polish (Phase 6)**: Depends on all three stories; T031 specifically requires US1 complete (`npm test` must exist and pass)

Unlike a typical feature, these three stories are **sequentially dependent rather than parallel** — each gate builds on the previous one's checks. Parallelism here lives inside phases, not across stories.

### Within Each User Story

- US1: all four test files are independent of each other — T012/T013 fully parallel, T014/T015 parallel once Phase 2 lands
- US2: T018 → T019/T020 → T021 → validation (T022–T024)
- US3: T025 → T026/T027

### Parallel Opportunities

- T002 and T003 (separate dependency groups, both touch `package.json` — run sequentially if npm lockfile contention is a concern)
- T007 and T008 (different files)
- T012 and T013 (different test files, no shared fixtures)
- T028 and T029 (different files)

---

## Parallel Example: User Story 1

```bash
# Launch the two pure-function test files together:
Task: "Write unit tests in src/utils/formatWorkCategory.test.ts"
Task: "Write unit tests in src/utils/structuredData.test.ts"

# Then the two heavier ones:
Task: "Write component test in src/components/work/WorkFilters/WorkFilters.test.tsx"
Task: "Write mock tests in src/sanity/fetchers.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm test` passes with real unit + mock coverage
5. At this point the project has a regression safety net for the first time — valuable even with zero hooks wired up

### Incremental Delivery

1. Setup + Foundational → runner works
2. US1 → suite exists and passes → **MVP**
3. US2 → commits gated
4. US3 → pushes gated
5. Polish → docs + the constitution PATCH that closes Principle V's interim clause

---

## Notes

- `tsconfig.typecheck.json` already exists in the tree — T004 verifies it rather than creating it
- `@testing-library/jest-dom` is included in T001 although plan.md's dependency list omits it; `vitest.setup.ts` is specified to register jest-dom matchers, which requires the package
- Every hook step must be separately invoked and labelled — a single opaque `&&` chain violates FR-005/SC-004
- Formatting corrects, never blocks (FR-003a) — do not add `prettier --check` to either hook
- Async Server Components stay out of scope; that gap is Playwright's, deliberately deferred (research.md §2, §4)
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
