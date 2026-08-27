# Quickstart: Design System Compliance

Validates the feature once implemented. Assumes `npm install` has run.

## Scenario 1 — Nothing is duplicated any more

```bash
# Colour literals appearing 2+ times (must be empty)
grep -rho "rgba\?([^)]*)\|#[0-9a-fA-F]\{3,8\}\b" src --include='*.module.scss' \
  | sort | uniq -c | awk '$1>=2'

# Fluid type ramps appearing 2+ times (must be empty)
grep -rho "font-size:\s*clamp([^)]*)" src --include='*.module.scss' \
  | sort | uniq -c | awk '$1>=2'
```

**Expected**: no output from either. Baseline before the work was 10 colour values across 28 uses and 5 ramps across 12 uses (research.md §3).

## Scenario 2 — A token change reaches every screen

```bash
# Pick a token now used in 2+ places and change it to something obvious
# (e.g. --overlay-light-weak -> rgba(255, 0, 0, 1)), then:
npm run dev
```

**Expected**: every element that previously carried that literal changes together. Revert afterwards. This is the concrete form of SC-005 — it is what "one place to change it" means.

## Scenario 3 — No literal values remain in any component stylesheet

```bash
npm run audit:design-system   # exact name per contracts/token-naming.md
```

**Expected**: exits 0, with both (b) and (c) reporting `none`. No colour, type size or spacing literal is reported at any use count. Every value the audit previously listed now resolves through `src/styles/`, on either the scale tier or the semantic tier — a literal left inline behind a comment is a failure, not an exception.

## Scenario 4 — The breakpoint mirror cannot drift silently

```bash
npm test                       # the mirror test passes with the tree as-is

# Now break it deliberately:
#   edit src/styles/_breakpoints.scss, change $breakpoint-phone-lg to 640px
npm test
```

**Expected**: the second run **fails**, naming the constant and both values. Revert and confirm it passes again. A test that cannot fail is not a gate (the same check applied to `tsconfig.typecheck.json` in feature 009 §8).

## Scenario 5 — The animation setup exists once

```bash
grep -rn "registerPlugin(useGSAP)" src | wc -l
```

**Expected**: `1`. Baseline was 4. The four page-level components call the shared hook instead.

## Scenario 6 — Nothing looks different

```bash
npm test && npm run build
```

**Expected**: 31+ tests pass and the build completes.

Then compare before and after by eye on the affected routes — `/`, `/about`, `/service`, `/work`, and a project detail page with the lightbox open — at roughly 375px, 820px and 1440px wide.

**Expected**: no visible difference anywhere. Every substitution was value-for-value identical by construction (contracts/token-naming.md), so any difference you can see is a typo to hunt down, not a design change to accept.

**And mechanically**, which is stronger than eyes and repeatable:

```bash
npm run audit:css-diff
```

**Expected**: `RENDERED CSS IDENTICAL`. It builds the working tree, builds HEAD, resolves every custom property on both sides, and compares all ~1600 declarations. A screenshot shows one viewport of one route; this shows everything the browser receives. It is what verified each of this feature's four substitution passes.

Still worth a human look at the routes above, for the things CSS equality cannot speak to — the GSAP page-entry timing in particular, which no check here covers.

**Why not full visual-regression tooling**: adding Playwright screenshots is a larger decision than this feature should make alone — the same reasoning that kept it out of the Git hooks in feature 009 §4. Recorded as a follow-up.

## Reference

- Token families, substitution rule, check semantics: [contracts/token-naming.md](./contracts/token-naming.md)
- Artifact shapes: [data-model.md](./data-model.md)
- Measured baseline and the decisions behind it: [research.md](./research.md)
