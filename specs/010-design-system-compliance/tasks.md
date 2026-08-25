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

**Zero literals, all three categories.** Every colour, type size and spacing value becomes a token regardless of how many places use it (spec SC-001–SC-003): 36 colours, 37 type sizes, 95 spacing values — 168 in all, 12 of which already have a token. There is no comment that excuses a literal and no use-count threshold. Note this is _not_ permission to merge near-misses: `0.0375` and `0.04` are still two tokens.

**Which tier a token goes in** (contracts/token-naming.md): scale tier for values that genuinely recur (`--space-fluid-lg`), semantic tier named for the element served for values that belong to one place (`--about-intro-pad-y`). 84 of the new tokens are one-off fluid ramps and take semantic names. Numbering a token after its own value — `--space-fluid-37` — is a violation of SC-003a even though the literal is technically gone.

---

## Phase 1: Setup (Measurement First)

**Purpose**: Be able to measure drift before changing anything, so "we fixed it" is provable rather than asserted.

- [x] T001 Write `scripts/audit-design-system.mjs`: scan `src/**/*.module.scss` and report (a) every colour, type-size and spacing literal not resolving through `var(--…)`, (b) which of those appear 2+ times, (c) which appear once. Exit non-zero when (b) or (c) is non-empty, per contracts/token-naming.md. Key spacing on individual values, not whole declarations — `padding: 1rem 0` contributes `1rem`, or repeated values hide inside shorthands
- [x] T002 Add `"audit:design-system": "node scripts/audit-design-system.mjs"` to `package.json` scripts. Do **not** wire it into `.husky/pre-commit` or `.husky/pre-push` — it is a periodic tree-wide audit, not a per-commit gate (contracts/token-naming.md)
- [x] T003 Run the audit and save its output to `specs/010-design-system-compliance/baseline-audit.txt`. Confirm it reproduces the counts in research.md §3. Recorded baseline: colour 36 distinct values (14 repeated across 36 uses, 22 used once), type-size 37 (7 across 16, 30 once), spacing 95 (22 across 87, 73 once) — 168 in all. If the script disagrees, the script is wrong — fix T001 before continuing, because every later task is measured against this

**Checkpoint**: drift is measurable and the baseline is recorded.

---

## Phase 2: Foundational (Token Families)

**Purpose**: The tokens must exist before anything can reference them. Blocks all three user stories.

**⚠️ CRITICAL**: No substitution task may begin until this phase is complete.

Work from `baseline-audit.txt`: section (b) is the scale tier, section (c) is mostly the semantic tier. Do the scale tier first — a value that turns out to recur must not be given a semantic name.

### Scale tier

- [x] T004 [P] Add a `/* Typography — fluid */` block to `src/styles/_tokens.scss` for the repeated fluid ramps in research.md §3, named `--font-size-fluid-*` by relative size. Copy each `clamp()` argument list exactly; `clamp(1.25rem, 1.67vw, 1.5rem)` and `clamp(1.15rem, 1.67vw, 1.5rem)` are two separate tokens despite sharing an upper bound and slope
- [x] T005 [P] Add an `/* Overlays */` block to `src/styles/_tokens.scss` covering **every** translucent colour in the tree: the 14 repeated values plus the 16 used once, in `GlassPointer` (6), `WorkDetailModal` (3) and `WorkProjectGallery` (7) — 30 in all, listed in `baseline-audit.txt` (b) and (c). Name each `--overlay-<light|dark>-<weight>` by surface and intent, never by alpha. `rgb(18 18 18 / 0%)` is a gradient's transparent stop, not a veil — name it for that role. Several single-use values sit a hair from a repeated one (`0.0375`/`0.04`, `0.3375`/`0.3`, `0.225`/`0.22`); each keeps its own token and its own name, and the pairing is recorded for T034
- [x] T006 [P] Add a `/* Dark surface — project lightbox */` block to `src/styles/_tokens.scss` for the 7 warm-dark values in `WorkProjectGallery.module.scss`, as `--surface-dark*` and `--on-surface-dark-*` (research.md §5, data-model.md)
- [x] T007 [P] Add scale-tier spacing tokens to `src/styles/_tokens.scss` for the 22 repeated values in `baseline-audit.txt` (b). Eight map onto existing tokens and need nothing new (`0.5rem`→`--space-xs`, `0.25rem`→`--space-2xs`, `1rem`→`--space-md`, `1.5rem`→`--space-lg`, `2rem`→`--space-xl`, `4rem`→`--space-3xl` among them); the rest are new, including `1.25rem` (×6), `0.35rem` (×5), `0.45rem`, `3rem`, `0.6rem`, `0.8rem`. Investigate the px values (`3px`, `4px`, `5px`, `8px`, `-1px`) while here — they are the only px in the set and may be mistakes worth flagging rather than enshrining

