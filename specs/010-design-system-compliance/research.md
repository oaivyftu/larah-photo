# Phase 0 Research: Design System Compliance

## 1. Why the token layer is the minority convention

**Finding**: Across 24 component stylesheets (~4,400 lines), 58 colour values, 47 type sizes and 133 spacing values bypass the token layer, against 22 type sizes and 17 spacing values that use it. The design system was authored, then largely not adopted.

**Root cause, not carelessness**: the token scale is a set of fixed rem steps (`--font-size-xs` … `--font-size-2xl`, `--space-2xs` … `--space-4xl`). The app's actual visual language is **fluid** — 38 of the 47 type sizes are `clamp()` ramps, and most spacing is `clamp()` too. A fixed scale cannot express `clamp(0.875rem, 1.11vw, 1rem)`, so authors wrote it inline. The single exception already in the token file, `--font-size-marquee: clamp(3rem, 4.45vw, 4rem)`, shows the intended shape was known but never generalised.

**Implication**: this is a design-system gap to close, not only a cleanup to perform. Any plan that only substitutes existing tokens leaves ~80% of the drift untouched.

## 2. What "compliant" should mean here

**Decision (2026-08-25, superseding two earlier drafts)**: zero literals, in all three categories. Every colour, type size and spacing value in a component stylesheet resolves through `src/styles/`, whatever its use count.

This section previously said the opposite twice — first that the constitution's two-or-more rule was the target, then that colour alone should be strict. Both are recorded below under Alternatives, because the reasoning that rejected them is the reasoning that has to hold the new rule up.

**Why the two-or-more rule was not enough**: it treats a use count of one as evidence that a value is not a shared decision. It is not. It is evidence that the value has not been copied **yet** — the state immediately before drift, not an exemption from it. The baseline shows what that looks like in practice: `rgba(255, 255, 255, 0.0375)` sitting beside a repeated `0.04`, `0.3375` beside a repeated `0.3`, `0.225` beside a repeated `0.22`. Each of those is a single use, so each would have been exempt; each is also unmistakably the same decision, made twice, slightly differently, by authors who never saw one another's work. A rule that exempts them preserves exactly the condition this feature exists to remove.

**Why the count is not the objection it appears to be**: 168 distinct values, of which 12 already have tokens, leaves 156 new definitions. That is a large token file but a normal-sized design system, and it is bounded — this is a complete inventory of the tree, not a rate. The genuine difficulty is not the number but the naming, addressed next.

**The naming tier (the decision that makes the strict rule workable)**: 84 of the 156 are fluid `clamp()` ramps used exactly once. Three rules collide over them:

1. Every value is tokenised (this section).
2. Every token holds a byte-identical value — no rounding, no merging (spec FR-010, §3 below).
3. No token is named for the number it holds (contracts/token-naming.md).

Eighty-four near-identical ramps cannot all be `--space-fluid-lg`; rule 2 forbids merging them; and `--space-fluid-37` satisfies rule 1 while gutting rule 3. So the design system gains a **second naming tier**:

- **Scale tier** — reusable steps with generic names, the existing `--space-*`, `--font-size-*`, and the new `--space-fluid-*`, `--font-size-fluid-*`, `--overlay-*` families. Used where a value genuinely recurs.
- **Semantic tier** — values named for the element or surface they serve: `--about-intro-pad-y`, `--service-hero-size`, `--lightbox-caption-size`. Used where a value belongs to one place.

Two ramps that differ by 0.1rem then carry different names honestly, because they serve different things — which is what they were doing all along, undocumented. The semantic tier lives in `src/styles/` like everything else, so this is not a licence to reintroduce component-local custom properties: those remain the private-token anti-pattern Principle VII forbids.

**Alternatives considered**:

