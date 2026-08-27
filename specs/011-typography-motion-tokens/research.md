# Phase 0 Research: Typography and Motion Tokens

## 1. Why these four categories drifted

**Finding**: feature 010's audit inspected three property groups — colour, `font-size`, and the spacing properties. Nothing else. That list was never written down anywhere; it lived only in the script's regexes. So "the audit passes" and "the design system governs" stopped meaning the same thing the moment anyone asked about a fourth property.

**The sharpest evidence is in the token file itself.** `src/styles/_tokens.scss` defines four line heights. Two of them have **zero consumers**:

| Token                   | Value | Times referenced |
| ----------------------- | ----- | ---------------- |
| `--line-height-tight`   | 1     | **0**            |
| `--line-height-heading` | 1.05  | 2                |
| `--line-height-copy`    | 1.18  | **0**            |
| `--line-height-body`    | 1.4   | 2                |

The two that are used are used only by `_typography.scss`, on `body` and on `h1`–`h4`. Not one component stylesheet references any of them. Meanwhile 48 declarations across 15 component stylesheets write the number — including `1` eleven times, which is exactly `--line-height-tight`.

**Implication**: this is not a gap in the design system. The design system was right and was ignored, for as long as nothing checked. That makes FR-008 — a written coverage declaration — the requirement that stops this feature being redone in six months, rather than a piece of documentation hygiene.

## 2. The shape of this feature is the inverse of 010's

**Finding**: 010's hardest problem was that `font-size` had almost no recurring values — 84 one-off `clamp()` ramps forced a semantic naming tier into existence. These four categories are the opposite. A small recurring set dominates each one:

| Category         | Declarations | Distinct | Recurring | Used once | Covered by the recurring set |
| ---------------- | ------------ | -------- | --------- | --------- | ---------------------------- |
| `font-weight`    | 53           | 6        | 5         | 1         | 98%                          |
| `line-height`    | 48           | 17       | 5         | 12        | 75%                          |
| `letter-spacing` | 17           | 8        | 3         | 5         | 71%                          |
| duration         | 57           | 23       | 14        | 9         | 84%                          |
| easing           | 14           | 5        | 4         | 1         | 93%                          |

**Decision**: this feature is mostly **scale-tier** work. 010 minted 143 single-use tokens out of 219; here the ratio inverts, and the scale tier does the real work. Semantic-tier names are the exception rather than the rule.

**Why that matters for the plan**: the risk profile changes with it. 010's danger was 156 tokens named badly. Here it is the opposite — the temptation to force a one-off onto a nearby scale step because the scale looks so tidy. `1.15` is not `1.18`, and rounding it changes rendering (spec FR-005).

## 3. Naming the typography scales

**Decision**: extend the existing `--line-height-*` family; introduce `--tracking-*` and `--font-weight-*`.

### Line height

The family already exists and already reads as a tightness ladder. Three steps are added to it, and the two existing tokens that match literals in use are simply adopted.

| Value  | Uses | Token                   | Status                                 |
| ------ | ---- | ----------------------- | -------------------------------------- |
| `1`    | 11   | `--line-height-tight`   | exists, unused — pure substitution     |
| `1.05` | 1    | `--line-height-heading` | exists — pure substitution             |
| `1.18` | 0    | `--line-height-copy`    | exists, unused, and matches no literal |
| `1.2`  | 12   | `--line-height-control` | **new** — the workhorse                |
| `1.25` | 8    | `--line-height-compact` | **new**                                |
| `1.35` | 3    | `--line-height-loose`   | **new**                                |
| `1.4`  | 2    | `--line-height-body`    | exists — pure substitution             |

**`--line-height-copy` stays at 1.18 and stays unused.** Feature 010's FR-011 keeps primitives that have no consumer, and retuning it to 1.2 to make it useful would be a design decision taken on no evidence. That it sits 0.02 from the codebase's most-used leading, while itself being used nowhere, is recorded in §6 as a consolidation candidate — it is the clearest case in the set of a value nobody actually wanted.

### Letter spacing

New `--tracking-*` family. Three recurring values, five one-offs.

| Value     | Uses | Where                                          | Token                    |
| --------- | ---- | ---------------------------------------------- | ------------------------ |
| `0.08em`  | 6    | eyebrows and uppercase labels, five components | `--tracking-label`       |
| `-0.02em` | 4    | large display text — nav, about, home          | `--tracking-display`     |
| `0.02em`  | 2    | `GlassPointer` and the gallery float label     | `--tracking-glass-label` |

