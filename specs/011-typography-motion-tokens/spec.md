# Feature Specification: Typography and Motion Tokens

**Feature Branch**: `011-typography-motion-tokens`

**Created**: 2026-08-25

**Status**: Implemented 2026-08-25 — all 31 tasks, all six quickstart scenarios. All nine audit categories report zero.

**Input**: User description: "Extend the design system's zero-literal rule from feature 010 to the four value categories it left out: line height, font weight, letter spacing, and motion (transition/animation duration and easing curve). The audit script must be extended to cover these categories so the rule is enforced by the existing pre-push gate rather than by good intentions."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The type rhythm changes in one place (Priority: P1)

Someone adjusts how tightly the site's text sits — its line height, its weight, its tracking — and expects every screen to follow. Today almost none of it does. The design system already defines four line heights and 15 of the 18 stylesheets that set one ignore them, writing the number instead.

**Why this priority**: This is the same failure feature 010 fixed for colour, type size and spacing, sitting untouched in the next category along. It is also the clearest evidence available that a design system is only as good as the check behind it: the line-height tokens have existed the whole time, unused, because nothing ever looked.

Line height is singled out because it is the value most likely to drift **away from the size it belongs to**. A size and its leading are one decision made together and then written on two lines, and only one of those lines is currently governed. Fifty blocks in this codebase set both; twenty set a size and leave the leading to be inherited from somewhere else.

**Independent Test**: Change one line-height, font-weight or letter-spacing definition in the design system, rebuild, and confirm every screen that visually used that value changed with it. No screen keeps the old value.

**Acceptance Scenarios**:

1. **Given** the design system defines a line height, **When** a component needs that line height, **Then** it references the shared definition rather than restating the number.
2. **Given** a component needs a weight or tracking the design system does not yet define, **When** it is added, **Then** the value is added to the design system first and referenced from there.
3. **Given** a typography value is changed in the design system, **When** the site is rebuilt, **Then** no screen still renders the previous value.
4. **Given** an element's size and its line height are one decision, **When** both are defined, **Then** their names identify them as belonging to the same element, so a reader changing one can see the other.

---

### User Story 2 - Motion speaks one vocabulary (Priority: P2)

Someone tuning how the site moves — making it feel quicker, or softening how things settle — expects to find the vocabulary in one place. Today there are 23 different durations between 90ms and 1.8s scattered across eleven stylesheets, and five easing curves that together read like a deliberate motion language nobody ever wrote down.

**Why this priority**: Smaller than US1 in count but the one carrying an actual design decision. The five curves are coherent and want naming. The 23 durations are not a scale — they are variation nobody chose, and naming them is what makes that visible enough to decide about later.

**Independent Test**: Change one duration or easing definition, rebuild, and confirm every transition that used it changes together.

**Acceptance Scenarios**:

1. **Given** a transition or animation needs a duration, **When** it is written, **Then** it references a design-system duration rather than stating a number.
2. **Given** a transition needs an easing curve, **When** it is written, **Then** it references one of the design system's named curves.
3. **Given** two elements are meant to move at the same speed, **When** the design system's duration for that speed changes, **Then** both change together.

---

### User Story 3 - A category cannot be quietly left out again (Priority: P3)

A contributor reads that the design system governs the values in this codebase and finds that it does — not for three property groups out of seven, but for everything the rule claims to cover. What the check inspects is written down, so a category cannot fall outside it unnoticed.

**Why this priority**: This is the story that stops the work being redone. The four categories in this feature drifted for one reason: the audit's property list was implicit, so "the audit passes" and "the design system governs" quietly stopped meaning the same thing. Whatever this feature excludes, it must exclude on the record.

**Independent Test**: Read the check's declared coverage; compare it against the categories the rule names. Every category the rule covers is inspected, and every property deliberately left out is listed with a reason.

**Acceptance Scenarios**:

1. **Given** the compliance check runs, **When** it reports success, **Then** that success covers every value category the design-system rule names.
2. **Given** a property group is deliberately outside the rule, **When** a contributor asks why, **Then** the exclusion and its reason are recorded rather than implied by absence.
3. **Given** someone writes a new literal in a covered category, **When** they push, **Then** the existing gate stops it.

---

### Edge Cases

