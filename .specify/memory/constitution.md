<!--
Sync Impact Report
- Version change: 1.1.0 → 2.0.0 (MAJOR: principle set redefined and reordered)
- Modified/renamed principles:
  - II. Sanity as Content Source of Truth → I. Sanity Is the Sole Source of Content
    (expanded: silent fallback/placeholder rendering now explicitly forbidden)
  - I. Next.js Version Awareness (NON-NEGOTIABLE) → VI. Stay Current With This
    Next.js Version (renumbered, wording tightened)
  - V. Critical User Flows Require Test Coverage (Aspirational) → V. Critical
    User Flows Require Test Coverage (aspirational) (renumbered only, intent
    unchanged)
  - III. Figma-Driven Visual Fidelity → folded into IV. Design Fidelity Through
    Shared Tokens (scope narrowed to shared-constants enforcement; general
    Figma-matching guidance removed as a standalone principle)
- Added principles:
  - II. Accessibility Is Non-Negotiable (new, non-negotiable)
  - III. Performance and Image Delivery Are Deliberately Budgeted (new)
- Removed principles:
  - IV. Simplicity & Minimal Abstraction (core principle removed; the
    no-new-`any`/justify-new-dependencies portion is retained under Technology
    Constraints, but the general "prefer direct implementation" guidance is no
    longer a constitutional principle)
  - VI. Small, Reviewed Changes (removed entirely; not carried forward)
- Added sections: none (Technology Constraints and Development Workflow retained
  under equivalent names, content replaced per user input)
- Removed sections: none
- Deferred TODOs:
  - Principle V remains explicitly aspirational: no test framework is selected
    yet. Adopting one requires a follow-up amendment (version bump) naming the
    framework and retiring the manual-test-plan fallback.
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

### V. Critical User Flows Require Test Coverage (aspirational)

No test framework is wired up yet, but going forward, before a critical flow
(contact/inquiry form submission, work gallery navigation, Sanity content error
handling) ships or is materially changed, it MUST have automated coverage using
a framework selected and documented via a constitution amendment. Until a
framework is adopted, PRs touching these flows MUST include a manual test plan
in the PR description as an interim substitute.

**Rationale**: The project has no regression safety net today; this principle
is deliberately aspirational and should be revisited (version-bumped) once a
framework lands.

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

Changes to `next.config.ts` image config
and to shared design-token constants require explicit rationale in the PR (see
Principles III and IV).

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

**Version**: 2.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
