---
description: "Task list for Design System Compliance"
---

# Tasks: Design System Compliance

**Input**: Design documents from `/specs/010-design-system-compliance/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/token-naming.md, quickstart.md

**Tests**: One test is a deliverable here — the breakpoint mirror check (US3). The rest of the feature is verified by the audit script, the existing suite, and direct visual comparison; no new test framework is introduced.

**Organization**: Grouped by user story so each is independently deliverable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3
- Exact file paths in every task

## The rule that governs every task in this file

Every token introduced MUST hold a value **byte-identical** to the literal it replaces (contracts/token-naming.md). Do not round near-identical alphas together, do not collapse `clamp()` ramps that share two of three arguments, do not normalise onto the nearest existing step. A visible difference after this work means a typo, not a decision.

---

## Phase 1: Setup (Measurement First)

**Purpose**: Be able to measure drift before changing anything, so "we fixed it" is provable rather than asserted.

- [x] T001 Write `scripts/audit-design-system.sh`: scan `src/**/*.module.scss` and report (a) every colour, type-size and spacing literal not resolving through `var(--…)`, (b) which of those appear 2+ times, (c) which appear once with no explanatory comment on or above the line. Exit non-zero when (b) or (c) is non-empty, per contracts/token-naming.md
- [x] T002 Add `"audit:design-system": "bash scripts/audit-design-system.sh"` to `package.json` scripts. Do **not** wire it into `.husky/pre-commit` or `.husky/pre-push` — it is a periodic tree-wide audit, not a per-commit gate (contracts/token-naming.md)
- [x] T003 Run the audit and save its output to `specs/010-design-system-compliance/baseline-audit.txt`. Confirm it reproduces the counts in research.md §3 (14 colour values / 36 uses, 12 spacing / 33, 5 type ramps / 12). If it disagrees, the script is wrong — fix T001 before continuing, because every later task is measured against this

**Checkpoint**: drift is measurable and the baseline is recorded.

---

## Phase 2: Foundational (Token Families)

**Purpose**: The tokens must exist before anything can reference them. Blocks all three user stories.

**⚠️ CRITICAL**: No substitution task may begin until this phase is complete.

- [ ] T004 [P] Add a `/* Typography — fluid */` block to `src/styles/_tokens.scss` with the 5 ramps from research.md §3, named `--font-size-fluid-*` by relative size. Copy each `clamp()` argument list exactly; `clamp(1.25rem, 1.67vw, 1.5rem)` and `clamp(1.15rem, 1.67vw, 1.5rem)` are two separate tokens despite sharing an upper bound and slope
- [ ] T005 [P] Add an `/* Overlays */` block to `src/styles/_tokens.scss` with the 14 values from research.md §3, named `--overlay-<light|dark>-<weight>` by surface and intent, never by alpha. `rgb(18 18 18 / 0%)` is a gradient's transparent stop, not a veil — name it for that role
- [ ] T006 [P] Add a `/* Dark surface — project lightbox */` block to `src/styles/_tokens.scss` for the 7 warm-dark values in `WorkProjectGallery.module.scss`, as `--surface-dark*` and `--on-surface-dark-*` (research.md §5, data-model.md)
- [ ] T007 [P] Add spacing tokens to `src/styles/_tokens.scss` for the duplicate values that have no existing equivalent: `1.25rem` (×5), `0.35rem`, `0.45rem`, `3rem`, and the lone `5px`. The other duplicates map onto existing tokens and need nothing new. Investigate the `5px` while here — it is the only px value in the set and may be a mistake worth flagging rather than enshrining
- [ ] T008 Add a `forced-colors` mixin to `src/styles/_mixins.scss`, beside `hover-fine`/`touch`/`reduced-motion`, wrapping `@media (forced-colors: active)`
- [ ] T009 Verify the token layer still compiles and nothing rendered changed yet: `npm run build` succeeds and no `*.module.scss` consumer has been edited. Adding unused custom properties must be a no-op

**Checkpoint**: every token the feature needs exists and is named. Nothing consumes them yet.

---

## Phase 3: User Story 1 - A designer changes a value once and the site follows (Priority: P1) 🎯 MVP

**Goal**: No colour, type size, or spacing value is stated literally in more than one place.

**Independent Test**: Change one token, rebuild, confirm every place that used that value changed together. The audit reports zero duplicate literals.

**Depends on**: Phase 2.

- [ ] T010 [US1] Replace duplicate colour literals in `src/components/ui/GlassPointer/GlassPointer.module.scss` with the `--overlay-*` tokens from T005. This file and T011's carry almost all of them
- [ ] T011 [US1] Replace duplicate colour literals in `src/components/work/WorkProjectGallery/WorkProjectGallery.module.scss` with `--overlay-*` tokens (T005), and its 7 warm-dark values with `--surface-dark*` / `--on-surface-dark-*` (T006). Largest single file in the feature
- [ ] T012 [P] [US1] Replace the repeated `rgb(18 18 18 / 0%)` gradient stop in `src/components/work/WorkDetailModal/WorkDetailModal.module.scss` with its T005 token
- [ ] T013 [P] [US1] Replace the duplicate fluid type ramps in `src/app/(site)/home.module.scss` with `--font-size-fluid-*` tokens (T004)
- [ ] T014 [P] [US1] Replace the duplicate fluid type ramps in `src/components/ui/Button/Button.module.scss` with `--font-size-fluid-*` tokens (T004)
- [ ] T015 [US1] Replace the 5 fixed type sizes that exactly match an existing token (`0.625rem`, `0.75rem` ×2, `0.875rem`, `1rem`) across `WorkCard.module.scss`, `WorkFilters.module.scss` and `WorkProjectGallery.module.scss` with `var(--font-size-*)`
- [ ] T016 [US1] Decide and apply the 4 fixed type sizes with no equivalent — `0.6875rem`, `0.72rem` ×2, `0.95rem` in `GlassPointer.module.scss` and `WorkProjectGallery.module.scss`. Either mint a token or, if a value is single-use, leave it with a comment saying why (spec SC-003a). Do **not** round onto the nearest existing step — that changes rendering
- [ ] T017 [US1] Replace the 12 duplicate spacing values across their call sites: the ones with exact existing tokens (`0.5rem`→`--space-xs`, `0.25rem`→`--space-2xs`, `1rem`→`--space-md`, `2rem`→`--space-xl`, `4rem`→`--space-3xl`) and the ones minted in T007
- [ ] T018 [US1] Run `npm run audit:design-system` and confirm category (b) — literals appearing 2+ times — is empty. Diff against `baseline-audit.txt` from T003 to show exactly what closed
- [ ] T019 [US1] Add explanatory comments to every remaining single-use literal the audit reports in category (c), or promote it to a token if it turns out to encode a real decision. The audit must exit 0 afterwards
- [ ] T020 [US1] Verify nothing moved: `npm run build`, then compare `/`, `/about`, `/service`, `/work` and a project detail page with the lightbox open at ~375px, ~820px and ~1440px against the pre-change rendering (quickstart Scenario 6)

**Checkpoint**: US1 is independently shippable — the design system actually governs, even if US2/US3 never land.

---

## Phase 4: User Story 2 - The same thing is built once (Priority: P2)

**Goal**: Repeated behaviour and repeated queries have exactly one definition.

**Independent Test**: `grep -rn "registerPlugin(useGSAP)" src | wc -l` returns 1; the `forced-colors` query appears in no stylesheet as a hand-written `@media`.

**Depends on**: Phase 2 (T008 for the mixin). Independent of US1 — different files, different failure mode.

- [ ] T021 [US2] Create `src/components/ui/usePageIntro/usePageIntro.ts`: a client hook owning the module-scope `gsap.registerPlugin(useGSAP)` call and the `playOnPageReady` pairing, returning the root ref the four page components attach. Registration happens once at this module's scope (research.md §6, data-model.md)
- [ ] T022 [US2] Adopt the hook in `src/app/(site)/about/AboutExperience.tsx`, removing its local `gsap.registerPlugin(useGSAP)` line and direct `playOnPageReady` import
- [ ] T023 [US2] Adopt the hook in `src/app/(site)/contact/ContactExperience.tsx`, same removals
- [ ] T024 [US2] Adopt the hook in `src/app/(site)/service/ServiceExperience.tsx`, same removals
- [ ] T025 [US2] Adopt the hook in `src/app/(site)/work/WorkGalleryClient.tsx`, same removals
- [ ] T026 [P] [US2] Replace the hand-written `@media (forced-colors: active)` in `src/components/layout/PageShell/PageShell.module.scss` with the T008 mixin
- [ ] T027 [P] [US2] Replace the hand-written `@media (forced-colors: active)` in `src/components/work/WorkProjectGallery/WorkProjectGallery.module.scss` with the T008 mixin
- [ ] T028 [US2] Validate quickstart Scenario 5: `registerPlugin(useGSAP)` appears exactly once in `src/`, and the page-entry animation on all four routes still plays as before

**Checkpoint**: US1 + US2 together remove both kinds of duplication — values and behaviour.

---

## Phase 5: User Story 3 - Values in two languages cannot drift apart (Priority: P3)

**Goal**: A change to `_breakpoints.scss` that is not mirrored into `breakpoints.ts` fails a check.

**Independent Test**: Change a mirrored breakpoint in the SCSS only; `npm test` fails naming the constant and both values.

**Depends on**: nothing in this feature. Could ship first if desired.

- [ ] T029 [US3] Write `src/constants/breakpoints.test.ts`: read `src/styles/_breakpoints.scss` as text, match `$breakpoint-<name>: <n>px;`, and assert each exported constant in `breakpoints.ts` equals the SCSS value its name maps to. Check only what is mirrored — adding an unmirrored breakpoint to the SCSS must not fail (contracts/token-naming.md, research.md §8)
- [ ] T030 [US3] Prove the test can fail: change `$breakpoint-phone-lg` in `src/styles/_breakpoints.scss` to a different value, confirm `npm test` fails and names the mismatch, then revert. A check that cannot fail is not a gate (quickstart Scenario 4)
- [ ] T031 [US3] Update the comment at the top of `src/constants/breakpoints.ts` to say the mirror is now test-enforced, replacing "keep these two files in sync manually"

**Checkpoint**: all three stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T032 Run every quickstart.md scenario end to end in one pass on a scratch branch, confirming no earlier scenario regressed while a later one was built
- [ ] T033 [P] Update `AGENTS.md` §3 with the new token families (`--font-size-fluid-*`, `--space-fluid-*`, `--overlay-*`, `--surface-dark*`), the `forced-colors` mixin, and the `npm run audit:design-system` command, so the next agent session inherits the vocabulary rather than reinventing it
- [ ] T034 [P] Record the deferred consolidation candidates in `specs/010-design-system-compliance/research.md` §3 as a follow-up: the `0.02`–`0.075` alpha cluster and the two near-identical `clamp()` ramps were deliberately kept separate here because merging them changes rendering. Someone should decide on purpose later
- [ ] T035 Consider whether the audit script should become a Git hook step or a CI check now that the tree is clean. Feature 009 §4's reasoning says no for a per-commit gate; the calculation changes if CI ever lands. Record the decision either way — do not leave it implicit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Phase 1 (the baseline tells you which tokens to mint) — BLOCKS US1 and US2
- **US1 (Phase 3)**: depends on Phase 2
- **US2 (Phase 4)**: depends on Phase 2 (T008 only); otherwise independent of US1
- **US3 (Phase 5)**: independent of everything — can start any time
- **Polish (Phase 6)**: depends on all three stories

Unlike feature 009, these stories are **largely parallel**. US3 shares no file with US1 or US2, and US2's only tie to US1 is the shared `WorkProjectGallery.module.scss` in T027 — sequence T027 after T011 to avoid editing that file twice at once.

### Within Each User Story

- US1: T010/T011 first (they hold most of the drift), then the [P] group T012–T014, then T015–T017, then verification T018–T020
- US2: T021 → T022–T025 (each a different file, but all depend on the hook existing) → T026/T027 → T028
- US3: T029 → T030 → T031

### Parallel Opportunities

- T004–T007 all add separate blocks to `_tokens.scss`. Marked [P] as independent decisions, but they touch one file — apply them in sequence to avoid conflicts
- T012, T013, T014 — three different stylesheets, genuinely parallel
- T026 and T027 — different stylesheets (subject to the T011 ordering note)
- T033 and T034 — different files
- All of US3 runs alongside US1/US2

---

## Parallel Example: User Story 1

```bash
# After T010/T011 land, these three touch unrelated files:
Task: "Replace the gradient stop in WorkDetailModal.module.scss"
Task: "Replace fluid type ramps in home.module.scss"
Task: "Replace fluid type ramps in Button.module.scss"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup — make drift measurable
2. Phase 2: Foundational — mint the tokens
3. Phase 3: US1 — substitute
4. **STOP and VALIDATE**: audit reports zero duplicates; the site looks identical
5. At this point the design system governs for the first time, with no hook or test work done at all

### Incremental Delivery

1. Setup + Foundational → tokens exist
2. US1 → values are shared → **MVP**
3. US2 → behaviour is shared
4. US3 → the mirror cannot drift silently
5. Polish → vocabulary documented, deferred decisions recorded

---

## Notes

- Byte-identical substitution is the whole safety argument. If a task tempts you to improve a value, that is a different change — record it in research.md §3 and move on
- `GlassPointer.module.scss` and `WorkProjectGallery.module.scss` hold almost all the colour drift; T010 and T011 are the two heaviest tasks here
- The audit script is the feature's own measuring instrument. If T003 shows it disagreeing with research.md §3, trust neither until you know which is wrong
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
