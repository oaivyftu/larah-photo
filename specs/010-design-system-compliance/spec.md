# Feature Specification: Design System Compliance

**Feature Branch**: `010-design-system-compliance`

**Created**: 2026-08-25

**Status**: Implemented 2026-08-25 — all 39 tasks, all six quickstart scenarios. `npm run audit:design-system` passes and runs in pre-push.

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

- What about a value used exactly once, that no other screen shares? It makes no difference. A value used once is still a design decision; the design system is where decisions are recorded, and a use count of one only means it has not drifted **yet**. Colour, type size and spacing are treated alike here.
- What about styles that respond to an operating-system accessibility setting rather than to viewport width? These are not breakpoints and are not subject to the breakpoint rule, but if the same query is written in two or more places it falls under FR-006, which governs repeated blocks and behaviour and does still use a two-or-more threshold. Values do not — see FR-001.
- What about shared primitives that nothing currently renders? They stay. A design system is allowed to hold components ahead of their first consumer (constitution Principle VII).
- What if consolidating a repeated pattern would change how a screen looks or behaves? Then it is not a like-for-like consolidation. Visual and behavioural output must be unchanged; anything that would alter output is out of scope for this feature.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every colour, type size and spacing value used in a component stylesheet MUST reference a design-system definition rather than restating the value literally. This holds regardless of how many places use it: a value used exactly once is still a design decision, and a stylesheet is not where design decisions are recorded.
- **FR-002**: Where the design system cannot express a value with a shared, reusable name, it MUST still own the value — under a name describing the element or surface the value serves. Being hard to name generically is not grounds for leaving a value at the point of use.
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

- **SC-001**: No colour value appears literally in a component stylesheet. Every colour resolves through the design system, whether one rule uses it or twenty.
- **SC-002**: No type size appears literally in a component stylesheet, under the same rule as SC-001.
- **SC-003**: No spacing value appears literally in a component stylesheet, under the same rule as SC-001.
- **SC-003a**: Every design-system value is named for what it serves, never for the number it holds. A name that restates its own value is a violation of this criterion even though the value is technically tokenised.
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

  These are counts of **declarations that bypass the token layer**. The next assumption counts **distinct values**, which is the smaller number, since one value can be restated many times. Both are needed: the first says how much of the tree is touched, the second says how many tokens result.

- **The target is zero literals, in all three categories (decided 2026-08-25).** An earlier draft of this spec set the bar at the constitution's two-or-more rule, then at zero for colour only. Both were rejected in favour of the constitution's plain reading: a raw hex or a bare `font-size` is a violation, not a shortcut. A use count of one does not mean a value is not a design decision — it means the decision has not been copied anywhere **yet**, which is the moment before drift, not an exemption from it. The measured scope this creates, from `baseline-audit.txt`:

  | Category  | Distinct values to tokenise | Repeated | Used once |
  | --------- | --------------------------- | -------- | --------- |
  | Colour    | 36                          | 14       | 22        |
  | Type size | 37                          | 7        | 30        |
  | Spacing   | 95                          | 22       | 73        |

  Of those 168, twelve already have an exact token and are pure substitutions. The remaining 156 are new definitions, and 84 of them are fluid `clamp()` ramps used exactly once.

- **The 84 one-off ramps force a naming decision, not a naming problem.** Three rules would otherwise collide: every value is tokenised, every token holds a byte-identical value (FR-010, no visible change), and no token is named for the number it holds (SC-003a). Eighty-four near-identical ramps cannot all be `--space-fluid-lg`, they cannot be merged without changing rendering, and naming them `--space-fluid-37` would satisfy the letter of the first rule while defeating the third. The resolution is that the design system gains a **second naming tier**: alongside the reusable scale, values are named for the element or surface they serve (`--about-intro-pad-y`, `--service-hero-size`). Two ramps that differ only slightly then carry different names honestly, because they genuinely serve different things. See research.md §2 and contracts/token-naming.md.

- Strictness is **not** licence to collapse near-misses. `rgba(255, 255, 255, 0.0375)` and `rgba(255, 255, 255, 0.04)` each get their own token, because FR-010 forbids a visible change. The result will contain near-identical entries; merging them is a separate, deliberate decision taken later with the whole set in view (research.md §3).

- **This scope is larger than the two-or-more rule would have produced** — roughly 168 values rather than 58 — and the difference is concentrated in single-use fluid ramps. That trade was made knowingly: it is the only version of the rule that is mechanically checkable without a judgement call at every call site, and a rule with no judgement calls is one that survives contact with the next contributor.

- Of the fixed type sizes, four exactly match a size the design system already defines and are straightforward substitutions. The three with no equivalent (`0.6875rem`, `0.72rem`, `0.95rem`) get new definitions. Rounding them onto the nearest existing step was considered and is forbidden: it changes rendering, which FR-010 does not allow.

- The project-gallery lightbox carries a coherent warm-dark sub-palette of its own (7 values) for a dark surface, on a site whose tokens describe a light one. It is already partially compliant — it uses `--color-paper-warm` for one element. Six of the seven are used once; under the strict rule they are tokenised like everything else, and as one named set rather than seven unrelated entries.
- No viewport-width rule is currently written out at the point of use — every one already goes through the shared helpers. FR-005 and SC-003b therefore protect an already-clean state rather than describing a repair.
- Two stylesheets contain an identical operating-system accessibility query (`forced-colors`). This is not a breakpoint, so it is not a viewport-width violation, but it is a repeated pattern and so falls under FR-006, which still uses a two-or-more threshold. The zero-literals rule governs **values**; FR-006 governs repeated markup, blocks and behaviour, where a single occurrence genuinely is not yet a shared thing.
- Known repeated patterns at the time of writing: an animation-library registration step repeated in four page-level components, and a page-ready animation helper called from those same four. Both are candidates for consolidation; the audit in this feature may surface others.
- The shared component library keeps its current name and location. Renaming it was considered and deliberately rejected — it would rewrite imports across sixteen files for no functional gain (constitution v2.2.0 Sync Impact Report).
- Because this feature changes no visible output, its safety net is the existing test suite plus direct visual comparison. Screens whose behaviour is not unit-testable are verified by rendering them before and after.
- This specification proposes new work, unlike specs 001–008 which document already-shipped behaviour.
