# Contract: Token Naming and the Compliance Check

This feature's interface is what a contributor writes in a stylesheet and what the project checks afterwards. Fixing both here keeps tasks and implementation consistent.

## Token families

The design system has **two naming tiers**. Both live in `src/styles/`; neither is a component-local custom property, which remains forbidden (Principle VII).

### Scale tier — reusable steps, generic names

For values that genuinely recur across the tree.

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

### Semantic tier — one place, named for what it serves

For the 84 one-off fluid ramps and everything else that belongs to a single element or surface. Named `--<surface>-<element>-<property>`:

| Token                     | Holds                            |
| ------------------------- | -------------------------------- |
| `--about-intro-pad-y`     | `clamp(6rem, 9vw, 10.3rem)`      |
| `--service-hero-size`     | `clamp(2.3rem, 3.15vw, 4rem)`    |
| `--lightbox-caption-size` | `clamp(0.7rem, 0.78vw, 0.85rem)` |

This tier is what makes the zero-literals rule workable: two ramps differing by 0.1rem get two honest names because they serve two different things, rather than one misleading shared name or two numbered ones (research.md §2).

**Choosing a tier**: if a second call site would want the same value for the same reason, it is scale tier. If a second call site wanting that value would be a coincidence, it is semantic tier. When unsure, semantic — promoting a semantic token to the scale later is easy, and demoting a wrongly-shared scale token means finding every call site that relied on it.

## Naming rule

A token is named for the decision it encodes, never for the value it holds. `--overlay-light-weak`, not `--overlay-22`. `--about-intro-pad-y`, not `--space-fluid-37`. A name that restates the number is a name that lies as soon as the number is tuned — and under a zero-literals rule, where numbering is the path of least resistance, this is the rule most likely to be quietly abandoned. Spec SC-003a exists to make abandoning it a visible failure.

## Substitution rule

Every token this feature introduces MUST hold a value **byte-identical** to the literal it replaces.

This is what makes the whole feature safe to review: a rendering difference after substitution means a typo, not a design change. Anything that would look different is a design decision and belongs in a separate change (spec FR-010).

Explicitly forbidden while doing this work:

- Rounding `rgba(0, 0, 0, 0.04)` and `rgba(0, 0, 0, 0.05)` onto one token.
- Collapsing `clamp(1.25rem, 1.67vw, 1.5rem)` and `clamp(1.15rem, 1.67vw, 1.5rem)` because they share two of three arguments.
- "Tidying" a value to the nearest step on the existing scale.

Near-duplicates are recorded in research.md §3 as candidates for a **later**, deliberate consolidation.

This is why the semantic tier exists. Under a zero-literals rule the forbidden list above would otherwise have nowhere to put `clamp(1.25rem, 1.67vw, 1.5rem)` and `clamp(1.15rem, 1.67vw, 1.5rem)`: not merged, not numbered, and not left inline. Named for the two different things they size, the problem dissolves.

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

`npm run audit:design-system` (`scripts/audit-design-system.mjs`) reports:

1. Every colour, type size and spacing literal in `src/**/*.module.scss` that does not resolve through `var(--…)`.
2. Which of those appear **two or more** times — already drifting, so fix first.
3. Which appear once — not drifting yet, and equally not owned by the design system.
4. **Component-local custom properties holding a raw value** — private tokens, reported as kind `local-token`. A local that _references_ a token is fine and is the intended pattern where a value must change at a breakpoint; a local that _holds_ a literal is the thing Principle VII forbids.

**Exit semantics**: non-zero when category 2 or category 3 is non-empty. Both are the same hard rule (spec SC-001–SC-003); the split orders the work, it does not grade it. There is no category of permitted local literal, and no comment that excuses one.

**A declaration is judged value by value.** `padding: 1rem 0` contributes `1rem`, and `padding: 0 var(--page-gutter) clamp(4rem, 9vw, 7rem)` contributes the `clamp()`. Skipping a declaration because it already contains a `var()` means the more compliant a stylesheet becomes, the less of it is inspected.

**Spacing is keyed per value, not per declaration.** `padding: 1rem 0` contributes `1rem`, not the string `"1rem 0"`. The first version of this script keyed on the whole declaration, so `1rem` and `1rem 0` read as unrelated and a `clamp()` inside a shorthand never matched the same `clamp()` standing alone — hiding seven genuinely repeated values from the check meant to find them (research.md §3).

**Written in Node, not shell.** The project already requires Node, so this adds no dependency, and the script has to join multi-line declarations before parsing — every `linear-gradient` and multi-shadow `box-shadow` in this codebase spans several lines, and a line-by-line scan silently misses the continuation lines where most raw `rgba()` values actually live — then split spacing shorthands back apart on top-level whitespace while keeping `clamp()` calls intact. Both are awkward in shell and trivial here.

It is deliberately **not** wired into the Git hooks. The same reasoning as feature 009 §4 applies: this is a periodic audit over the whole tree, not a per-commit gate, and the drift it finds is not introduced by every commit.

## Mirror check

`src/constants/breakpoints.ts` is verified against `src/styles/_breakpoints.scss` by a unit test in the existing Vitest suite, so it runs in pre-commit and pre-push like everything else.

- The test reads the SCSS as text and matches `$breakpoint-<name>: <value>px;`.
- For each exported TypeScript constant, it asserts equality with the SCSS value of the breakpoint its name maps to.
- Only mirrored values are checked. Adding a breakpoint to the SCSS does not oblige the TS file to mirror it; changing one that **is** mirrored does.