The third is named semantically rather than by width because those two call sites are **the same control at two sizes** — the pairing feature 010 already recognised when it minted `--font-size-glass-label`. Naming it `--tracking-wide` would imply a general step that anything could reach for, which is not what it is.

### Font weight

New `--font-weight-*` family, six values, five of them standard.

| Value | Uses | Token                     |
| ----- | ---- | ------------------------- |
| `400` | 12   | `--font-weight-regular`   |
| `500` | 17   | `--font-weight-medium`    |
| `600` | 14   | `--font-weight-semibold`  |
| `650` | 4    | named at implementation   |
| `700` | 5    | `--font-weight-bold`      |
| `800` | 1    | `--font-weight-extrabold` |

**`650` is the one that needs a look rather than a rename.** It is not a standard step and appears in three unrelated components. Rounding it to 600 or 700 changes rendering and FR-005 forbids that here, so it is tokenised as it stands — but named for the role it plays at those three call sites, decided with the code open, not from the number. It is also recorded in §6.

## 4. Naming motion

**Decision**: `--duration-*` and `--ease-*`, with the tier chosen by whether a value crosses component boundaries.

Feature 010's rule applies unchanged: scale tier when a second call site would want the value **for the same reason**, semantic tier when sharing it would be coincidence. For durations that resolves cleanly, because the data separates into two obvious groups.

- **Crosses unrelated components** → scale tier. `180ms` in `Button`, `MainNav` and the gallery is one decision about how fast small UI feedback should be.
- **Recurs only inside one component** → semantic tier. `250ms` four times inside `GlassPointer` is that component's transition speed, not a step anyone else should reach for.

**Why not a duration ladder of three or four steps**: because building one means collapsing 21 values onto it, which changes how the site moves. Twenty-one durations between 90ms and 1.8s is not a scale — it is what happens when each transition is tuned in isolation, and this feature's job is to make that visible, not to overwrite it. Naming them puts all 21 in one file where the argument for consolidating them can finally be had with the evidence in view (§6).

### Easing

Five curves, four of them recurring, and they read as a deliberate motion language:

| Curve                                  | Uses | Where                                  |
| -------------------------------------- | ---- | -------------------------------------- |
| `cubic-bezier(0.104, 0.204, 0.492, 1)` | 6    | `GlassPointer`, gallery float controls |
| `cubic-bezier(0.16, 1, 0.3, 1)`        | 3    | page transition, modal entrance        |
| `cubic-bezier(0.7, 0, 0.2, 1)`         | 2    | page transition                        |
| `cubic-bezier(0.22, 1, 0.36, 1)`       | 2    | nav, work detail                       |
| `cubic-bezier(0.7, 0, 0.84, 0)`        | 1    | modal exit                             |

Named for the motion each describes — entrance, exit, glass — rather than for its control points. This is the cheapest win in the feature: five names settle a vocabulary that already exists.

## 5. Pairing a size with its leading (FR-003a)

**Decision**: where an element has both a size token and a one-off leading, the leading takes the same element name with `-leading` in place of `-size`. `--gallery-title-size` pairs with `--gallery-title-leading`.

**Why not a single composite definition** holding size, leading, tracking and weight together, which is the pattern that stops the four drifting apart at all: measured, it does not fit. Across the 50 blocks that set both a size and a leading there are **49 distinct combinations of the four properties**, and exactly one recurs, twice. A composite style presupposes a small set of text treatments; this codebase has close to one per place. Building them anyway yields 49 definitions each used once — a dictionary, not a type scale.

Note what §2 already showed, because the two findings look contradictory and are not: the _leadings_ recur (5 values cover 75% of uses) and the _sizes_ do not. It is the **combination** that is unique, because the sizes are. Composite styles therefore become available only after the sizes are consolidated, which changes rendering. Recorded in §6 as what that consolidation would unlock.

**Alternatives considered**:

- **A Sass mixin per text style** rather than custom properties. Same problem: 49 mixins used once. The mechanism was not the obstacle.
- **Pair only where the leading is also one-off**, leaving scale-tier leadings unpaired. Adopted implicitly — an element using `--line-height-control` is already reading a shared decision, and giving it a private alias would hide that.