### Semantic tier

These are the 125 values used exactly once, listed in `baseline-audit.txt` (c). Name each for the element or surface it serves, never for the number it holds (contracts/token-naming.md). Grouped by owning surface so each task is one coherent naming decision rather than a list of numbers.

- [x] T007a [P] Name the single-use type sizes and spacing for the four content pages in `src/styles/_tokens.scss`: `home` (28 values), `service` (18), `about` (12), `contact` (6). These are section rhythms and heading ramps — `--home-hero-size`, `--about-intro-pad-y` — and they are the largest group by count
- [x] T007b [P] Name the single-use type sizes and spacing owned by the work surfaces: `WorkProjectGallery` (51 values, the heaviest file in the feature), `WorkDetailGallery` (18), `WorkDetailModal` (10), `WorkCard` (5), `WorkFilters` (5), `WorkMasonryGrid` (1)
- [x] T007c [P] Name the remainder, owned by shared chrome and primitives: `GlassPointer` (19), `Button` (8), `SiteFooter` (8), `SiteHeader` (6), `MainNav` (4), `PageHeading` (3), `not-found` (3), `ShareButton` (2), `Input` (1), and the `work` route shell (8)
- [x] T007d Review the three semantic blocks together before any of them is consumed. Values named independently in T007a–T007c will have collided — two surfaces naming the same rhythm differently, or one ramp appearing in two blocks. Anything genuinely shared moves to the scale tier now; near-identical-but-distinct values stay separate and get recorded for T034. This is the task that stops the semantic tier becoming the lookup table research.md §2 warned about

### Mixins and verification

- [x] T008 Add a `forced-colors` mixin to `src/styles/_mixins.scss`, beside `hover-fine`/`touch`/`reduced-motion`, wrapping `@media (forced-colors: active)`
- [x] T009 Verify the token layer still compiles and nothing rendered changed yet: `npm run build` succeeds and no `*.module.scss` consumer has been edited. Adding unused custom properties must be a no-op

**Checkpoint**: all 156 new tokens exist across both tiers and are named for what they serve. Nothing consumes them yet.

---

## Phase 3: User Story 1 - A designer changes a value once and the site follows (Priority: P1) 🎯 MVP

**Goal**: No colour, type size or spacing value is stated literally in any component stylesheet.

**Independent Test**: Change one token, rebuild, confirm every place that used that value changed together. `npm run audit:design-system` exits 0 with both (b) and (c) empty.

**Depends on**: Phase 2.

Substitution runs **file by file**, not category by category. Under a zero-literals rule every literal in a file is going, so splitting the file across a colour pass and a spacing pass just means editing it twice and reviewing it twice. Counts below are total literals per file from `baseline-audit.txt`; run the audit after each task and watch that file's entries disappear.