- What about `letter-spacing: 0`, `font-weight: normal`, `line-height: inherit`, `animation-duration: 0s`? These are keywords or resets, not design decisions — they state the absence of a value rather than a choice of one. They are not literals for this feature's purposes.
- What about a duration inside a reduced-motion override that deliberately sets movement to zero? Same answer: zero is the absence of motion, not a speed.
- What about `font-weight: 650`, which is neither a standard step nor used more than four times? It is tokenised like anything else. Whether it should exist at all is a design question recorded for later, not settled by inlining it.
- What about values that differ by an amount no one could see — three line heights within 0.02 of each other? Each becomes its own token. Merging them changes rendering, which this feature does not do; the cluster is recorded as a consolidation candidate instead.
- What about properties this feature does not cover — corner radius, stacking order, element dimensions, opacity? They stay as they are, and the exclusion is written down (see Assumptions) so the next reader can tell a decision from an oversight.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every line height, font weight and letter spacing used in a component stylesheet MUST reference a design-system definition rather than restating the value. This holds regardless of how many places use it, on the same reasoning as feature 010: a use count of one means a decision has not been copied anywhere yet, not that it is not a decision.
- **FR-002**: Every transition and animation duration, and every easing curve, MUST reference a design-system definition.
- **FR-003**: Where the design system already defines a value, the existing definition MUST be used. Introducing a second definition holding a value the system already names is a violation, not a convenience.
- **FR-003a**: Where a size and its line height belong to the same element, their definitions MUST be named so that the pairing is visible — the same element name, differing only in which property each governs. A reader changing one must be able to see the other without searching.
- **FR-004**: Where the design system cannot express a value with a shared, reusable name, it MUST still own the value — under a name describing the element or surface the value serves. Being hard to name generically is not grounds for leaving a value at the point of use.
- **FR-005**: Every definition introduced MUST hold a value identical to the literal it replaces. This feature changes where values are defined; it does not change what any screen renders or how fast anything moves.
- **FR-006**: Near-identical values MUST be kept distinct rather than merged. Consolidating them is a separate, deliberate decision and MUST be recorded as such rather than performed here.
- **FR-007**: Every definition MUST be named for what it serves, never for the value it holds.
- **FR-008**: The compliance check MUST inspect every category the rule covers, and MUST state which property groups it deliberately does not, so that a passing check and a governed design system mean the same thing.
- **FR-009**: A newly introduced literal in a covered category MUST be caught before it reaches a shared branch, by the gate that already exists.
- **FR-010**: Keywords and resets that state the absence of a value MUST NOT be treated as literals.

### Key Entities

- **Design token**: A named value defined once in the design system and referenced by name everywhere it is used. Feature 010 established two tiers — a scale tier for values that genuinely recur, and a semantic tier named for the element served — and this feature uses both unchanged.
- **Coverage declaration**: The written statement of which property groups the compliance check inspects and which it deliberately does not. New in this feature, and the thing that makes FR-008 checkable rather than aspirational.
- **Consolidation candidate**: A pair or cluster of near-identical values kept apart here, recorded so someone can decide about them on purpose later with the whole set in view.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: No line height appears literally in a component stylesheet. Baseline: 48 literals across 17 distinct values in 15 files.
- **SC-002**: No font weight appears literally in a component stylesheet. Baseline: 53 literals across 6 distinct values in 18 files.
- **SC-003**: No letter spacing appears literally in a component stylesheet. Baseline: 17 literals across 8 distinct values in 12 files.
- **SC-004**: No transition or animation duration appears literally in a component stylesheet. Baseline: 57 literals across 23 distinct values in 12 files.
- **SC-005**: No easing curve appears literally in a component stylesheet. Baseline: 14 literals across 5 distinct curves in 6 files.
- **SC-006**: The 14 declarations that currently write a number the design system already names resolve through that existing name, and no second definition holding the same value is introduced.
- **SC-007**: Every definition introduced is named for what it serves. A name that restates its own value fails this criterion even though the literal is gone.
- **SC-007a**: For every element whose size and line height are both defined, the two names differ only in the property they govern, so the pair reads as a pair.
- **SC-008**: The compliance check's coverage is stated in writing, and every category named by SC-001 to SC-005 is inspected by it.
- **SC-009**: The site renders identically before and after this work, and every transition runs for the same length of time on the same curve.
- **SC-010**: A literal reintroduced in any covered category fails the existing pre-push gate.

## Assumptions

- **Measured baseline, 2026-08-25, corrected during implementation.** 189 literals across 59 distinct values, in the five categories this feature covers. The first count of this table read `53 / 21` for duration; the check, once extended, found two more in longhand `transition-duration` and `animation-duration` declarations the counting script never looked at. The correction is this feature's own subject arriving one level up, and is recorded in research.md §8:

  | Category       | Literals | Distinct | Files | Using a token today |
  | -------------- | -------- | -------- | ----- | ------------------- |
  | Line height    | 48       | 17       | 15    | 2                   |
  | Font weight    | 53       | 6        | 18    | 0                   |
  | Letter spacing | 17       | 8        | 12    | 0                   |
  | Duration       | 56       | 23       | 11    | 0                   |
  | Easing         | 14       | 5        | 6     | 0                   |

- **The line-height case is drift, not a gap.** `--line-height-tight` (1), `--line-height-heading` (1.05), `--line-height-copy` (1.18) and `--line-height-body` (1.4) already exist. Fourteen declarations write `1`, `1.4` or `1.05` instead of the name. Those are pure substitution and need no new definition. The other 14 distinct values do, and several — `1.14`, `1.15`, `1.16`, `1.2`, `1.22` — cluster close enough to `1.18` that some of the variation is probably accidental. Collapsing them would change rendering, so each becomes its own definition and the cluster is recorded for later.

