# Phase 0 Research: Design System Compliance

## 1. Why the token layer is the minority convention

**Finding**: Across 24 component stylesheets (~4,400 lines), 58 colour values, 47 type sizes and 133 spacing values bypass the token layer, against 22 type sizes and 17 spacing values that use it. The design system was authored, then largely not adopted.

**Root cause, not carelessness**: the token scale is a set of fixed rem steps (`--font-size-xs` … `--font-size-2xl`, `--space-2xs` … `--space-4xl`). The app's actual visual language is **fluid** — 38 of the 47 type sizes are `clamp()` ramps, and most spacing is `clamp()` too. A fixed scale cannot express `clamp(0.875rem, 1.11vw, 1rem)`, so authors wrote it inline. The single exception already in the token file, `--font-size-marquee: clamp(3rem, 4.45vw, 4rem)`, shows the intended shape was known but never generalised.

**Implication**: this is a design-system gap to close, not only a cleanup to perform. Any plan that only substitutes existing tokens leaves ~80% of the drift untouched.

## 2. What "compliant" should mean here

**Decision**: enforce the constitution's own two-or-more rule rather than a blanket zero-literals target.

- A value used in **two or more** places MUST become a token. It has proven it is a shared decision.
- A value used **once** MAY stay local, but MUST carry a comment saying why it is not a token.

**Rationale**: minting one token per unique `clamp()` ramp would produce ~40 single-use tokens. That is a lookup table, not a design system — it moves the literals without making any of them a decision, and it makes the token file harder to read than the stylesheets it serves. The two-or-more rule is already what Principle VII says, it is mechanically checkable, and it targets exactly the values that can drift apart.

**Alternatives considered**:

- **Zero literals anywhere**: rejected per above. It also collides with FR-010 (no visual change), since collapsing distinct fluid ramps onto shared tokens would alter rendered sizes at intermediate viewports.
- **Convert fluid ramps to fixed steps**: rejected outright — it changes what every screen renders between breakpoints, which FR-010 forbids.

## 3. The measured duplicates (the mandatory work)

**Colour** — 10 distinct values used 28 times:

| Value                       | Uses | Reading                          |
| --------------------------- | ---- | -------------------------------- |
| `rgba(255, 255, 255, 0.04)` | 5    | faintest light veil on dark      |
| `rgba(255, 255, 255, 0.3)`  | 4    | light scrim                      |
| `rgba(255, 255, 255, 0.34)` | 3    | light scrim, slightly stronger   |
| `rgba(255, 255, 255, 0.22)` | 3    | light scrim, weaker              |
| `rgba(0, 0, 0, 0.03)`       | 3    | faintest dark veil on light      |
| `rgba(255, 255, 255, 0.11)` | 2    | light veil                       |
| `rgba(12, 12, 12, 0.3)`     | 2    | dark scrim (near-ink, not black) |
| `rgba(0, 0, 0, 0.075)`      | 2    | dark veil                        |
| `rgba(0, 0, 0, 0.05)`       | 2    | dark veil                        |
| `rgba(0, 0, 0, 0.04)`       | 2    | dark veil                        |

These are overlays — scrims and veils over photography — which is why they are alpha values rather than named hues. The 0.22/0.30/0.34 cluster and the 0.03/0.04/0.05/0.075 cluster are close enough that some are probably accidental variation, but **collapsing them would change rendering**, so each becomes its own token and any consolidation is a separate, deliberate decision later.

**Type size** — 5 distinct ramps used 12 times: `clamp(1rem, 1.39vw, 1.25rem)` ×3, `clamp(0.875rem, 1.11vw, 1rem)` ×3, `clamp(1.25rem, 1.67vw, 1.5rem)` ×2, `clamp(1.15rem, 1.67vw, 1.5rem)` ×2, `clamp(0.8125rem, 0.97vw, 0.875rem)` ×2.

Note the near-collision: `clamp(1.25rem, …)` and `clamp(1.15rem, …)` share an identical upper bound and vw slope, differing only in floor. Both are kept as separate tokens for the same no-visual-change reason.

## 4. Naming fluid tokens

**Decision**: introduce a parallel fluid scale in `_tokens.scss` — `--font-size-fluid-*` and, where duplicates warrant, `--space-fluid-*` — sitting alongside the fixed scale rather than replacing it. Overlay colours get a `--overlay-*` family named by surface and weight (e.g. `--overlay-light-weak`), not by their numeric alpha, so the name survives a future tuning of the value.

**Rationale**: keeping both scales makes the choice explicit at the call site — a fixed step where the size should not move, a fluid token where it should. Naming overlays by intent rather than by alpha is what lets the value be adjusted later without every call site reading as a lie.

**Alternatives considered**:

- **Replace the fixed scale with fluid equivalents**: rejected — the 22 declarations already using fixed tokens are correct as they are, and changing them would alter rendering.
- **Name overlays `--overlay-04`, `--overlay-30`**: rejected — the number is the value, so the name adds nothing and goes stale the moment the value is tuned.

## 5. The lightbox sub-palette

**Finding**: `WorkProjectGallery.module.scss` holds 7 warm-dark values (`#170707`, `#eadede`, `#8f7e7e`, `#f3e8e8`, `#241010`, `#fff0ee`, `#fff`) for a dark surface, on a site whose tokens describe a light one. It already uses `--color-paper-warm` for one element, so it is partially compliant — the author reached for tokens and found the palette did not cover a dark surface.

**Decision**: name them as a scoped dark surface family in `_tokens.scss` (`--surface-dark-*`, `--on-surface-dark-*`) rather than leaving them inline or forcing them into the light palette's names.

**Rationale**: this is a real design decision — a dark viewing surface for photographs — not an accident. A design system that cannot express it is incomplete. Six of the seven are single-use and so are technically exempt under §2, but they form one coherent set, and naming a set is worth more than exempting each member of it individually.

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

**Note**: this is not a breakpoint violation — `forced-colors` is an OS accessibility setting, not a viewport width — so FR-005 does not cover it. It qualifies purely under the two-or-more rule, and it fills an obvious gap in a mixin family that already exists.

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