## 6. Deferred consolidation

Recorded rather than performed, on the same reasoning as feature 010 §3a: each of these changes rendering, and `npm run audit:css-diff` makes any proposed merge checkable rather than arguable.

| Candidate                                                    | Why it is a candidate                                                                                                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--line-height-copy` (1.18) vs `--line-height-control` (1.2) | 0.02 apart; the first has never been used and matches no literal in the tree, the second is the most-used leading in it. The clearest case of a token nobody wanted.            |
| `1.14` / `1.15` / `1.16` / `1.2` / `1.22`                    | Five leadings inside 0.08 across unrelated components. Almost certainly nobody chose five.                                                                                      |
| `--font-weight` `650`                                        | A non-standard step, four uses, three components. Either a deliberate variable-font choice or a typo that propagated.                                                           |
| The 21 durations                                             | `140`/`150`/`160`ms, and `340`/`350`/`360`ms, are differences no one can perceive. This is the largest consolidation opportunity in the codebase and the least risky to act on. |
| Composite text styles                                        | Unlocked by consolidating the 49 size treatments (§5). The end state this whole line of work points at.                                                                         |

## 7. Extending the check, and declaring what it covers

**Decision**: add the four categories to `scripts/audit-design-system.mjs`, and add a **coverage declaration** the script prints and a test asserts.

The declaration is the actual deliverable of US3. A list of property groups inside a regex is not a declaration — it is what allowed this feature's four categories to sit outside the rule unnoticed. The script states which property groups it inspects and which it deliberately does not, with the reason, and the audit's own output carries that statement so a passing run says what it is claiming.

**Alternatives considered**:

- **A stylesheet linter** (`stylelint` with `declaration-strict-value`), which would report violations in the editor as they are typed. Rejected: it does not clear the constitution's bar for a new dependency, and more importantly the off-the-shelf rule cannot express the three checks that have actually found defects here — splitting a shorthand into its individual values, detecting a component-local variable holding a literal, and reading a declaration that mixes a token with a literal. Adopting it would give one rule two sources of truth, which is the failure this work exists to remove. The existing check moved into `pre-commit` instead, at no cost.
- **Leaving coverage implicit and just adding the regexes.** Rejected: that is precisely what produced this feature.

## 8. What implementing this changed about the plan

Recorded because each was found by doing the work, not by planning it.

**The measurement was short by two values, in the same way this feature's own subject drifted.** Phase 0 counted 21 durations. The extended audit found 23: `450ms` and `1ms`, both in longhand `transition-duration` / `animation-duration` declarations the counting script never read. The `1ms` is the reduced-motion kill switch, used three times, and is 1ms rather than 0s on purpose — a zero duration makes some browsers skip the `animationend` event that cleanup code listens for, so it is a real decision and is tokenised with that reason attached. A measurement that does not look at a property group cannot report it, which is the entire thesis of §1 arriving one level up.

**The pairing rule was easier than expected.** Every one of the eleven one-off leadings sat on an element that already had a size token from feature 010, so `--x-size` / `--x-leading` fell out with no judgement calls. Thirty-seven further elements read a scale-tier leading and were correctly left without a private alias.

**Verifying the motion pass found three defects in `compare-built-css.mjs`** — the tool feature 010 built and this feature relied on. It had never been exercised on `transition` or `animation`:

1. `ease` was stripped only at the end of a value, so the minifier dropping a default timing function mid-shorthand read as a difference.
2. The `animation` shorthand was split on every comma, which cuts `cubic-bezier(.7, 0, .2, 1)` into four pieces.
3. The first fix sorted the whole shorthand — which would have made `700ms 90ms` and `90ms 700ms` compare equal, a false equality between a duration and a delay in the one tool whose job is to not have those.

The shorthand now preserves the order of the two `<time>` values, which are positional, and sorts only the parts the spec says are order-free. A verification tool that reports success wrongly is worse than no tool, and this one nearly did.

**Putting the audit in `pre-commit` has a cost nobody named.** A tree-wide check at commit time means a partially-migrated tree cannot be committed at all: the US1 typography commit was refused because US2's durations were still literals. It is the gate working correctly, and it also removes the ability to land a migration in reviewable pieces. Feature 010 kept the check out of the hooks for a related reason — a gate that always fails is noise — and this is its mirror image. Worth revisiting if a future migration is large enough that one commit is too big to review.