- [x] T010 [US1] `src/components/work/WorkProjectGallery/WorkProjectGallery.module.scss` — 51 values, the heaviest file in the feature and the only one carrying its own sub-palette. Colours to `--overlay-*` (T005) and `--surface-dark*` / `--on-surface-dark-*` (T006); type sizes and spacing to their T004/T007 scale tokens where the value recurs, otherwise the T007b semantic names. Do this one first and alone — it is where a mistake is most likely and hardest to spot
- [x] T011 [US1] `src/app/(site)/home.module.scss` — 28 values, almost all one-off section rhythms and heading ramps taking T007a semantic names. The two repeated ramps it shares with `Button` go to `--font-size-fluid-*` (T004); do not give them a home-specific name
- [x] T012 [P] [US1] `src/components/ui/GlassPointer/GlassPointer.module.scss` — 19 values, mostly translucent. Every colour to `--overlay-*` (T005), including the 6 used once; `0.72rem` and `0.6875rem` per T004/T007c
- [x] T013 [P] [US1] `src/components/work/WorkDetailGallery/WorkDetailGallery.module.scss` — 18 values, and `src/app/(site)/service/service.module.scss` — 18 values
- [x] T014 [P] [US1] `src/app/(site)/about/about.module.scss` — 12 values, and `src/components/work/WorkDetailModal/WorkDetailModal.module.scss` — 10 values, whose 4 colours all go to T005 tokens
- [x] T015 [P] [US1] `src/components/ui/Button/Button.module.scss` (8), `src/app/(site)/work/work.module.scss` (8), `src/components/layout/SiteFooter/SiteFooter.module.scss` (8). Button's ramps are shared with `home` — scale tier, not semantic
- [x] T016 [P] [US1] `src/components/layout/SiteHeader/SiteHeader.module.scss` (6), `src/app/(site)/contact/contact.module.scss` (6), `src/components/work/WorkCard/WorkCard.module.scss` (5), `src/components/work/WorkFilters/WorkFilters.module.scss` (5)
- [x] T017 [P] [US1] The tail: `MainNav` (4), `not-found` (3), `PageHeading` (3), `ShareButton` (2), `Input` (1), `WorkMasonryGrid` (1). Small but not optional — one literal left behind fails the audit exactly as loudly as fifty
- [x] T018 [US1] Run `npm run audit:design-system` and confirm **both** (b) and (c) report `none`. Diff against `baseline-audit.txt` from T003 to show exactly what closed. There is no partial pass here: a literal still listed is unfinished work, never something to annotate
- [x] T019 [US1] Audit the token names, which the script cannot check: no token is named after its own value (spec SC-003a). `grep -nE '\-\-[a-z-]*[0-9]{2,}' src/styles/_tokens.scss` catches the obvious `--space-fluid-37` shape; the rest is reading. A value-named token means the literal moved rather than became a decision
- [x] T020 [US1] Verify nothing moved: `npm run build`, then compare `/`, `/about`, `/service`, `/work` and a project detail page with the lightbox open at ~375px, ~820px and ~1440px against the pre-change rendering (quickstart Scenario 6). With 168 substitutions this is the task most likely to find a typo — budget real time for it

**Checkpoint**: US1 is independently shippable — the design system actually governs, even if US2/US3 never land.

---

## Phase 4: User Story 2 - The same thing is built once (Priority: P2)

**Goal**: Repeated behaviour and repeated queries have exactly one definition.

**Independent Test**: `grep -rn "registerPlugin(useGSAP)" src | wc -l` returns 1; the `forced-colors` query appears in no stylesheet as a hand-written `@media`.

**Depends on**: Phase 2 (T008 for the mixin). Independent of US1 — different files, different failure mode.

- [x] T021 [US2] Create `src/utils/usePageIntro.ts` — **not** `src/components/ui/`, as this task first said: `src/components/ui/` is the design system's component half (Button, Icon, PageHeading …) and a hook is not a component. It sits beside `playOnPageReady.ts`, the helper it wraps. a client hook owning the module-scope `gsap.registerPlugin(useGSAP)` call and the `playOnPageReady` pairing, returning the root ref the four page components attach. Registration happens once at this module's scope (research.md §6, data-model.md)
- [x] T022 [US2] Adopt the hook in `src/app/(site)/about/AboutExperience.tsx`, removing its local `gsap.registerPlugin(useGSAP)` line and direct `playOnPageReady` import
- [x] T023 [US2] Adopt the hook in `src/app/(site)/contact/ContactExperience.tsx`, same removals
- [x] T024 [US2] Adopt the hook in `src/app/(site)/service/ServiceExperience.tsx`, same removals
- [x] T025 [US2] Adopt the hook in `src/app/(site)/work/WorkGalleryClient.tsx`, same removals
- [x] T026 [P] [US2] Replace the hand-written `@media (forced-colors: active)` in `src/components/layout/PageShell/PageShell.module.scss` with the T008 mixin
- [x] T027 [P] [US2] Replace the hand-written `@media (forced-colors: active)` in `src/components/work/WorkProjectGallery/WorkProjectGallery.module.scss` with the T008 mixin
- [x] T028 [US2] Validate quickstart Scenario 5: `registerPlugin(useGSAP)` appears exactly once in `src/`, and the page-entry animation on all four routes still plays as before

**Checkpoint**: US1 + US2 together remove both kinds of duplication — values and behaviour.

---

## Phase 5: User Story 3 - Values in two languages cannot drift apart (Priority: P3)

