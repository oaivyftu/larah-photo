<!--
Sync Impact Report (2.3.0)
- Version change: 2.2.2 → 2.3.0 (MINOR: Principle V's normative content
  changes — E2E moves from excluded-from-both-gates to required-at-push;
  no principle added or removed)
- Modified principles:
  - V. Critical User Flows Require Test Coverage. The suite this principle
    names is no longer a manual-only command: `npm run test:e2e` now runs in
    `.husky/pre-push`, alongside `npm test` and `npm run build`. The commit
    hook is unchanged — the same reasoning that already keeps the unit suite
    out of `pre-commit` (paid on every small commit, for a signal that
    changes far less often) applies with more force to a slower browser
    suite.
- **Why now, having been argued against twice** (009's FR-007, and this
  principle's own text through v2.2.2): the suite has since demonstrated it
  catches real regressions a build and a unit pass do not — the review round
  on PR #26 found a live accessibility bug (`PageTransition` losing focus
  restoration under a timing race) and a test that could not fail, both only
  visible in a real browser. The prior reasoning — no CI, so a hooked run is
  paid entirely by whoever pushes — still holds and is not disputed; it is
  outweighed here by wanting that catch to be mechanical rather than
  dependent on someone remembering to run `npm run test:e2e` by hand. This is
  a judgement call the project could reasonably make either way, which is why
  it is recorded as a decision rather than a correction.
- Modified sections:
  - Development Workflow: added an **End-to-end** gate, and the `.husky/
    pre-push` description now names `npm run test:e2e` among what it runs.
- Added/removed sections: none
- Downstream: `specs/012-browser-e2e-tests/spec.md` (FR-004, SC-005),
  `specs/012-browser-e2e-tests/contracts/run-location.md` (rewritten — the
  written statement this principle points to), `specs/012-browser-e2e-tests/
  data-model.md`, `quickstart.md`, `.husky/pre-push`, `README.md`, `AGENTS.md`
  updated in the same change. `specs/009-testing-quality-gates/spec.md`
  carries a pointer note in its Assumptions rather than an edit to FR-007 or
  SC-005 — those described 009's shipped state accurately and are left as the
  historical record; the constitution is what is authoritative going forward.

Prior report (2.2.2)
- Version change: 2.2.1 → 2.2.2 (PATCH: two factual corrections to Principle V;
  no principle added, removed, or redefined)
- Modified principles:
  - V. Critical User Flows Require Test Coverage. Two statements stopped being
    true and are replaced with what is:
    1. "Work gallery navigation is covered only at the component level
       (`WorkFilters.test.tsx`)" — untrue since `WorkGalleryClient.test.tsx`
       landed, and untrue a second way now that feature 012 covers the flow in a
       browser.
    2. "that flow's end-to-end path remains uncovered until an E2E tool is
       adopted" — this is the adoption. `@playwright/test` is in the tree, nine
       journeys run against a real browser, and the justification the Technology
       Constraints require is `specs/012-browser-e2e-tests/research.md` §1–2.
- **The exclusion is unchanged and deliberately restated**: E2E stays out of the
  commit and push gates and stays a manual command. Feature 012 fulfils what 009
  and this document already anticipated rather than reversing either. The
  written statement of where it does run is
  `specs/012-browser-e2e-tests/contracts/run-location.md`, and moving the suite
  into a hook requires amending this principle alongside it.
- Added/removed sections: none
- Downstream: `README.md` and `AGENTS.md` gained the command and the run
  location in the same change.

Prior report (2.2.1)
- Version change: 2.2.0 → 2.2.1 (PATCH: the Development Workflow paragraph now
  describes what the hooks actually run; no principle added, removed, or
  redefined)
- Modified principles: none
- Modified sections:
  - Development Workflow: `npm test` moved out of `.husky/pre-commit` and is now
    named as a pre-push step. It was the slowest check in the commit gate and
    was paid on every commit; pre-push still runs the whole suite, so a failing
    test cannot reach a shared branch. The paragraph also now names the
    design-system audit, which both hooks have run since feature 011.