- **Font weight is the easiest category and the smallest decision.** Six distinct values (400, 500, 600, 650, 700, 800) across 53 declarations. Five are standard steps; `650` is used four times and is worth a second look, but not here — FR-005 does not permit rounding it to 600 or 700, because that changes rendering.

- **Duration is the category with a real problem underneath it.** Twenty-three distinct durations between 90ms and 1.8s is not a scale; it is what happens when each transition is tuned in isolation. This feature names them, byte for byte, which is the most it can do without changing how the site feels. Naming them is also what makes the problem visible: 23 entries in one file argue for consolidation far better than 23 numbers scattered across eleven.

- **Easing is the opposite: a coherent set that was simply never written down.** Five curves, one of them used six times. This is a motion language, and naming it costs nothing and settles it.

- **Composite text styles were considered and rejected, on measurement.** The stronger version of FR-003a is a single definition holding size, leading, tracking and weight together — the pattern that stops the four drifting apart at all. It does not fit this codebase yet. Across the 50 blocks that set both a size and a leading there are **49 distinct combinations of the four properties**, and exactly one recurs, twice. A composite style presupposes a small set of text treatments; this site has close to one treatment per place. Building them anyway would produce 49 definitions each used once — not a type scale but a dictionary, which is the failure FR-007 exists to prevent.

  Composite styles are therefore the **goal state, reachable only after those 49 treatments are consolidated into a small set**, and that consolidation changes rendering, which FR-005 does not permit here. FR-003a is the part available now: name the pair so it reads as a pair. The composite version is recorded as what consolidation would unlock, not as something declined for convenience.

- **The motion values held in interaction code are deliberately out of scope, and this is the boundary most likely to be regretted.** This feature governs motion written in stylesheets. The animation code holds 39 more: 14 durations across 10 distinct values, 13 staggers across 7, and 12 easing references across 3, in 5 files. Two consequences follow and are accepted knowingly.

  First, the motion vocabulary stays in two places under two rules — stylesheet durations named and governed, animation durations not. The units differ too (seconds in the animation code, milliseconds in stylesheets), so unifying them later is a translation rather than a rename.

  Second, and more concretely: the page-heading reveal is stated **byte-identically in four separate files** — all seven of its properties, including its duration, its stagger and its easing. That is the same duplication feature 010 removed elsewhere, and it is not a token substitution but a shared-behaviour consolidation of the kind FR-006 in that feature covers. It survived 010 because the check only ever read stylesheets. It survives this feature too, on purpose, and is named here so the next reader finds it recorded rather than rediscovers it.

- **Deliberately out of scope, and recorded here so the boundary is a decision rather than an omission**: corner radius (13 literals, 9 distinct), stacking order (13 / 10), element dimensions — width, height, min/max (94 / 81), outline offset (12 / 6), and opacity (24 / 10). Two different reasons apply. Dimensions and opacity are mostly layout arithmetic and one-off visual states rather than shared design decisions, and a rule covering them would generate noise faster than value. Corner radius and stacking order are genuine token families in most design systems and are excluded only to keep this feature's scope honest — they are the obvious candidates for a follow-up, and this spec says so rather than leaving the next reader to rediscover them.

- **The two naming tiers from feature 010 carry over unchanged** (`contracts/token-naming.md` in `specs/010-design-system-compliance/`). Scale tier where a value genuinely recurs; semantic tier, named for the element served, where a second call site wanting the same value would be coincidence. Two definitions holding the same value are correct when they encode two decisions — but not when the design system already names the value, which is what FR-003 and SC-006 exist to prevent.

- **Verification is mechanical, not visual.** Feature 010 established a comparison that resolves every custom property on both sides and diffs all ~1600 rendered declarations. It caught three classes of difference during that work and is what makes a claim of "nothing changed" checkable. This feature uses it, and it covers durations and curves as readily as colours.

- **The gate already exists, and now runs earlier.** Feature 010 put the compliance check into pre-push. It also runs in pre-commit as of this feature, so a violation is reported at the commit that introduced it rather than at the end of a session's work. Extending what the check covers therefore extends what the gate enforces, with no new hook and no new decision about hooks.

- **A dedicated stylesheet linter was considered and rejected.** Reporting token violations in the editor as they are typed is genuinely more useful than reporting them at commit, and a standard linter would do it. It does not clear the constitution's bar that a new dependency solve a problem the stack does not already solve. More importantly, the off-the-shelf rule for this — reject any literal in a named set of properties — cannot express the three checks that actually found defects in this codebase: splitting a shorthand into its individual values, detecting a component-local variable holding a literal, and reading a declaration that mixes a shared value with a literal. Adopting it would put a second, weaker checker beside the existing one, giving one rule two sources of truth. That is the precise failure this work exists to remove. Moving the existing check one step earlier was taken instead, at no cost.

- **This specification proposes new work**, like feature 010 and unlike specs 001–008, which document already-shipped behaviour.
