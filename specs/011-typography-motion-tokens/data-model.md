# Phase 1 Data Model: Typography and Motion Tokens

Feature 010's two tiers carry over unchanged and are not restated here — see `specs/010-design-system-compliance/contracts/token-naming.md`. What follows is what this feature adds.

## Line height (`--line-height-*`)

- **Authority**: `src/styles/_tokens.scss`. The family already exists.
- **Existing members**: `tight` (1), `heading` (1.05), `copy` (1.18), `body` (1.4).
- **Added**: `control` (1.2), `compact` (1.25), `loose` (1.35).
- **Note**: `tight` and `copy` currently have zero consumers. `tight` gains eleven; `copy` gains none, because no literal in the tree matches it. It is retained under feature 010's FR-011 and recorded as a consolidation candidate (research.md §6).
- **Pairing rule**: where an element has both a size token and a one-off leading, the leading takes the same element name with `-leading` replacing `-size` — `--gallery-title-size` / `--gallery-title-leading` (spec FR-003a).

## Letter spacing (`--tracking-*`)

- **New family.**
- **Scale members**: `label` (0.08em, uppercase eyebrows and labels), `display` (-0.02em, large text).
- **Semantic member**: `glass-label` (0.02em) — the cursor readout and the gallery float label, which are one control at two sizes. Named to match the existing `--font-size-glass-label` rather than as a general width step.
- **Five one-off values** take semantic names for the element they track.

## Font weight (`--font-weight-*`)

- **New family.**
- **Members**: `regular` (400), `semibold` (600), `medium` (500), `bold` (700), `extrabold` (800), plus the non-standard `650`, named at implementation for the role it plays at its three call sites.
- **Rule**: `650` is not rounded onto 600 or 700. Doing so changes rendering, which spec FR-005 forbids. Recorded as a consolidation candidate.

## Duration (`--duration-*`)

- **New family**, 21 members.
- **Tier rule**: scale tier when a value appears in unrelated components — `180ms` in `Button`, `MainNav` and the gallery is one decision about small UI feedback. Semantic tier when it recurs only inside one component — `250ms` four times in `GlassPointer` is that component's speed.
- **Zero is not a duration.** `0s` and `0ms` state the absence of motion, usually inside a reduced-motion override, and are not literals for this feature (spec FR-010).
- **Note**: 21 tokens for 21 durations is the largest concentration of near-identical values in the codebase. Naming them is the point — it puts the case for consolidating them in one place (research.md §6).

## Easing (`--ease-*`)

- **New family**, 5 members, named for the motion each describes rather than its control points.
- **Rule**: every `cubic-bezier()` in a stylesheet resolves through one of these. A curve written inline is a violation regardless of use count.

## Coverage declaration

- **Definition**: the written statement of which property groups the compliance check inspects, and which it deliberately does not, with the reason.
- **Lives in**: `scripts/audit-design-system.mjs`, and is printed in the audit's own output so a passing run states what it is claiming.
- **Enforced by**: a unit test asserting the declaration matches the property groups the script actually scans, so the two cannot drift — the same failure mode that produced this feature.
- **Rule**: a property group may be excluded, but not silently. An exclusion with no recorded reason is a defect in the declaration.
- **Why it is an entity rather than a comment**: feature 010's coverage lived only inside its regexes. That is exactly what let four categories sit outside the rule while the check reported success. A declaration nothing verifies is the same thing with better manners.
