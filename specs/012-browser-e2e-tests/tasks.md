---
description: "Task list for feature 012 — Browser End-to-End Tests"
---

# Tasks: Browser End-to-End Tests

**Input**: Design documents from `/specs/012-browser-e2e-tests/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/](./contracts/)

**Tests**: this feature's deliverable _is_ a test suite, so the usual "tests are
optional" clause reads oddly here. The distinction that matters: the nine
journeys are the product, and the small number of Vitest tests below (T017)
exist for the same reason as any other unit test — to cover a change to `src/`
that the push gate should catch.

**Organization**: grouped by user story, so each of the three can be finished,
run and judged on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel — different files, no dependency on incomplete work
- **[Story]**: which user story the task serves (US1, US2, US3)

## Path Conventions

Single Next.js project. `e2e/` and `playwright.config.ts` at the repository
root; application code in `src/`. See plan.md → Structure Decision for why the
suite is not under `src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: get a browser runner installed and wired so it cannot leak into the
commit and push gates.

- [x] T001 Add `@playwright/test` (^1.62.1) to `devDependencies` in `package.json`, and add `"postinstall": "playwright install chromium"` to `scripts` so `npm install` fetches the one browser binary the config uses. FR-006 says no manual setup beyond what the project already requires, and a documented "now also run this other command" is exactly the manual setup it forbids — `npm install` already installs the Git hooks via `prepare`, and this joins it. Record the tradeoff in a comment: every contributor pays a one-time ~150 MB download whether or not they run the suite, and `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` is the escape hatch for anyone who does not want it
- [x] T002 Create `playwright.config.ts` at the repository root: `testDir: "./e2e"`, one `chromium` project at a desktop viewport, `globalSetup: "./e2e/global-setup.ts"`, `webServer` running `npm run build && npm run start` with `baseURL: "http://localhost:3000"`, `reuseExistingServer: !process.env.E2E_FRESH_BUILD`, `forbidOnly: true`, and no screenshot or video capture (FR-009). Follow `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`, per constitution Principle VI, and record the deliberate departures from it in a header comment — one browser instead of three (research.md §3), and `E2E_FRESH_BUILD` in place of the guide's `!process.env.CI` (research.md §8). Two of these are guards rather than preferences: `forbidOnly: true` because the guide's default is `!!process.env.CI`, which with no CI means a forgotten `test.only` runs one test and reports green while SC-004 claims 18; and the `E2E_FRESH_BUILD` escape because a stale server left listening on 3000 would otherwise be silently reused (see T035)
- [x] T003 [P] Add `"test:e2e": "playwright test"` to `scripts` in `package.json`. One command, no arguments, and after T001 no setup step either (FR-006)
- [x] T004 [P] Add `/playwright-report/` and `/test-results/` to `.gitignore` under a `# browser end-to-end tests` heading
- [x] T005 [P] Add `"playwright-report/**"` and `"test-results/**"` to the `globalIgnores` array in `eslint.config.mjs`, with a comment saying why — they contain Playwright's own bundled report JavaScript, and without this the next `npm run lint` fails the push gate on code nobody wrote (research.md §13)

**Checkpoint**: `npm run test:e2e` runs and reports zero tests. `npm run lint`, `npm run typecheck` and `npm test` are all unaffected.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: two separate blockers. The suite needs its support layer before any
journey can be written; and FR-007 requires the duplicated heading reveal to be
reduced to one definition _before_ it is tested, or a passing test would be
reporting on one of four copies.

**⚠️ CRITICAL**: no user story work begins until this phase is complete.

### The suite's support layer

