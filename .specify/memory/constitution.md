<!--
Sync Impact Report (2.1.1)
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

**Vitest is the selected framework** — unit tests for isolated logic, and mock
tests for code depending on the Sanity client, with that dependency replaced at
the module boundary rather than over the network. Playwright/E2E is
deliberately excluded from the commit and push gates and stays a manual
command.

**Interim clause (delete once the suite lands)**: the Vitest suite is specified
in `specs/009-testing-quality-gates/` but is not implemented yet — there is no
`.husky/`, no Vitest dependency, and no test file in `src/`. Until `npm test`
exists and passes, PRs touching a critical flow MUST carry a manual test plan
in the PR description. No CI enforces this; it is a reviewer check, and the
reviewer is expected to block the PR when it is missing.

**Rationale**: The project has no regression safety net today. Naming the
framework closes the open-ended "some framework, someday" wording this
principle carried through v2.0.0, without pretending coverage exists before it
does.

### VI. Stay Current With This Next.js Version

This project pins a Next.js version with breaking changes relative to common
training-data knowledge (see `AGENTS.md`). Before using any Next.js API,
contributors (including AI agents) MUST consult `node_modules/next/dist/docs/`
for the relevant guide rather than relying on memorized conventions, and MUST
heed deprecation notices.

**Rationale**: `AGENTS.md` already states this as a hard requirement; elevating
it to the constitution makes it binding across all Spec Kit-generated plans, not
just ad hoc agent sessions.

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
- **Tests**: `npm test` passes, once the suite exists; until then the interim
  clause in Principle V applies.

Until the Git hooks specified in `specs/009-testing-quality-gates/` are
implemented, these gates are run by the author and confirmed by the reviewer —
nothing enforces them automatically.

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

**Version**: 2.1.1 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-24
