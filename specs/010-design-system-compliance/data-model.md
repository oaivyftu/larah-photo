# Phase 1 Data Model: Design System Compliance

No runtime domain data. The "entities" are the design-system artifacts this feature introduces or changes.

## Fixed token (existing, unchanged)

- **Where**: `src/styles/_tokens.scss`, under `:root`.
- **Shape**: `--font-size-sm: 0.875rem;` — a CSS custom property holding one constant value.
- **Rule**: use where the value must not respond to viewport width. The 22 declarations already consuming these stay exactly as they are.

## Fluid token (new)

- **Where**: `src/styles/_tokens.scss`, in a `/* Typography — fluid */` block beneath the fixed scale.
- **Shape**: `--font-size-fluid-md: clamp(1rem, 1.39vw, 1.25rem);`
- **Naming**: `--font-size-fluid-<step>` and `--space-fluid-<step>`, stepped by relative size, not by the numbers inside the ramp.
- **Validation rule**: a fluid token MUST be introduced holding **byte-identical** `clamp()` arguments to the literal it replaces. Two ramps that differ in any argument are two tokens, however close they look — collapsing them changes rendering and violates FR-010.
- **Seeded by**: the 5 ramps measured at 2 or more uses (research.md §3).

## Overlay token (new)

- **Where**: `src/styles/_tokens.scss`, in an `/* Overlays */` block.
- **Shape**: `--overlay-light-weak: rgba(255, 255, 255, 0.22);`
- **Naming**: `--overlay-<light|dark>-<weight>`, by surface and intent. Never by alpha — the number is the value, so encoding it in the name makes the name go stale the moment the value is tuned.
- **Validation rule**: identical alpha values MUST NOT be merged across surfaces, and near-identical alphas MUST NOT be rounded together. Both change rendering.
- **Seeded by**: the 10 values measured at 2 or more uses (research.md §3).

## Dark surface token (new)

- **Where**: `src/styles/_tokens.scss`, in a `/* Dark surface — project lightbox */` block.
- **Shape**: `--surface-dark: #170707;`, `--on-surface-dark-muted: #8f7e7e;`
- **Scope**: names the project-gallery lightbox's warm-dark palette. Consumed only by that surface today; available to any future dark surface.
- **Note**: six of the seven are single-use and technically exempt under the two-or-more rule, but they form one coherent set and are named as a set (research.md §5).

## Accessibility mixin (extended)

- **Where**: `src/styles/_mixins.scss`, alongside `hover-fine`, `touch`, `reduced-motion`.
- **New member**: `forced-colors`, wrapping `@media (forced-colors: active)`.
- **Consumers**: `PageShell.module.scss`, `WorkProjectGallery.module.scss`.

## Shared page-intro hook (new)

- **Where**: `src/components/ui/` (shared library, per Principle VII).
- **Owns**: the module-scope `gsap.registerPlugin(useGSAP)` call, and the `playOnPageReady` pairing that four page-level components currently each restate.
- **Consumers**: `AboutExperience`, `ContactExperience`, `ServiceExperience`, `WorkGalleryClient`.
- **Validation rule**: after this lands, `gsap.registerPlugin(useGSAP)` MUST appear exactly once in `src/`.

## Declared mirror (existing, now verified)

- **Authority**: `src/styles/_breakpoints.scss`.
- **Mirror**: `src/constants/breakpoints.ts`, currently mirroring 2 of the 10 breakpoints.
- **Rule**: the mirror names what it mirrors in a comment, and a test asserts each mirrored constant equals its SCSS counterpart. Partial mirroring is fine — only the values that are mirrored are checked.

## Local literal (the permitted exception)

- **Definition**: a value used exactly once, left in the stylesheet that uses it.
- **Rule**: permitted, but MUST carry a comment saying why it is not a token, so a later reader can distinguish a deliberate exception from drift (spec SC-003a).
