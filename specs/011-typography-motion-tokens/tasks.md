---
description: "Task list for Typography and Motion Tokens"
---

# Tasks: Typography and Motion Tokens

**Input**: Design documents from `/specs/011-typography-motion-tokens/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/token-naming.md, quickstart.md

**Tests**: One test is a deliverable — the coverage-declaration check (US3). Rendering and timing equivalence is verified by `npm run audit:css-diff`, built in feature 010; no new test framework is introduced.

**Organization**: Grouped by user story so each is independently deliverable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3
- Exact file paths in every task

## The rule that governs every task in this file

Every definition holds a value **byte-identical** to the literal it replaces (contracts/token-naming.md). Concretely forbidden here: rounding `1.14`/`1.15`/`1.16` onto `--line-height-copy` (1.18), promoting `font-weight: 650` to 600 or 700, collapsing `140`/`150`/`160`ms or `340`/`350`/`360`ms. Every one of those is recorded in research.md §6 as a consolidation candidate instead.

**This feature's risk is the inverse of feature 010's.** There, 84 one-off ramps made a tidy scale impossible. Here a small recurring set covers 71–98% of each category, so the scale looks tidy enough to round a one-off onto — which changes rendering. `1.15` is not `1.18`.

**Tier choice** (contracts/token-naming.md): scale tier when a second call site would want the value for the same reason; semantic tier when sharing it would be coincidence. For durations this resolves cleanly — a value crossing unrelated components is scale tier, a value recurring only inside one component is that component's speed.

---

## Phase 1: Setup (Measurement First)

**Purpose**: Make the drift measurable before changing anything, so "we fixed it" is provable.

- [ ] T001 Extend `scripts/audit-design-system.mjs` to scan `line-height`, `font-weight`, `letter-spacing`, and durations and `cubic-bezier()` curves inside `transition`/`animation`. Read durations out of shorthands — `transition: opacity 180ms ease` contributes `180ms`, and one declaration may contribute several. Treat `inherit`/`initial`/`unset`/`revert`/`normal` and every form of zero (`0`, `0s`, `0ms`) as keywords, not literals (spec FR-010)
- [ ] T002 Run the audit and save its output to `specs/011-typography-motion-tokens/baseline-audit.txt`. Confirm it reproduces research.md §2: line-height 48/17, font-weight 53/6, letter-spacing 17/8, duration 53/21, easing 14/5 — 185 literals across 57 distinct values in 20 files. If it disagrees, the script is wrong; fix T001 first, because every later task is measured against this

**Checkpoint**: drift is measurable and the baseline is recorded.

---

## Phase 2: Foundational (Token Families)

**Purpose**: Definitions must exist before anything can reference them. Blocks US1 and US2.

**⚠️ CRITICAL**: No substitution task may begin until this phase is complete.

- [ ] T003 [P] Add three steps to the existing `/* Typography */` line-height block in `src/styles/_tokens.scss`: `--line-height-control: 1.2`, `--line-height-compact: 1.25`, `--line-height-loose: 1.35`. Leave `--line-height-copy: 1.18` at its value and unused — no literal in the tree matches it, and retuning it is a design decision on no evidence (research.md §6). Comment why it stays
- [ ] T004 [P] Add a `/* Tracking */` block to `src/styles/_tokens.scss`: `--tracking-label: 0.08em` (×6, uppercase eyebrows and labels), `--tracking-display: -0.02em` (×4, large text), `--tracking-glass-label: 0.02em` (×2). The third is named semantically, not by width — its two call sites are one control at two sizes, the pairing `--font-size-glass-label` already recognises
- [ ] T005 [P] Add a `/* Font weight */` block to `src/styles/_tokens.scss`: `regular` 400, `medium` 500, `semibold` 600, `bold` 700, `extrabold` 800. Then open the three call sites of `650` — `ShareButton`, `WorkDetailModal`, `WorkProjectGallery` — and name it for the role it plays there. Do **not** round it to 600 or 700; that changes rendering
- [ ] T006 [P] Add an `/* Easing */` block to `src/styles/_tokens.scss` for the 5 curves in research.md §4, named for the motion each describes — entrance, exit, glass — never for its control points
- [ ] T007 Add a `/* Duration */` block to `src/styles/_tokens.scss` for all 21 durations. Scale tier for values crossing unrelated components (`180ms` in Button/MainNav/gallery, `220ms` in four components); semantic tier for values recurring inside one (`250ms` ×4 in GlassPointer, `700ms`/`780ms`/`90ms` in PageTransition). This is the task most exposed to naming a token after its own number — `--duration-180` fails SC-007 even though the literal is gone
- [ ] T008 Verify the token layer still compiles and nothing rendered changed yet: `npm run build` succeeds and no `*.module.scss` consumer has been edited. Adding unused custom properties must be a no-op

**Checkpoint**: every definition exists and is named. Nothing consumes them yet.

---

## Phase 3: User Story 1 - The type rhythm changes in one place (Priority: P1) 🎯 MVP

**Goal**: No line height, font weight or letter spacing is stated literally in any component stylesheet.

**Independent Test**: Change one typography definition, rebuild, confirm every screen that used that value changed together. The audit reports zero for all three categories.

**Depends on**: Phase 2 (T003–T005).

Substitution runs **file by file**, not property by property — every literal in a file is going, so splitting the file across three passes means editing and reviewing it three times. Counts are typography-only literals from the baseline.

- [ ] T009 [US1] `src/components/work/WorkProjectGallery/WorkProjectGallery.module.scss` — 16 typography literals (7 line-height, 7 font-weight, 2 letter-spacing). Largest file; do it first and alone. Where an element already has a `--gallery-*-size` token from feature 010 and a one-off leading, pair the names: `--gallery-title-size` / `--gallery-title-leading` (spec FR-003a)
- [ ] T010 [US1] `src/app/(site)/home.module.scss` — 15 (7 line-height, 6 font-weight, 2 letter-spacing)
- [ ] T011 [P] [US1] `src/app/(site)/service/service.module.scss` — 10, and `src/components/ui/Button/Button.module.scss` — 8
- [ ] T012 [P] [US1] `src/components/layout/SiteFooter/SiteFooter.module.scss` — 9, and `src/components/work/WorkCard/WorkCard.module.scss` — 8
- [ ] T013 [P] [US1] `src/components/ui/Input/Input.module.scss` — 8, and `src/components/work/WorkDetailGallery/WorkDetailGallery.module.scss` — 10
- [ ] T014 [P] [US1] `src/app/(site)/contact/contact.module.scss` — 6, `src/app/(site)/about/about.module.scss` — 5, `src/components/work/WorkDetailModal/WorkDetailModal.module.scss` — 5
- [ ] T015 [P] [US1] The tail: `MainNav` (4), `GlassPointer` (3), `WorkFilters` (3), `not-found` (2), `PageShell` (2), `PageHeading` (2), `ShareButton` (2). Small but not optional — one literal left fails the audit as loudly as fifty
- [ ] T016 [US1] Run `npm run audit:design-system` and confirm `line-height`, `font-weight` and `letter-spacing` all report zero. Diff against `baseline-audit.txt` to show exactly what closed
- [ ] T017 [US1] Confirm the pairing rule held: for every element with both a size token and a one-off leading, the two names differ only in the property (spec SC-007a). An element reading a scale-tier leading must **not** have been given a private alias — that hides the fact it is sharing a decision
- [ ] T018 [US1] Verify nothing moved: `npm run audit:css-diff` reports `RENDERED CSS IDENTICAL`

**Checkpoint**: US1 is independently shippable — the typography scales govern for the first time, even if US2/US3 never land.

---

## Phase 4: User Story 2 - Motion speaks one vocabulary (Priority: P2)

**Goal**: No duration or easing curve is stated literally in any component stylesheet.

**Independent Test**: Change one duration or easing definition, rebuild, confirm every transition that used it changes together.

**Depends on**: Phase 2 (T006–T007). Independent of US1 — different properties, and only two files overlap.

- [ ] T019 [US2] `src/components/work/WorkProjectGallery/WorkProjectGallery.module.scss` — 15 motion literals (12 duration, 3 easing). Sequence after T009 to avoid editing this file twice at once
- [ ] T020 [P] [US2] `src/components/work/WorkDetailModal/WorkDetailModal.module.scss` — 10 (8 duration, 2 easing), and `src/components/layout/PageTransition/PageTransition.module.scss` — 11 (7 duration, 4 easing)
- [ ] T021 [P] [US2] `src/components/ui/GlassPointer/GlassPointer.module.scss` — 10 (7 duration, 3 easing), and `src/components/work/WorkMasonryGrid/WorkMasonryGrid.module.scss` — 4
- [ ] T022 [P] [US2] `src/components/navigation/MainNav/MainNav.module.scss` — 4, `src/components/ui/ShareButton/ShareButton.module.scss` — 3, `src/components/ui/Button/Button.module.scss` — 3, `src/components/work/WorkDetailGallery/WorkDetailGallery.module.scss` — 4, `src/components/work/WorkFilters/WorkFilters.module.scss` — 2, `src/components/work/WorkCard/WorkCard.module.scss` — 1
- [ ] T023 [US2] Run the audit and confirm `duration` and `easing` report zero. Then check the names, which the script cannot: no duration is named after its own milliseconds and no curve after its control points (spec SC-007)
- [ ] T024 [US2] Verify nothing moves differently: `npm run audit:css-diff` reports `RENDERED CSS IDENTICAL`. Then watch the page transition, the modal open/close and a gallery hover by eye — this is the one category where a mistake is felt before it is seen (quickstart Scenario 5)

**Checkpoint**: US1 + US2 together close all five categories.

---

## Phase 5: User Story 3 - A category cannot be quietly left out again (Priority: P3)

**Goal**: What the check inspects is written down, and something verifies the writing.

**Independent Test**: Add a property group to the scan without adding it to the declaration; `npm test` fails naming the group.

**Depends on**: T001 only. Could ship before US1 or US2.

- [ ] T025 [US3] Add a coverage declaration to `scripts/audit-design-system.mjs`: an exported structure naming every property group the script inspects, and every group deliberately excluded with its reason — corner radius, stacking order, element dimensions, outline offset, opacity, and motion held in interaction code (spec Assumptions). Print it in the audit's output so a passing run states what it is claiming
- [ ] T026 [US3] Write `src/styles/coverage.test.ts`: import the declaration, and assert every property group the script actually scans appears in it, and that every exclusion carries a non-empty reason. This is what stops the declaration becoming prose that drifts from the code — the same failure, one level up, as the drift this work removes
- [ ] T027 [US3] Prove the test can fail: add a property group to the scan without declaring it, confirm `npm test` fails naming it, then revert. A check that cannot fail is not a gate (feature 009 §8, feature 010 T030)

**Checkpoint**: all three stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T028 Run every quickstart.md scenario end to end in one pass, confirming no earlier scenario regressed while a later one was built
- [ ] T029 [P] Update `AGENTS.md` §3 with the new families (`--tracking-*`, `--font-weight-*`, `--duration-*`, `--ease-*`), the three added line-height steps, and the size/leading pairing rule, so the next session inherits the vocabulary rather than reinventing it
- [ ] T030 [P] Append this feature's consolidation candidates to `specs/011-typography-motion-tokens/research.md` §6 as a single follow-up alongside feature 010's §3a, so the whole set is argued about in one place rather than two
- [ ] T031 Record the state of the two remaining exclusions in `specs/011-typography-motion-tokens/research.md`: corner radius and stacking order (genuine token families, deferred on scope), and the 39 motion values in interaction code — including the page-heading reveal stated byte-identically in four files, which is shared-behaviour duplication rather than a token question and survived feature 010 because its check only read stylesheets

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Phase 1 (the baseline says which definitions to mint) — BLOCKS US1 and US2
- **US1 (Phase 3)**: depends on T003–T005
- **US2 (Phase 4)**: depends on T006–T007; otherwise independent of US1
- **US3 (Phase 5)**: depends on T001 only — can ship first
- **Polish (Phase 6)**: depends on all three stories

### Within Each User Story

- US1: T009 first (largest file), then T010, then the [P] group T011–T015, then verification T016–T018
- US2: T019 first and after T009, then [P] group T020–T022, then T023–T024
- US3: T025 → T026 → T027

### Parallel Opportunities

- T003–T007 all add separate blocks to `_tokens.scss`. Marked [P] as independent decisions, but they touch one file — apply in sequence to avoid conflicts
- T011–T015 and T020–T022 — distinct files, genuinely parallel
- All of US3 runs alongside US1/US2
- T029 and T030 — different files

### File Overlap Between Stories

Only `WorkProjectGallery`, `WorkDetailGallery`, `Button`, `WorkCard`, `MainNav` and `WorkDetailModal` carry both typography and motion literals. Sequence US2's task for each after US1's rather than editing the same file from two directions.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup — make drift measurable
2. Phase 2: Foundational — mint the definitions
3. Phase 3: US1 — substitute typography
4. **STOP and VALIDATE**: three categories report zero; `audit:css-diff` reports identical
5. At this point the line-height tokens that have never been used are finally used, which is the single clearest thing this feature does

### Incremental Delivery

1. Setup + Foundational → definitions exist
2. US1 → typography governs → **MVP**
3. US2 → motion governs
4. US3 → coverage cannot silently shrink again
5. Polish → vocabulary documented, follow-ups recorded

---

## Notes

- Byte-identical substitution is the whole safety argument. If a task tempts you to improve a value, that is a different change — record it in research.md §6 and move on
- The audit cannot check names, only literals. T017 and T023 are the only defence against 57 definitions named after their own values; do not skim them
- `--line-height-copy` staying unused is deliberate and will look like an oversight to the next reader. T003 must comment why, or someone will "fix" it
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