- The **Tests** gate itself is unchanged: `npm test` must still pass before code
  leaves the machine. Only the hook it runs in moved.
- Added/removed sections: none
- Downstream: `specs/009-testing-quality-gates/` (spec FR-003/FR-004, SC-001/
  SC-002, contracts, data-model, plan, quickstart) updated in the same change.

Prior report (2.2.0)
- Version change: 2.1.2 → 2.2.0 (MINOR: new principle added)
- Added principles:
  - VII. One Design System, One Place For Shared UI. Names `src/styles/` as the
    token layer and `src/components/ui/` as the shared component library,
    requires a duplication check before new UI is written, and sets the
    promote-on-second-use rule. `src/components/ui/` was already serving this
    role for 16 files but no rule said so, which is how a broken duplicate form
    survived alongside the primitives it should have used.
- Modified principles: none
- Removed principles: none
- Added/removed sections: none
- Note: the folder keeps the name `ui/` rather than being renamed `common/`.
  Renaming would touch 16 files' imports to no functional end; the constitution
  fixes the meaning instead.
- Relationship to Principle IV: IV governs shared values in `src/constants/`
  that JavaScript and GSAP read; VII governs the stylesheet tokens and the
  component library. Where a value lives in both (breakpoints), VII names the
  stylesheet as the source and the TS file as a declared mirror.

Prior report (2.1.2)
- Version change: 2.1.1 → 2.1.2 (PATCH: retires a clause that had served its
  purpose and replaces a "nothing enforces this" note with what now does; no
  principle added, removed, or redefined)
- Modified principles:
  - V. Critical User Flows Require Test Coverage: interim clause deleted.
    Feature 009 shipped 2026-08-24 — Vitest, 31 tests, and both Git hooks are
    in the tree — so the manual-test-plan fallback described a state that no
    longer exists. Replaced with which of the two named flows are actually
    covered, and the honest gap: the gallery pages are async Server Components
    and stay uncovered end-to-end.
- Modified sections:
  - Development Workflow: the paragraph stating that the gates are run by the
    author because "nothing enforces them automatically" is replaced by what
    `.husky/pre-commit` and `.husky/pre-push` run, the formatting-corrects-not-
    blocks rule, and the `--no-verify` caveat.
- Added/removed sections: none
- Note: the v2.1.1 report below says `InquiryForm` "is imported but not
  rendered". As of 2026-08-24 it is no longer imported either — the dead import
  was removed when the lint gate adopted `--max-warnings=0`. The component file
  still exists and is still rendered nowhere, so the principle's reasoning is
  unchanged.

Prior report (2.1.1)
- Version change: 2.1.0 → 2.1.1 (PATCH: factual correction to Principle V's
  list of critical flows; no principle added, removed, or redefined)
- Modified principles:
  - V. Critical User Flows Require Test Coverage: removed "contact/inquiry form
    submission" from the list of critical flows. It was never a live flow —
    `InquiryForm` is imported but not rendered in
    `src/app/(site)/contact/ContactExperience.tsx`, and the `/api/contact`
    endpoint it posts to does not exist. Naming a non-existent flow as
    test-critical made the principle unsatisfiable and contradicted
    `specs/005-contact-page/spec.md`, which correctly scopes the form out. The
    principle now names the two flows that do exist and states the condition
    under which the form re-enters scope.
- Modified sections:
  - Development Workflow → Types gate: was `tsc --noEmit`, which **fails on this
    repo** whenever `.next/` is stale, because the base `tsconfig.json`
    includes `.next/types/**/*.ts`. The constitution was mandating a gate that
    could not pass for reasons unrelated to the code under review. Now points at
    `tsconfig.typecheck.json` (added 2026-08-24, verified passing on a clean
    tree and still catching injected type errors).
- Added/removed sections: none

Prior report (2.1.0)
- Version change: 2.0.0 → 2.1.0 (MINOR: Principle V and Development Workflow
  materially expanded; no principle removed or redefined)
