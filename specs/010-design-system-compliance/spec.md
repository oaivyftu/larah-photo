# Feature Specification: Design System Compliance

**Feature Branch**: `010-design-system-compliance`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "Make the codebase actually comply with constitution Principle VII — src/styles/ as the token layer, src/components/ui/ as the shared component library. Replace values that bypass the token layer, promote anything repeated twice or more into the shared library, and keep the TypeScript breakpoint mirror in sync."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A designer changes a colour once and the whole site follows (Priority: P1)

Someone adjusts a colour, a type size, or a spacing step in the design system and expects every screen using that value to change with it. Today a handful of screens hold their own private copies of those values, so the change silently skips them and the site drifts apart.

**Why this priority**: This is the promise a design system makes. Until the private copies are gone, every other rule in this feature is decoration — the tokens exist but do not actually govern.

**Independent Test**: Change one token value in the design system, rebuild, and confirm every place that visually uses that value changed. No screen keeps the old value.

**Acceptance Scenarios**:

1. **Given** a colour is defined in the design system, **When** a component needs that colour, **Then** it references the shared definition rather than restating the value literally.
2. **Given** a component needs a colour, size, or spacing step the design system does not yet define, **When** it is added, **Then** the new value is added to the design system first and referenced from there — not inlined at the point of use.
3. **Given** a value is changed in the design system, **When** the site is rebuilt, **Then** no screen still renders the previous value.

---

### User Story 2 - The same thing is built once, not copied (Priority: P2)

A contributor needs behaviour or markup that already exists elsewhere in the app. They find one shared version to reuse, rather than discovering two or three near-identical copies and having to guess which is current.

**Why this priority**: Duplication is how the previous divergence happened — a whole form component was copied into a feature folder, drifted, broke, and nobody noticed because the working primitives were somewhere else. Fixing the values (US1) without fixing the copies leaves that failure mode intact.

**Independent Test**: Pick each known repeated pattern, confirm exactly one shared definition exists, and confirm every place that needs it imports that one.

**Acceptance Scenarios**:

1. **Given** the same setup step, markup, or behaviour is needed in two or more places, **When** the codebase is searched, **Then** exactly one shared definition of it exists.
2. **Given** a shared definition exists, **When** any screen needs that behaviour, **Then** it uses the shared version rather than restating it locally.
3. **Given** a contributor is about to build something, **When** they check the shared library first, **Then** what is already available is discoverable by looking in one known place.

---

### User Story 3 - Values that must exist in two languages cannot drift apart (Priority: P3)

A few values — the breakpoint scale in particular — have to be readable both by stylesheets and by interaction code. Someone changing a breakpoint expects both readers to agree afterwards.

**Why this priority**: A smaller surface than US1/US2 (a handful of values), but it fails silently and in a way that is hard to see: layout and behaviour disagree only at specific viewport widths.

**Independent Test**: Change a breakpoint in the design system and confirm the other copy is either updated with it or fails a check that says it was not.

**Acceptance Scenarios**:

1. **Given** a value exists in both the stylesheet layer and the interaction-code layer, **When** either copy is read, **Then** the stylesheet is identifiable as the authority and the other as a declared mirror.
2. **Given** the authoritative value changes, **When** the mirror is not updated to match, **Then** the discrepancy is detectable rather than silently shipped.

---

### Edge Cases

- What about a value used exactly once, that no other screen shares? It still comes from the design system if a suitable token exists; a genuinely one-off value may stay local, but must be commented with why it is not a token.
- What about styles that respond to an operating-system accessibility setting rather than to viewport width? These are not breakpoints and are not subject to the breakpoint rule, but if the same query is written in two or more places it falls under the two-or-more rule like anything else.
- What about shared primitives that nothing currently renders? They stay. A design system is allowed to hold components ahead of their first consumer (constitution Principle VII).
- What if consolidating a repeated pattern would change how a screen looks or behaves? Then it is not a like-for-like consolidation. Visual and behavioural output must be unchanged; anything that would alter output is out of scope for this feature.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every colour used in a component stylesheet MUST reference a design-system colour definition rather than restating the value literally.
- **FR-002**: Every type size used in a component stylesheet MUST reference a design-system type-size definition.
- **FR-003**: Where a component needs a value the design system does not define, the value MUST be added to the design system and then referenced. Inlining it at the point of use is not an acceptable outcome.
- **FR-004**: Where a needed value differs only marginally from an existing design-system value, the existing value MUST be used instead of introducing a near-duplicate, unless the difference is deliberate and documented.
- **FR-005**: Every viewport-width rule MUST be expressed through the design system's shared width helpers rather than written out at the point of use.
- **FR-006**: Any markup, style block, or behaviour required in two or more places MUST exist as exactly one shared definition, with every place that needs it referring to that definition.
- **FR-007**: Shared component definitions MUST live in the single known shared component location, and shared values in the single known design-system location, so that a contributor checking "does this already exist?" has one place to look.
- **FR-008**: Where a value must be readable by both stylesheets and interaction code, one copy MUST be identified as authoritative and the other explicitly marked as a mirror of it.
- **FR-009**: A mismatch between an authoritative value and its mirror MUST be detectable before it ships, rather than only surfacing as a visual defect.
- **FR-010**: The visible output of the site MUST be unchanged by this work. This feature reorganises where values and components are defined; it does not alter what any screen renders.
- **FR-011**: Shared primitives with no current consumer MUST be retained.

