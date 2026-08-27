# Contract: Naming and Check Semantics for These Categories

Feature 010's contract governs the two tiers, the byte-identical substitution rule, and the mixin list. It is not restated here — read `specs/010-design-system-compliance/contracts/token-naming.md` first. This document fixes what is new.

## Token families

| Prefix            | Holds                               | Example                                         |
| ----------------- | ----------------------------------- | ----------------------------------------------- |
| `--line-height-*` | leading steps (existing family)     | `--line-height-control: 1.2`                    |
| `--tracking-*`    | letter spacing (new)                | `--tracking-label: 0.08em`                      |
| `--font-weight-*` | weight steps (new)                  | `--font-weight-medium: 500`                     |
| `--duration-*`    | transition and animation time (new) | `--duration-fast: 180ms`                        |
| `--ease-*`        | easing curves (new)                 | `--ease-entrance: cubic-bezier(0.16, 1, .3, 1)` |

**Naming rule, unchanged**: named for the decision, never for the value. `--duration-fast`, not `--duration-180`. `--ease-entrance`, not `--ease-16-1-3-1`. This feature is more exposed to that failure than 010 was, because 21 durations and 6 weights are numbers that want to name themselves.

**Pairing rule (new)**: an element's size and its one-off leading share a name and differ only in the property — `--work-detail-title-size` / `--work-detail-title-leading`. An element already reading a scale-tier leading does not get a private alias; that would hide the fact that it is sharing a decision.

## Substitution rule

Every definition holds a value **byte-identical** to the literal it replaces. What that forbids here, concretely:

- Rounding `1.14`, `1.15` or `1.16` onto `--line-height-copy` (1.18) because they are close.
- Promoting `font-weight: 650` to 600 or 700 because it is not a standard step.
- Collapsing `140ms` / `150ms` / `160ms`, or `340ms` / `350ms` / `360ms`, because the difference is imperceptible. Imperceptible is not identical, and this is a decision to take deliberately with the whole set visible, not while substituting.

All of these are recorded in research.md §6 as consolidation candidates instead.

## The compliance check

`npm run audit:design-system` gains four categories: `line-height`, `font-weight`, `letter-spacing`, `duration`, `easing`.

**Keywords are not literals.** `inherit`, `initial`, `unset`, `revert`, `normal`, and zero in every form — `0`, `0s`, `0ms` — state the absence of a value rather than a choice of one. A reduced-motion override setting a duration to zero is not a violation.

**Durations are read out of shorthands.** `transition: opacity 180ms ease` contributes `180ms`. So does each segment of a multi-part `transition` or `animation` value, and the same declaration may contribute several.

## The coverage declaration

The script MUST state, in one place, which property groups it inspects and which it deliberately does not, each exclusion carrying its reason. The audit prints this statement, so a passing run says what it is claiming rather than leaving the reader to infer it from silence.

A unit test asserts the declaration matches the property groups the script actually scans. Without that test the declaration is prose, and prose drifts from code — which is the same failure, one level up, as the drift this whole line of work removes.

**Exit semantics**: unchanged. Non-zero when any category is non-empty. There is no permitted local literal and no comment that excuses one.

**Where it runs**: `pre-commit` and `pre-push`, both, as of this feature. A dedicated stylesheet linter reporting violations in the editor was considered and rejected (research.md §7).