- Modified principles:
  - V. Critical User Flows Require Test Coverage (aspirational) → V. Critical
    User Flows Require Test Coverage. Vitest is now named as the selected
    framework (decision recorded in `specs/009-testing-quality-gates/`
    research.md §1 and plan.md). The principle is no longer open-ended: the
    manual-test-plan fallback is now explicitly time-boxed to the window before
    the suite lands, and the enforcement mechanism is stated (reviewer check on
    the PR description — no CI enforces it today).
- Added principles: none
- Removed principles: none
- Modified sections:
  - Development Workflow: replaced the single-sentence stub left behind when
    "Small, Reviewed Changes" was dropped in v2.0.0. Now states the gates that
    actually apply to every change (lint, type-check, production build), the
    rationale requirements carried over from Principles III and IV, and the
    review expectation. Previously nothing in this constitution required lint
    to pass, even though Principle II depends entirely on it.
- Added/removed sections: none
- Deferred TODOs:
  - Feature 009 is planned but not implemented: no `.husky/`, no Vitest, no
    test files in `src/` as of this amendment. Until the suite exists, the
    interim clause in Principle V governs. Once 009 ships, amend again (PATCH)
    to delete the interim clause and point the workflow gates at the hook
    scripts by name.
  - RATIFICATION_DATE carried forward unchanged from v1.1.0 (2026-08-17); no
    earlier historical ratification date is on record.
-->

# Larah Photo Constitution

## Core Principles

### I. Sanity Is the Sole Source of Content

Sanity CMS is the only source of page copy, images, navigation, site settings,
services, and work projects. No production copy or imagery may be hardcoded in
components. When required Sanity data is missing or a query fails, the app MUST
surface a configuration/content error rather than silently rendering fallback or
placeholder content.

**Rationale**: Editors manage the entire site through Studio; silent fallbacks
would hide real content errors from editors and let broken pages reach
production.

### II. Accessibility Is Non-Negotiable

The full jsx-a11y recommended rule set MUST stay enabled in ESLint, not just the
subset eslint-config-next enables by default. New UI MUST NOT introduce a11y
lint violations, and interactive elements MUST have correct semantics/labels/
ARIA before merge.

**Rationale**: This project already shipped and had to hand-fix unlabelled
controls and misapplied ARIA; the stricter lint config exists specifically to
catch this class of regression before it recurs.

### III. Performance and Image Delivery Are Deliberately Budgeted

Next.js image optimization settings (formats, deviceSizes, imageSizes, quality
allowlist, cache TTL) are tuned deliberately, not left at framework defaults.
Any change to `next.config.ts` image config MUST document the tradeoff it makes
(cost, quality, or layout justification), the same way existing settings are
documented today. Arbitrary quality values or new breakpoints MUST NOT be
introduced without updating the allowlist and stating why.

**Rationale**: This project already hit and fixed an Image Optimization quota
overage by trimming AVIF and breakpoints; undocumented changes risk regressing
that.

### IV. Design Fidelity Through Shared Tokens

Visual and motion values sourced from Figma (breakpoints, drift/animation
thresholds, spacing) MUST live in shared constants (e.g. `src/constants`), not
as magic numbers duplicated across components. GSAP-driven motion effects MUST
reference these shared values.

**Rationale**: Breakpoints were already extracted from inline values into
shared constants once; this principle prevents the drift from creeping back in.

### V. Critical User Flows Require Test Coverage

Before a critical flow ships or is materially changed, it MUST have automated
coverage. The critical flows that exist today are **work gallery navigation**
and **Sanity content error handling**. (Inquiry-form submission is deliberately
not on this list: `InquiryForm` exists in the codebase but is not rendered on
the contact page and posts to an `/api/contact` route that does not exist — see
`specs/005-contact-page/spec.md` Assumptions. It becomes a critical flow, and
falls under this principle, the moment it is actually wired up.)

**Vitest is the selected framework** — unit tests for isolated logic, and tests
that replace the Sanity client at the module boundary rather than over the
network, for code depending on it. **Playwright is the selected E2E framework**
(feature 012).

