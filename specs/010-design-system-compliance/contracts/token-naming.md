# Contract: Token Naming and the Compliance Check

This feature's interface is what a contributor writes in a stylesheet and what the project checks afterwards. Fixing both here keeps tasks and implementation consistent.

## Token families

| Prefix                | Holds                                | Example                                              |
| --------------------- | ------------------------------------ | ---------------------------------------------------- |
| `--color-*`           | opaque brand colours (existing)      | `--color-ink: #111111`                               |
| `--font-size-*`       | fixed type steps (existing)          | `--font-size-sm: 0.875rem`                           |
| `--font-size-fluid-*` | viewport-responsive type ramps (new) | `--font-size-fluid-md: clamp(1rem, 1.39vw, 1.25rem)` |
| `--space-*`           | fixed spacing steps (existing)       | `--space-lg: 1.5rem`                                 |
| `--space-fluid-*`     | viewport-responsive spacing (new)    | `--space-fluid-lg: clamp(2rem, 4vw, 5rem)`           |
| `--overlay-*`         | translucent scrims and veils (new)   | `--overlay-light-weak: rgba(255, 255, 255, 0.22)`    |
| `--surface-dark*`     | the lightbox dark surface (new)      | `--surface-dark: #170707`                            |
| `--on-surface-dark-*` | text and marks on that surface (new) | `--on-surface-dark-muted: #8f7e7e`                   |

**Naming rule**: a token is named for the decision it encodes, never for the value it holds. `--overlay-light-weak`, not `--overlay-22`. A name that restates the number is a name that lies as soon as the number is tuned.

## Substitution rule

Every token this feature introduces MUST hold a value **byte-identical** to the literal it replaces.

This is what makes the whole feature safe to review: a rendering difference after substitution means a typo, not a design change. Anything that would look different is a design decision and belongs in a separate change (spec FR-010).

Explicitly forbidden while doing this work:

- Rounding `rgba(0, 0, 0, 0.04)` and `rgba(0, 0, 0, 0.05)` onto one token.
- Collapsing `clamp(1.25rem, 1.67vw, 1.5rem)` and `clamp(1.15rem, 1.67vw, 1.5rem)` because they share two of three arguments.
- "Tidying" a value to the nearest step on the existing scale.

Near-duplicates are recorded in research.md §3 as candidates for a **later**, deliberate consolidation.

## Mixins

| Mixin               | Wraps                            | Status   |
| ------------------- | -------------------------------- | -------- |
| `media-min($width)` | `@media (min-width: …)`          | existing |
| `media-max($width)` | `@media (max-width: …)`          | existing |
| `hover-fine`        | fine-pointer hover guard         | existing |
| `touch`             | coarse pointer                   | existing |
| `reduced-motion`    | `prefers-reduced-motion: reduce` | existing |
| `visually-hidden`   | screen-reader-only styling       | existing |
| `forced-colors`     | `forced-colors: active`          | **new**  |

Viewport widths MUST go through `media-min`/`media-max`, which accept a key from the `$breakpoints` map. A hand-written `@media (max-width: …)` is a violation; a hand-written non-width query is only a violation once it appears twice.

## The compliance check

A script, runnable on demand and by a task in this feature, reports:

1. Every colour, type size and spacing literal in `src/**/*.module.scss` that does not resolve through `var(--…)`.
2. Which of those appear **two or more** times — the set that must become tokens.
3. Which appear once **without** an explanatory comment — the set that must either become tokens or gain one.

**Exit semantics**: non-zero when category 2 is non-empty, or when category 3 is non-empty. Category 2 is the hard rule; category 3 is the documentation rule.

It is deliberately **not** wired into the Git hooks. The same reasoning as feature 009 §4 applies: this is a periodic audit over the whole tree, not a per-commit gate, and the drift it finds is not introduced by every commit.

## Mirror check

`src/constants/breakpoints.ts` is verified against `src/styles/_breakpoints.scss` by a unit test in the existing Vitest suite, so it runs in pre-commit and pre-push like everything else.

- The test reads the SCSS as text and matches `$breakpoint-<name>: <value>px;`.
- For each exported TypeScript constant, it asserts equality with the SCSS value of the breakpoint its name maps to.
- Only mirrored values are checked. Adding a breakpoint to the SCSS does not oblige the TS file to mirror it; changing one that **is** mirrored does.