**Goal**: A change to `_breakpoints.scss` that is not mirrored into `breakpoints.ts` fails a check.

**Independent Test**: Change a mirrored breakpoint in the SCSS only; `npm test` fails naming the constant and both values.

**Depends on**: nothing in this feature. Could ship first if desired.

- [x] T029 [US3] Write `src/constants/breakpoints.test.ts`: read `src/styles/_breakpoints.scss` as text, match `$breakpoint-<name>: <n>px;`, and assert each exported constant in `breakpoints.ts` equals the SCSS value its name maps to. Check only what is mirrored — adding an unmirrored breakpoint to the SCSS must not fail (contracts/token-naming.md, research.md §8)
- [x] T030 [US3] Prove the test can fail: change `$breakpoint-phone-lg` in `src/styles/_breakpoints.scss` to a different value, confirm `npm test` fails and names the mismatch, then revert. A check that cannot fail is not a gate (quickstart Scenario 4)
- [x] T031 [US3] Update the comment at the top of `src/constants/breakpoints.ts` to say the mirror is now test-enforced, replacing "keep these two files in sync manually"

**Checkpoint**: all three stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T032 Run every quickstart.md scenario end to end in one pass on a scratch branch, confirming no earlier scenario regressed while a later one was built
- [x] T033 [P] Update `AGENTS.md` §3 with the two naming tiers and when to use each, the new scale families (`--font-size-fluid-*`, `--space-fluid-*`, `--overlay-*`, `--surface-dark*`), the semantic-tier convention (`--<surface>-<element>-<property>`), the `forced-colors` mixin, and the `npm run audit:design-system` command. State the rule plainly — no literal values in a `*.module.scss`, none — so the next agent session inherits it rather than reinventing a threshold
- [ ] T034 [P] Record the deferred consolidation candidates in `specs/010-design-system-compliance/research.md` §3 as a follow-up: the `0.02`–`0.075` alpha cluster, the two near-identical `clamp()` ramps, and every near-collision T007d surfaced between semantic-tier blocks. All were deliberately kept separate because merging them changes rendering. With the whole set finally visible in one file, someone should decide on purpose later — that review is the point of doing this work, not an afterthought to it
- [ ] T035 Consider whether the audit script should become a Git hook step or a CI check now that the tree is clean. Feature 009 §4's reasoning says no for a per-commit gate; the calculation changes if CI ever lands. Record the decision either way — do not leave it implicit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Phase 1 (the baseline tells you which tokens to mint) — BLOCKS US1 and US2. This is now the largest phase in the feature: 156 tokens across two tiers
- **US1 (Phase 3)**: depends on Phase 2
- **US2 (Phase 4)**: depends on Phase 2 (T008 only); otherwise independent of US1
- **US3 (Phase 5)**: independent of everything — can start any time
- **Polish (Phase 6)**: depends on all three stories

Unlike feature 009, these stories are **largely parallel**. US3 shares no file with US1 or US2, and US2's only tie to US1 is the shared `WorkProjectGallery.module.scss` in T027 — sequence T027 after T011 to avoid editing that file twice at once.

### Within Each User Story

- US1: T010 alone first (51 of the 168 values), then T011, then the [P] group T012–T017 which touch unrelated files, then verification T018–T020
- US2: T021 → T022–T025 (each a different file, but all depend on the hook existing) → T026/T027 → T028
- US3: T029 → T030 → T031

### Parallel Opportunities

- T004–T007c all add separate blocks to `_tokens.scss`. Marked [P] as independent decisions, but they touch one file — apply them in sequence to avoid conflicts. T007d is the reconciliation pass and must come after all of them
- T012–T017 — every file distinct, genuinely parallel once T010/T011 land
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
- Zero literals and byte-identical substitution pull in opposite directions and both win: every value becomes a token, and no two values become the same token. Expect a token file with visible near-duplicates at the end of this feature — that is the intended state, not an oversight (research.md §2)
- The risk this feature runs is not leftover literals, which the audit catches. It is 156 tokens named badly, which nothing catches. T007d and T019 are the only defence; do not skim them
- `GlassPointer.module.scss` and `WorkProjectGallery.module.scss` hold almost all the colour drift; T010 and T011 are the two heaviest tasks here
- The audit script is the feature's own measuring instrument. If T003 shows it disagreeing with research.md §3, trust neither until you know which is wrong
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