### Key Entities

- **Design token**: A named value (colour, type size, line height, spacing, layout dimension, breakpoint) defined once in the design system and referenced by name everywhere it is used.
- **Shared component**: A UI building block defined once in the shared component library and composed by feature areas, never reimplemented by them.
- **Mirror**: A copy of an authoritative design-system value expressed in a second language because the two cannot share one definition directly. Carries an explicit note naming what it mirrors.
- **Drift**: Any place where a value or component has a private copy instead of referring to the shared definition — the condition this feature removes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: No colour value appears literally in more than one place. Every colour used by two or more rules resolves through the design system, and any literal that remains is provably used once.
- **SC-002**: No type size appears literally in more than one place, under the same rule as SC-001.
- **SC-003**: No spacing value appears literally in more than one place, under the same rule as SC-001.
- **SC-003a**: Every remaining single-use literal carries a comment saying why it is not a token, so the next reader can tell a deliberate exception from an oversight.
- **SC-003b**: Zero viewport-width rules are written out at the point of use.
- **SC-004**: Every pattern identified as appearing in two or more places has exactly one definition afterwards, and the number of places restating it locally is zero.
- **SC-005**: Changing any single design-system value updates every screen that uses it, verified on at least one colour and one type size.
- **SC-006**: A contributor can determine whether a given UI element already exists by checking one location, without searching feature folders.
- **SC-007**: The site renders identically before and after this work — same layout, same colours, same behaviour at every breakpoint.
- **SC-008**: A change to an authoritative value whose mirror was not updated is caught before it reaches a shared branch.

## Assumptions

- **Corrected baseline, re-measured 2026-08-25.** An earlier count in this spec's first draft said 8 colours and 9 type sizes. That count was taken with a search that only matched literal numbers, and it missed every fluid `clamp()` value and every `rgba()`. The real starting point, across 24 component stylesheets totalling ~4,400 lines, is:

  | Category  | Bypasses the design system | Uses it |
  | --------- | -------------------------- | ------- |
  | Colour    | 58 (8 hex, 50 rgba)        | —       |
  | Type size | 47 (38 fluid, 9 fixed)     | 22      |
  | Spacing   | 133                        | 17      |

  The design system is therefore the minority convention today, not the norm with a few exceptions. This changes the feature's shape: see the next assumption.

- Because most declarations bypass the token layer, "zero literals anywhere" is not the target. Two thirds of the type sizes are fluid `clamp()` ramps that the current fixed-step scale cannot express, and minting one token per unique ramp would turn the design system into a lookup table rather than a set of decisions. The target is instead the constitution's own two-or-more rule: **anything used twice or more becomes a token; a genuinely single-use value may stay local if it says why.** Measured duplicates that this makes mandatory: 10 distinct colour values used 28 times between them, and 5 distinct fluid type ramps used 12 times between them.

- Of the 9 fixed type sizes, five exactly match a size the design system already defines and are straightforward substitutions. Four (0.6875rem, 0.72rem twice, 0.95rem) have no equivalent and need either a new definition or a deliberate decision to round to the nearest existing one.

- The project-gallery lightbox carries a coherent warm-dark sub-palette of its own (7 values) for a dark surface, on a site whose tokens describe a light one. It is already partially compliant — it uses `--color-paper-warm` for one element — which suggests the sub-palette wants naming, not deleting.
- No viewport-width rule is currently written out at the point of use — every one already goes through the shared helpers. FR-005 and SC-003 therefore protect an already-clean state rather than describing a repair.
- Two stylesheets contain an identical operating-system accessibility query (`forced-colors`). This is not a breakpoint, so it is not a viewport-width violation, but it does appear twice and therefore falls under the two-or-more rule.
- Known repeated patterns at the time of writing: an animation-library registration step repeated in four page-level components, and a page-ready animation helper called from those same four. Both are candidates for consolidation; the audit in this feature may surface others.
- The shared component library keeps its current name and location. Renaming it was considered and deliberately rejected — it would rewrite imports across sixteen files for no functional gain (constitution v2.2.0 Sync Impact Report).
- Because this feature changes no visible output, its safety net is the existing test suite plus direct visual comparison. Screens whose behaviour is not unit-testable are verified by rendering them before and after.
- This specification proposes new work, unlike specs 001–008 which document already-shipped behaviour.