- [x] T006 Create `e2e/global-setup.ts`: assert `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set, then load the work index once and assert at least one `[data-work-card]` is present. On failure throw an error naming the missing variable and pointing at `.env.example`. Never a bare timeout (spec Edge Cases, research.md §9, FR-005)
- [x] T007 [P] Create `e2e/support/content.ts` exporting helpers that discover content at run time — open the work index, return the first project card, follow it to a project. No slug, title or photograph count appears in this file or any journey (Principle I, research.md §5). Export a helper that reads the current position from the gallery's `aria-live` region so journeys can assert movement without knowing the total
- [x] T008 [P] Create `e2e/support/observables.ts` implementing every row of the "How each state is read" table in [contracts/test-surface.md](./contracts/test-surface.md), one exported function per observable. Selectors use role and accessible name first, `data-*` identity attributes second, library-set global classes (`is-selected`, `flickity-enabled`) third. No CSS-module class names — they are hashed in a production build. No `page.waitForTimeout` anywhere in the file or the suite (research.md §12)

### One definition of the page heading reveal (FR-007, SC-008)

- [x] T009 Move the page-heading reveal into `src/utils/usePageIntro.ts`: the hook prepends the `[data-page-heading] > span` tween (`yPercent: 115`, `opacity: 0`, `rotate: 2`, `duration: 0.82`, `stagger: 0.07`, `ease: "power4.out"`) to the timeline before handing it to `buildIntro`, guarded on the scope actually containing a `[data-page-heading]` so a future page without one does not tween an empty selector. Record in the hook's doc comment why the seven values stay here rather than moving to `src/constants/` — after this change they have exactly one call site (research.md §10, Principle IV)
- [x] T010 [P] [depends on T009] Delete the duplicated heading `.from(...)` block from `src/app/(site)/about/AboutExperience.tsx`, keeping its own follow-on tween and its `-=0.42` offset
- [x] T011 [P] [depends on T009] Delete the same block from `src/app/(site)/service/ServiceExperience.tsx`, keeping its `-=0.4` offset
- [x] T012 [P] [depends on T009] Delete the same block from `src/app/(site)/contact/ContactExperience.tsx`, keeping its `-=0.42` offset
- [x] T013 [P] [depends on T009] Delete the same block from `src/app/(site)/work/WorkGalleryClient.tsx`, keeping its `-=0.38` offset
- [x] T014 Verify the consolidation: `grep -rn "yPercent: 115" src` returns exactly one hit, in `src/utils/usePageIntro.ts`. Update the "definitions after" column of the shared-behaviour ledger in [data-model.md](./data-model.md) if anything else surfaces

### Identity hooks the suite selects on

- [x] T015 [P] Add `data-gallery-controls` to the float-nav `<nav aria-label="Gallery controls">` in `src/components/work/WorkProjectGallery/WorkProjectGalleryClient.tsx`. A name, not a state mirror — the visible/receded distinction is still read from computed `opacity` ([contracts/test-surface.md](./contracts/test-surface.md))
- [x] T016 [P] Add `data-glass-pointer` to the pointer pill `<div>` in `src/components/ui/GlassPointer/GlassPointer.tsx`. It is `aria-hidden="true"` by design, so it has no accessible name to select by. Its `data-active` attribute already exists and is not changed
- [x] T017 Extend `src/utils/usePageIntro.test.tsx` to cover the hook's new responsibility: a scope containing `[data-page-heading]` gets the reveal, a scope without one does not tween an empty selector, and the reveal precedes whatever `buildIntro` adds. This is the one part of the feature that touches behaviour in `src/`, so it belongs in the suite the push gate runs

**Checkpoint**: `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` all pass. `npm run test:e2e` still reports zero tests but the global setup runs and fails informatively when `.env.local` is absent. The four route pages still animate identically — verify by eye once, since no automated check covers this until Phase 5.

---

## Phase 3: User Story 1 — The gallery is proven to work (Priority: P1) 🎯 MVP

**Goal**: a visitor can move through a project's photographs by control and by
keyboard, can dismiss a full-screen photograph without being thrown past the
project preview, and the controls recede and return with the pointer.

**Independent Test**: open a project, advance the gallery by control and by
arrow key, open a photograph full-screen inside the preview, dismiss it, and
confirm the preview is still there. Runnable as `npm run test:e2e -- gallery`
with nothing from US2 or US3 in place.

- [x] T018 [US1] Create `e2e/journeys/gallery.ts` and add J1 — advance the gallery with the next control. Capture the selected `figure.is-selected` `aria-label`, click the control named "Next image", assert a different figure carries `is-selected` and the live region counted up. Assert `flickity-enabled` landed first, so a carousel that never booted fails with that message rather than with a missing control (US1 AS1 → SC-001)
- [x] T019 [US1] Add J2 to `e2e/journeys/gallery.ts` — move the gallery with the arrow keys. Focus the carousel region (Flickity gives it `tabindex="0"`), press ArrowRight then ArrowLeft, assert the selection moves in each pressed direction. `wrapAround: true` is on, so this holds from index 0 (US1 AS2 → SC-001)
- [x] T020 [US1] Add J3 to `e2e/journeys/gallery.ts` — the nested dismissal. From the work index open a project preview, open a photograph full-screen inside it, dismiss with Escape, then assert the preview `[role="dialog"]` is still attached and `page.url()` is still the project's. This is SC-002 and it is the one the spec says fails, so it gets the nested case specifically, not a simplified stand-in (US1 AS3 → SC-002)
- [x] T021 [US1] Add J4 to `e2e/journeys/gallery.ts` — pointer idle. Move the pointer, assert `[data-gallery-controls]` has computed `opacity: 1`; stop moving and assert it reaches `opacity: 0` with a retrying assertion bounded comfortably above the idle period; move again and assert it returns. No `waitForTimeout` — wait for the state, not for a guessed duration (US1 AS4, research.md §12)
- [x] T022 [US1] Create `e2e/gallery.spec.ts` importing J1–J4 and running each under both motion preferences: two `test.describe` blocks, with `test.use({ reducedMotion: "reduce" })` **inside** the second one. The placement is load-bearing — `test.use()` at file top level applies to every test in the file, so writing it there would run all eight under `reduce` while the report still showed two variants and SC-004 still read as satisfied. Title the reduced-motion describe so it contains the word "reduce", since quickstart.md scenario 6 selects that half with `--grep "reduce"`. Same imported bodies, same expected endings; the variant is a wrapper, never a second copy (SC-004, research.md §4)

**Checkpoint**: `npm run test:e2e -- gallery` runs 8 tests and passes. The largest untested surface in the codebase now has coverage that fails when the gallery is broken.

---

## Phase 4: User Story 2 — Navigation completes and lands the keyboard (Priority: P2)

**Goal**: an internal navigation reaches its destination and reveals it, focus
ends up inside the new page's content, and dismissing the project preview
returns to the work index rather than one level past it.

**Independent Test**: follow a link between two pages, confirm the destination is
visible, press Tab and confirm focus is inside the page content. Runnable as
`npm run test:e2e -- navigation` without US1 or US3 in place.

- [x] T023 [US2] Create `e2e/journeys/navigation.ts` and add J5 — follow an internal link. Click a main-nav link, assert the destination route is reached and `document.documentElement.dataset.pageTransition` reaches `"ready"`. The curtain lifting is the assertion; a curtain that covers and never reveals is the failure this journey exists for (US2 AS1 → SC-003)
- [x] T024 [US2] Add J6 to `e2e/journeys/navigation.ts` — press Tab after a navigation and assert `document.activeElement` is contained by the page content root, not `<body>`. A keyboard visitor restarting at the top of the document on every navigation is an accessibility regression nothing currently notices (US2 AS2 → SC-003, Principle II)
- [x] T025 [US2] Add J7 to `e2e/journeys/navigation.ts` — dismiss the project preview from the work index and assert the work index is the landing place, not one entry further back in history. Distinct from J3 on purpose: same screen, different thing dismissed (US2 AS3)
- [x] T026 [US2] Create `e2e/navigation.spec.ts` importing J5–J7 under both motion preferences, following the T022 pattern — two `test.describe` blocks, `test.use()` inside the second, never at file scope (SC-004)

**Checkpoint**: `npm run test:e2e` runs 14 tests and passes. Gallery and navigation are both covered; the reduced-motion story is not yet.

---

## Phase 5: User Story 3 — Motion respects the visitor's preference (Priority: P3)

**Goal**: a visitor who asked for reduced motion gets a page that arrives at its
finished state without the intervening animation — and that is checked, not
assumed.

**Independent Test**: run the page-entry and pointer-label journeys with a
reduced-motion preference and confirm the page arrives; run them without it and
confirm the entrance animation runs and completes.

- [x] T027 [US3] Create `e2e/journeys/motion.ts` and add J8 — open a page and let it arrive. Under `no-preference`, assert the entrance animation runs and the heading spans finish at computed `opacity: 1`. Under `reduce`, assert the content is at `opacity: 1` immediately with no parked `opacity: 0` state — `usePageIntro` never builds the timeline under `reduce`, and if that guard breaks a reduced-motion visitor gets a permanently invisible page (US3 AS1 and AS3, data-model.md → Motion preference variant)
- [x] T028 [US3] Add J9 to `e2e/journeys/motion.ts` — hover a labelled target. On the work index, move the mouse over the first `[data-work-card]` (its `usePointerLabel` claims the label "View") and assert `[data-glass-pointer]` gains `data-active`. Under `reduce`, the label appears without the trailing follow animation (US3 AS2)
- [x] T029 [US3] Create `e2e/motion.spec.ts` importing J8 and J9 under both preferences, with `test.use()` inside a `test.describe` as in T022. J8 is the one journey whose _ending_ differs by variant, so its two endings are written out explicitly rather than shared — see the variant table in [data-model.md](./data-model.md)
- [x] T030 [US3] Verify the preference is real, not simulated: confirm no file under `e2e/` assigns to `window.matchMedia`, and that every reduced-motion block sets the preference with `test.use({ reducedMotion: "reduce" })`. A faked query would assert that the code reads a preference rather than that it honours one, which is what the unit suite already does (research.md §4)

**Checkpoint**: `npm run test:e2e` runs 18 tests and passes. Every journey has a reduced-motion counterpart (SC-004).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: the parts of the spec that are documentation and demonstration
rather than code. FR-004's written statement and SC-006's discoverability are
requirements, not tidying.

- [x] T031 Update `README.md`: add `npm run test:e2e` to the quality-gates table, and extend the paragraph that already says browser tests are in neither hook so it names the command and links `specs/012-browser-e2e-tests/contracts/run-location.md`. Note the one-time browser download `postinstall` from T001 and the `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` escape. **Two stale things to fix in the same pass**: the claim that the test suite runs on `git commit` — it has run on `git push` since the constitution's v2.2.1 amendment, and a document wrong about one gate is not evidence for another; and the table's description of `npm test` as "unit + mock tests", which contradicts AGENTS.md's own rule that mock is a technique rather than a level. Use unit + integration, matching AGENTS.md (SC-006)
- [x] T032 [P] Update `AGENTS.md`: add `npm run test:e2e` to the "Before you call it done" block, stating the four triggers from [contracts/run-location.md](./contracts/run-location.md) — gallery, page transition, pointer follower, route entry animation — and that it is deliberately not in either hook. Also correct §5's claim that browser-only behaviour "is not faked into a unit test" to say where it _is_ tested now, and note the 012 row in the spec table is no longer spec-only (SC-006)
- [x] T033 [P] Amend `.specify/memory/constitution.md` Principle V, PATCH (2.2.1 → 2.2.2), with a Sync Impact Report at the top in the existing style. Two corrections: work gallery navigation is no longer "covered only at the component level (`WorkFilters.test.tsx`)" — `WorkGalleryClient.test.tsx` landed, and this feature adds the end-to-end path; and "remains uncovered until an E2E tool is adopted" is now satisfied, since this is the adoption. The exclusion of E2E from the commit and push gates is unchanged and must stay stated (plan.md → Constitution Check)
- [x] T034 Run every validation scenario in [quickstart.md](./quickstart.md) in order and record the results. Scenarios 1–3 and 5–6 must pass as written
- [x] T035 Demonstrate SC-007 once, per quickstart.md scenario 4: break one gallery behaviour by hand — remove the next control's `onClick`, or delete the `ArrowLeft`/`ArrowRight` branch in `src/components/work/WorkProjectGallery/WorkProjectGalleryClient.tsx` — confirm the suite fails and that the message names what it expected and what it found rather than timing out anonymously, restore the file with `git checkout --`, and paste the observed failure output into the PR description. **Run it as `E2E_FRESH_BUILD=1 npm run test:e2e -- gallery`**: with the default `reuseExistingServer`, a `next start` left listening on 3000 from an earlier run serves the pre-break build, the suite passes, and the one check that proves this suite is worth having would have proved the opposite of what it claimed. Asked for demonstrated, not assumed
- [x] T036 Confirm SC-005 by measurement, not assertion: time `git commit --allow-empty` and a `git push --dry-run` before and after this feature and confirm both are within noise. Then introduce a deliberate type error into an `e2e/*.spec.ts` file and confirm the **commit** fails — excluded from the hooks means not executed by them, not invisible to them ([contracts/run-location.md](./contracts/run-location.md))
- [x] T037 Tick the boxes in `specs/012-browser-e2e-tests/checklists/requirements.md` that this feature discharges, and add a note recording what shipped short of the headline: 115 of the 169 browser-coupled statements, with the home page's scroll choreography (48) and the project album layout's measurement code (6) deliberately out of scope (spec.md → Assumptions, research.md §11, plan.md → Scope boundary)
- [x] T038 Re-measure and confirm the coverage claim rather than inheriting it: run `npx vitest run --coverage` and check that the browser-coupled areas named in the spec's Assumptions table still carry the statement counts it lists. The table was wrong once — four rows summing to 165 beside a stated total of 170 — and the correction is only durable if the next person checks it instead of copying it forward

**Checkpoint**: the feature is done. The run location is written in three places, the suite has been proven to fail on a real break, and the commit and push gates are as fast as they were.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies — start immediately
- **Phase 2 (Foundational)**: depends on Phase 1. **Blocks all three user stories.** T009–T014 in particular are a hard gate: FR-007 requires the four copies reduced to one _before_ a test asserts the reveal, or the test reports on one copy while three drift
- **Phase 3 (US1, P1)**: depends on Phase 2. This is the MVP
- **Phase 4 (US2, P2)**: depends on Phase 2. Independent of Phase 3
- **Phase 5 (US3, P3)**: depends on Phase 2 for the support layer, and on T009 specifically — J8 asserts the consolidated reveal. Independent of Phases 3 and 4 otherwise
- **Phase 6 (Polish)**: depends on the user stories that shipped. T031–T033 can be drafted earlier but must not land before the command they document exists

### User Story Dependencies

- **US1 (P1)**: after Phase 2. No dependency on US2 or US3
- **US2 (P2)**: after Phase 2. No dependency on US1 or US3
- **US3 (P3)**: after Phase 2, plus T009. Reuses the variant pattern established by T022 but does not require Phase 3 to have shipped

### Within Each User Story

Journeys before the spec file that imports them, because the spec file is a
wiring step. Within a journey file the tasks are sequential — they edit the same
file — which is why they carry no `[P]`.

### Parallel Opportunities

- T003, T004, T005 — three different files, no shared state
- T007, T008 — two support modules, no dependency between them
- T010, T011, T012, T013 — four route components, one each, all after T009
- T015, T016 — two different components
- The three user stories, once Phase 2 is complete
- T032, T033 — separate documents, both after T031's decisions are settled

---

## Parallel Example: Phase 2

```bash
# After T009 lands, the four copies come out in parallel:
Task: "Delete the heading block from src/app/(site)/about/AboutExperience.tsx"
Task: "Delete the heading block from src/app/(site)/service/ServiceExperience.tsx"
Task: "Delete the heading block from src/app/(site)/contact/ContactExperience.tsx"
Task: "Delete the heading block from src/app/(site)/work/WorkGalleryClient.tsx"

# Independently of those, the support layer:
Task: "Create e2e/support/content.ts"
Task: "Create e2e/support/observables.ts"
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 — Setup
2. Phase 2 — Foundational (blocks everything; the consolidation is the slow part)
3. Phase 3 — US1
4. **Stop and validate**: `npm run test:e2e -- gallery`, then do T035's break-it check early on this story rather than at the end. A suite that has never been seen to fail is not yet evidence of anything
5. Ship it. The largest untested surface in the codebase is now covered, and the rest is additive

### Incremental delivery

Phase 1 + 2 → foundation. → US1 → run, break something, fix it, ship. → US2 →
run, ship. → US3 → run, ship. → Phase 6 documentation and the measured SC-005
check. Each story is a complete increment; none breaks the ones before it.

### Notes

- `[P]` means different files with no incomplete dependency
- Commit after each task or logical group. The hooks will lint and type-check
  `e2e/` on every one of those commits without ever executing it — that is the
  intended split, not an oversight
- The one thing to avoid: adding `npm run test:e2e` to a Git hook "just to see".
  That is a change to FR-004, SC-005 and constitution Principle V at once, and
  [contracts/run-location.md](./contracts/run-location.md) says what it would
  take to make it legitimately