- **The constitution's two-or-more rule, all categories** (this section's first draft): rejected 2026-08-25 per the second paragraph above. It was chosen originally to avoid ~40 single-use tokens, on the reasoning that they would make a lookup table rather than a design system. The semantic naming tier answers that objection directly — a token named for what it serves is a decision no matter how many places use it.
- **Strict for colour only** (this section's second draft): rejected 2026-08-25. It was a real improvement on the first, and its arguments — palette-sized token count, visible drift among the single uses, colour being the category with a wholesale change ahead of it — all held. What it could not answer was why the same arguments do not apply to a section's vertical rhythm or a heading's ramp. They do; the numbers are just bigger.
- **Convert fluid ramps to fixed steps**: rejected outright — it changes what every screen renders between breakpoints, which FR-010 forbids.
- **Merge near-identical values while tokenising**: rejected, same reason. Recorded in §3 as a deliberate follow-up instead.

## 3. The measured values (the mandatory work)

**Colour** — 14 distinct values used 36 times, concentrated almost entirely in two stylesheets (`GlassPointer`, `WorkProjectGallery`) plus one in `WorkDetailModal`:

| Value                       | Uses | Reading                          |
| --------------------------- | ---- | -------------------------------- |
| `rgba(255, 255, 255, 0.04)` | 5    | faintest light veil on dark      |
| `rgba(255, 255, 255, 0.3)`  | 4    | light scrim                      |
| `rgba(255, 255, 255, 0.34)` | 3    | light scrim, slightly stronger   |
| `rgba(255, 255, 255, 0.22)` | 3    | light scrim, weaker              |
| `rgba(0, 0, 0, 0.03)`       | 3    | faintest dark veil on light      |
| `#fff`                      | 3    | plain white text on dark         |
| `rgba(255, 255, 255, 0.11)` | 2    | light veil                       |
| `rgba(12, 12, 12, 0.3)`     | 2    | dark scrim (near-ink, not black) |
| `rgba(0, 0, 0, 0.075)`      | 2    | dark veil                        |
| `rgba(0, 0, 0, 0.05)`       | 2    | dark veil                        |
| `rgba(0, 0, 0, 0.04)`       | 2    | dark veil                        |
| `rgba(0, 0, 0, 0.038)`      | 2    | dark veil                        |
| `rgba(0, 0, 0, 0.02)`       | 2    | dark veil                        |
| `rgb(18 18 18 / 0%)`        | 2    | transparent stop in a gradient   |

An earlier draft of this section said 10 values across 28 uses; that list was truncated. These are overlays — scrims and veils over photography — which is why they are alpha values rather than named hues. The `0.02`–`0.075` cluster and the `0.22`–`0.34` cluster are close enough that some variation is probably accidental, but **collapsing them would change rendering**, so each becomes its own token and consolidation is a separate, deliberate decision later.

**Spacing** — 15 distinct values used 53 times. (An earlier hand count said 12 across 33; it used a narrower property list and missed multi-line declarations. The audit script's count supersedes it.) Several already have an exact token and are pure substitutions (`0.5rem` → `--space-xs`, `0.25rem` → `--space-2xs`, `1rem` → `--space-md`, `2rem` → `--space-xl`, `4rem` → `--space-3xl`). The rest have no equivalent: `1.25rem` (×5, sits between `--space-md` and `--space-lg`), `0.35rem`, `0.45rem`, `3rem`, and one `5px` — the only px value in the set, which is worth a second look at substitution time.

**Type size** — 5 distinct ramps used 12 times: `clamp(1rem, 1.39vw, 1.25rem)` ×3 and `clamp(0.875rem, 1.11vw, 1rem)` ×3 (both shared between `home` and `Button`), `clamp(1.25rem, 1.67vw, 1.5rem)` ×2 (`home`), `clamp(1.15rem, 1.67vw, 1.5rem)` ×2 (`Button`), `clamp(0.8125rem, 0.97vw, 0.875rem)` ×2 (`home`).

Note the near-collision: `clamp(1.25rem, …)` and `clamp(1.15rem, …)` share an identical upper bound and vw slope, differing only in floor — and they live in different files, so neither author saw the other. Both are kept as separate tokens for the same no-visual-change reason.

**Total mandatory work**: 168 distinct values — colour 36, type size 37, spacing 95 — of which 43 are repeated across 139 uses and 125 are used exactly once. Twelve already have an exact token and are pure substitution; 156 are new definitions, 84 of them one-off fluid ramps that take semantic-tier names (§2). On top of the values: one repeated media query and one repeated animation setup.

The tables above list the repeated values only, because those are the ones that demonstrate drift. The single-use values are equally mandatory and are enumerated in `baseline-audit.txt` section (c) rather than duplicated here.

**The near-misses are smaller than they look (measured 2026-08-25, after substitution)**: the CSS minifier quantises alpha to 8 bits, so several of the pairs this feature carefully kept apart are already identical in shipped output. `--overlay-glass-rim` (`0.04`) and `--overlay-glass-rim-soft` (`0.0375`) both minify to `#ffffff0a` — the same colour, byte for byte, in every build this site has ever shipped. The bevel pair (`0.34`/`0.3375`) and the glow pair (`0.22`/`0.225`) differ by exactly one 8-bit step.

This does not change what this feature does — FR-010 is about not making a decision here, and the tokens stay separate. It does change the follow-up: merging the rim pair is **provably** a zero-change edit, verifiable by resolving the tokens in the built CSS and diffing the declarations. That method is what verified the colour substitution itself (1609 declarations, identical), and it is a stronger check than visual comparison. T034 should use it.

**Three bugs in the audit, all found by using it (2026-08-25)**. Each hid work from the check written to find it, and each was found only because the strict rule forced every value to be accounted for — a threshold rule would have left all three in place:

1. **Spacing keyed on the whole declaration.** `1rem` and `1rem 0` read as unrelated, and a `clamp()` inside a shorthand never matched the same `clamp()` standing alone. Hid 7 repeated values.
2. **Any declaration containing a `var(--…)` was skipped outright for spacing and type size.** So `padding: 0 var(--page-gutter) clamp(4rem, 9vw, 7rem)` — two thirds compliant — reported nothing at all. Hid 6 literals, in exactly the declarations a partial cleanup leaves behind.
3. **Every `--` declaration was skipped.** A component-local custom property holding a raw value is a _private token_, the anti-pattern Principle VII exists to replace, and the check could not see one. Hid 16, including the whole `--float-nav-*` set.

The fixes are in `scripts/audit-design-system.mjs`; category (d) in the report is new. Bug 2 is the instructive one: the more compliant a stylesheet became, the less of it the audit inspected.

**A measurement correction (2026-08-25)**: the spacing figures moved from 15 repeated values to 22. The audit originally keyed spacing on the whole declaration, so `1rem` and `1rem 0` counted as two unrelated things and a `clamp()` inside a shorthand never matched the same `clamp()` standing alone. It now splits shorthands into their individual values. The seven values this uncovered were repeated all along and invisible to the check meant to catch them — which is the strongest evidence in this document that use-count thresholds are fragile in a way that a zero-literals rule is not.

## 3a. Deferred consolidation (the follow-up this work earns)

Every near-duplicate below was kept separate because FR-010 forbids changing what renders. That was the right call while the values were scattered; now that they are all named in one file, someone can decide about them on purpose. `npm run audit:css-diff` makes each decision checkable rather than arguable — it reports whether a proposed merge changes a single rendered declaration.

| Candidate                                                                | Why it is a candidate                                 | Verdict available now                                                                                 |
| ------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--overlay-glass-rim` / `--overlay-glass-rim-soft`                       | `0.04` vs `0.0375`                                    | **Provably free.** Both minify to `#ffffff0a`; they have been the same colour in every shipped build. |
| `--overlay-glass-bevel` / `-soft`                                        | `0.34` vs `0.3375`                                    | Differ by one 8-bit alpha step. Sub-perceptual, not identical.                                        |
| `--overlay-glass-glow` / `-soft`                                         | `0.22` vs `0.225`                                     | Same.                                                                                                 |
| `--font-size-fluid-lg` / `--font-size-control-lg`                        | Same ceiling and slope, floors `1.25rem` vs `1.15rem` | Real below ~900px. A merge is a design decision, not a cleanup.                                       |
| `--space-control-pad-sm` / `--space-control-gap` / `--space-control-pad` | `0.55` / `0.6` / `0.625rem`                           | Three values inside 0.075rem, across unrelated controls. Almost certainly accidental.                 |
| `--work-grid-gap-x` / `--work-detail-meta-gap`                           | Identical values, different reasons                   | Deliberately two tokens. Merge only if the reasons turn out to be one.                                |
| `--gallery-float-pad-tablet` / `--gallery-float-actions-gap-tablet`      | Both `8px`                                            | Same: two decisions that currently agree.                                                             |

## 4. Naming fluid tokens

**Decision**: introduce a parallel fluid scale in `_tokens.scss` — `--font-size-fluid-*` and, where duplicates warrant, `--space-fluid-*` — sitting alongside the fixed scale rather than replacing it. Overlay colours get a `--overlay-*` family named by surface and weight (e.g. `--overlay-light-weak`), not by their numeric alpha, so the name survives a future tuning of the value.

**Rationale**: keeping both scales makes the choice explicit at the call site — a fixed step where the size should not move, a fluid token where it should. Naming overlays by intent rather than by alpha is what lets the value be adjusted later without every call site reading as a lie.

**Alternatives considered**:

- **Replace the fixed scale with fluid equivalents**: rejected — the 22 declarations already using fixed tokens are correct as they are, and changing them would alter rendering.
- **Name overlays `--overlay-04`, `--overlay-30`**: rejected — the number is the value, so the name adds nothing and goes stale the moment the value is tuned.

## 5. The lightbox sub-palette

**Finding**: `WorkProjectGallery.module.scss` holds 7 warm-dark values (`#170707`, `#eadede`, `#8f7e7e`, `#f3e8e8`, `#241010`, `#fff0ee`, `#fff`) for a dark surface, on a site whose tokens describe a light one. It already uses `--color-paper-warm` for one element, so it is partially compliant — the author reached for tokens and found the palette did not cover a dark surface.

**Decision**: name them as a scoped dark surface family in `_tokens.scss` (`--surface-dark-*`, `--on-surface-dark-*`) rather than leaving them inline or forcing them into the light palette's names.

**Rationale**: this is a real design decision — a dark viewing surface for photographs — not an accident. A design system that cannot express it is incomplete. Six of the seven are single-use, which §2's original two-or-more rule would have exempted. That is a good illustration of why the threshold was dropped: they form one coherent, deliberate set, and no use count would ever have revealed that.

## 6. Consolidating the repeated behaviour

**Finding**: four page-level components (`AboutExperience`, `ContactExperience`, `ServiceExperience`, `WorkGalleryClient`) each contain the identical module-scope line `gsap.registerPlugin(useGSAP)`, each import `playOnPageReady`, and each pair it with a `useRef` root and a `useGSAP` call.

**Decision**: extract a single `usePageIntro` hook into the shared library that owns the plugin registration and the page-ready play, and have the four components call it. Registration runs once at the hook's module scope instead of four times.

**Rationale**: `gsap.registerPlugin` is idempotent, so the four copies are harmless today — but they are exactly the "restated in four places" shape Principle VII forbids, and the next page added will copy the pattern a fifth time. The hook makes the correct thing the easy thing.

**Alternatives considered**:

- **Register once in the root layout**: rejected — it would run for every route including ones with no animation, and it hides a client-only concern in a server component.
- **Leave it, since it is idempotent**: rejected — the rule is about where knowledge lives, not about whether the duplicate currently misbehaves.

## 7. `forced-colors` appears twice

**Finding**: `PageShell.module.scss` and `WorkProjectGallery.module.scss` both write `@media (forced-colors: active)` by hand. `_mixins.scss` has `hover-fine`, `touch` and `reduced-motion` but no equivalent for this one.

**Decision**: add a `forced-colors` mixin alongside the existing accessibility mixins and use it in both places.

**Note**: this is not a breakpoint violation — `forced-colors` is an OS accessibility setting, not a viewport width — so FR-005 does not cover it. It qualifies under FR-006, which governs repeated blocks rather than values and so keeps its two-or-more threshold, and it fills an obvious gap in a mixin family that already exists.

## 8. Detecting mirror drift (FR-009, SC-008)

**Finding**: `src/constants/breakpoints.ts` mirrors two of the ten breakpoints in `_breakpoints.scss` and says so in a comment. Nothing verifies the claim; the comment is the only guard.

**Decision**: add a unit test that parses `_breakpoints.scss` at test time and asserts each exported TypeScript constant equals the SCSS value it names.

**Rationale**: the project now has a test suite and a pre-commit gate, so a test is the cheapest place to make a silent failure loud. Reading the `.scss` as text is sufficient — the file is a flat list of `$name: <length>;` declarations, and a regex over it is far less machinery than a Sass build step. The test fails on drift in either direction.

**Alternatives considered**:

- **Generate the TS file from the SCSS at build time**: rejected — it removes the drift but adds a codegen step and a generated file to the repo, for two values.
- **A lint rule**: rejected — no existing ESLint rule reads SCSS, so it would mean authoring a custom plugin.

## 9. Proving nothing changed visually (FR-010, SC-007)

**Decision**: rely on three things in combination — the existing 31-test suite, a full `next build`, and a manual before/after comparison of the affected routes at three widths (mobile, tablet, desktop).

**Rationale**: no visual-regression tooling exists in this project and adding one (Playwright screenshots, Chromatic) is a larger decision than this feature should make on its own — the same argument that kept Playwright out of the Git hooks in feature 009. What makes the manual check tractable here is that every substitution is value-for-value identical by construction: a token is introduced holding exactly the literal it replaces, so a rendering difference would mean a typo, not a design change.

**Alternatives considered**:

- **Adopt visual regression testing first**: rejected as scope. Worth revisiting when a CI pipeline exists — recorded as a follow-up rather than done here.