Both named flows are covered. Sanity content error handling has direct coverage
(`src/sanity/fetchers.test.ts` asserts that missing, blank, and unfetchable
content raises rather than degrading into a placeholder). Work gallery
navigation is covered at the component level (`WorkFilters.test.tsx`), as an
integration flow (`WorkGalleryClient.test.tsx`), and end to end in a real
browser (`e2e/gallery.spec.ts`) — the last of these being the only place the
carousel actually runs, since in a headless DOM it does nothing and a test there
can pass while the gallery is broken.

**The E2E suite runs automatically at push time**, in `.husky/pre-push`
alongside `npm test` and `npm run build`. It stays out of the commit hook —
paying a browser suite on every small commit is a worse trade than paying it
once per push, the same reasoning that already keeps the unit suite out of
`pre-commit`. This reverses the position both this principle and 009's FR-007
held through v2.2.2: there is still no CI pipeline, so the cost still falls
entirely on whoever is pushing, and that cost is now judged worth paying so the
suite's own record of catching real bugs (see the Sync Impact Report) is backed
by a mechanical gate rather than a habit. The full statement of what runs where,
and the condition for reconsidering it again, is
`specs/012-browser-e2e-tests/contracts/run-location.md`. Moving it back to
manual-only is an amendment to this principle, not a hook edit.

**Rationale**: The project ran with no regression safety net at all until
2026-08-24. Coverage is now enforced mechanically at commit and push time
rather than by reviewer diligence, which is why the manual-test-plan fallback
this principle carried through v2.1.1 is gone.

### VI. Stay Current With This Next.js Version

This project pins a Next.js version with breaking changes relative to common
training-data knowledge (see `AGENTS.md`). Before using any Next.js API,
contributors (including AI agents) MUST consult `node_modules/next/dist/docs/`
for the relevant guide rather than relying on memorized conventions, and MUST
heed deprecation notices.

**Rationale**: `AGENTS.md` already states this as a hard requirement; elevating
it to the constitution makes it binding across all Spec Kit-generated plans, not
just ad hoc agent sessions.

### VII. One Design System, One Place For Shared UI

The project has a single design system with two layers, and both are
authoritative:

- **Token layer** — `src/styles/` (`_tokens.scss`, `_typography.scss`,
  `_breakpoints.scss`, `_mixins.scss`) defines colour, font size, line height,
  spacing, layout and breakpoints. Component styles MUST consume these via
  `var(--token)` or the shared mixins. A raw hex, a bare `font-size: 14px`, or
  an inline `@media (max-width: 767px)` in a `*.module.scss` is a violation,
  not a shortcut. A value that has no token yet MUST be added to `src/styles/`
  first and then referenced.
- **Component layer** — `src/components/ui/` is the shared component library.
  Despite the name it is the design system's component half, not a loose
  grab-bag: `Button`, `Input`/`Select`/`Textarea`, `Icon`, `PageHeading`,
  `GlassPointer`, `ShareButton` live there and every consumer imports them from
  there. Feature folders (`work/`, `layout/`, `navigation/`, `media/`) compose
  these primitives; they MUST NOT reimplement one locally.

Before building any UI, contributors (including AI agents) MUST check whether
`src/components/ui/` already provides it. When the same markup, style block, or
behaviour is needed in **two or more** places, it MUST be promoted into
`src/components/ui/` (or `src/styles/` if it is purely a value) and every call
site MUST import the shared version. Copying a component into a second feature
folder and editing it is forbidden.

The library is allowed to hold primitives that currently have no consumer —
that is what a design system is for. Unused does not mean dead.

Where a value must exist in both CSS and JavaScript, `src/styles/` is the
source of truth and the TypeScript copy in `src/constants/` is a declared
mirror, not a second opinion — `src/constants/breakpoints.ts` mirrors
`_breakpoints.scss` this way because SCSS variables cannot be imported into JS
without extra build tooling. Mirrors MUST name what they mirror in a comment,
and changing one side without the other is a defect. This is the same drift
Principle IV guards against, seen from the styling side: Principle IV governs
the TypeScript constants that motion code reads, this principle governs the
stylesheet tokens they mirror.

