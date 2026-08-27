# Quickstart: Typography and Motion Tokens

Validates the feature once implemented. Assumes `npm install` has run.

## Scenario 1 — No literal values remain in any of the five categories

```bash
npm run audit:design-system
```

**Expected**: exits 0, with `line-height`, `font-weight`, `letter-spacing`, `duration` and `easing` all reporting zero alongside the three categories feature 010 already closed. Baseline before this work: 189 literals across 59 distinct values.

## Scenario 2 — The check says what it covers

```bash
npm run audit:design-system | head -30
npm test                     # includes the coverage-declaration test
```

**Expected**: the audit's output states which property groups it inspects and which it deliberately does not, each exclusion with a reason. The test passes, meaning that statement matches what the script actually scans.

Then break it deliberately: add a property group to the scan without adding it to the declaration, and run `npm test` again.

**Expected**: it fails, naming the group. A declaration nothing verifies is prose, and this is the check that keeps it honest — feature 010's coverage lived only inside its regexes, which is how four categories sat outside the rule while the audit reported success.

## Scenario 3 — The line-height tokens are finally used

```bash
grep -rc "var(--line-height-tight)" src --include='*.scss' | grep -v ':0'
```

**Expected**: non-empty. Before this work `--line-height-tight` had **zero** consumers while eleven declarations wrote `1`, its exact value. `--line-height-copy` stays at zero on purpose: no literal in the tree matches 1.18, and retuning it would be a design decision on no evidence (research.md §6).

## Scenario 4 — A token change reaches every screen

```bash
# Change one recurring definition to something obvious, e.g.
#   --font-weight-medium: 500  ->  900
npm run build
grep -rho -- "--font-weight-medium:[^;]*" .next/static/chunks/*.css
```

**Expected**: the change appears once in the built CSS, and all 17 declarations that used `500` follow it. Revert afterwards. This is the concrete form of SC-009.

## Scenario 5 — Nothing looks different, and nothing moves differently

```bash
npm run audit:css-diff
```

**Expected**: `RENDERED CSS IDENTICAL`. It builds the working tree, builds HEAD, resolves every custom property on both sides, and compares every declaration. Durations and curves are compared as readily as colours, so a transition that changed length fails here.

Then look at the routes by eye — `/`, `/about`, `/service`, `/work`, and a project detail page with the lightbox open — for what CSS equality cannot speak to: whether the motion still _feels_ the same. It should, byte for byte, but this is the category where a mistake is most likely to be felt before it is seen.

## Scenario 6 — The gate holds

```bash
# Reintroduce a literal, e.g. `line-height: 1.2` in any component stylesheet
git add -A && git commit -m "test"
```

**Expected**: the commit is refused at the `design-system` step. As of this feature the audit runs in `pre-commit` as well as `pre-push`, so a violation is reported at the commit that introduced it rather than at the end of a session. Revert afterwards.

## Reference

- Naming rules and check semantics for these categories: [contracts/token-naming.md](./contracts/token-naming.md)
- Token families and the coverage declaration: [data-model.md](./data-model.md)
- Why these four drifted, and how each family was named: [research.md](./research.md)
- The two naming tiers and the substitution rule, inherited unchanged: `specs/010-design-system-compliance/contracts/token-naming.md`