**Rationale**: The project already grew a broken duplicate
(`contact/InquiryForm`, which imported a stylesheet that did not exist and was
rendered nowhere) while the primitives it needed sat unused in
`src/components/ui/`. Divergence starts as a second copy, not as a bad
component.

## Technology Constraints

Stack is fixed: Next.js App Router, React 19, TypeScript strict mode, Sanity
(`next-sanity`), Sass + styled-components for styling, GSAP (+ `@gsap/react`)
for animation, Flickity/Isotope for gallery/masonry behavior. New dependencies
for problems already solved by this stack require justification. TypeScript
strict mode MUST remain enabled; no new `any` without justification.

## Development Workflow

Work reaches `main` through pull requests. Every change MUST clear these gates
before merge:

- **Lint**: `npm run lint` passes with no errors. This is what gives Principle
  II its force — the jsx-a11y rules only protect the project if the lint run is
  actually required, so a change is not mergeable on a red lint run.
- **Types**: `tsc --noEmit -p tsconfig.typecheck.json` reports no errors.
  TypeScript strict mode stays on (see Technology Constraints). Use that config,
  not the base `tsconfig.json`: the base includes `.next/types/**/*.ts` so that
  the editor and `next build` get generated route type-safety, which means a
  stale `.next/` makes a plain `tsc --noEmit` fail on build output rather than
  on your code. `tsconfig.typecheck.json` excludes `.next`, so the gate depends
  only on the source (rationale in `specs/009-testing-quality-gates/research.md`
  §8).
- **Build**: `npm run build` completes. A change that type-checks but breaks the
  production build MUST NOT reach a shared branch.
- **Tests**: `npm test` passes.
- **End-to-end**: `npm run test:e2e` passes (Playwright, feature 012). Runs at
  push time only, for the same reason `npm test` does — it is slower than the
  commit-time checks and one run per push is enough to keep a broken journey
  off a shared branch.

These gates are enforced automatically. `.husky/pre-commit` runs lint-staged
(ESLint `--fix` and Prettier `--write` over staged files), then the type-check,
then the design-system audit. `.husky/pre-push` re-runs lint, type-check and the
audit across the whole project, and adds `npm test`, `npm run build`, and
`npm run test:e2e`. The test suite and the end-to-end suite both run at push
time only: they are the two slowest checks of the set, and one run per push
still blocks a failing test or a broken journey from reaching a shared branch.
Both hooks install with `npm install`; neither needs a setup step beyond the
one-time Playwright browser download that `npm install` already performs
(`scripts/install-e2e-browser.mjs`).

Formatting is corrected into the commit rather than blocking it, so no commit
fails over layout and none enters history unformatted. Lint warnings do block:
the hooks run ESLint with `--max-warnings=0`.

`--no-verify` bypasses both hooks and stays available for a gate failing for
reasons unrelated to the change at hand. It is not a route for landing a red
build on a shared branch. No CI re-runs these checks, so a bypass is final —
nothing downstream catches what it skipped.

Two kinds of change carry an extra burden, and the rationale belongs in the PR
description, not only in a code comment:

- Changes to the `images` block in `next.config.ts` MUST state the tradeoff
  made — cost, quality, or layout (Principle III).
- Changes to shared design-token constants (`src/constants`) MUST state what
  design source the new value comes from (Principle IV).

## Governance

This constitution supersedes ad hoc conventions; where it conflicts with an
existing pattern in the codebase, the pattern needs correction, not the
constitution. Amendments require a documented rationale, a semver version
bump, and updates to any dependent Spec Kit templates that reference changed
principles. PRs and Spec Kit plans MUST verify compliance with these
principles before completion.

Versioning policy:

- MAJOR: Backward incompatible governance/principle removals or redefinitions.
- MINOR: New principle/section added or materially expanded guidance.
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements.

**Version**: 2.3.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-31
