<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: new principle added)
- Modified principles:
  - V. Small, Reviewed Changes → VI. Small, Reviewed Changes (renumbered only,
    text unchanged)
- Added sections:
  - Core Principles: V. Critical User Flows Require Test Coverage (Aspirational)
- Removed sections: none
- Other edits:
  - Development Workflow: cross-referenced Principle V's manual-test-plan
    requirement for critical flows.
- Deferred TODOs:
  - Principle V is explicitly aspirational: no test framework is selected yet.
    Adopting one requires a follow-up constitution amendment (version bump) to
    name the framework and retire the manual-test-plan fallback.
  - RATIFICATION_DATE carried forward from v1.0.0 (no prior historical date on
    record); replace if the project has a true earlier ratification date.
-->

# Larah Photo Constitution

## Core Principles

### I. Next.js Version Awareness (NON-NEGOTIABLE)

This project runs a version of Next.js newer than what any model's training data
reflects. Before writing or modifying framework-touching code (routing, data
fetching, caching, config, middleware), consult `node_modules/next/dist/docs/`
for the current API and heed any deprecation notices found there. Do not assume
an API, convention, or file-structure rule from prior Next.js experience without
verifying it against the installed version's docs first.

**Rationale**: `AGENTS.md` exists specifically to flag this risk. Silently
applying stale Next.js conventions produces code that looks correct but breaks
against this project's actual APIs.

### II. Sanity as Content Source of Truth

All page copy, imagery, and structured content (site settings, home page,
work projects, service packages, about/contact copy) MUST come from Sanity, not
hardcoded strings or fallback content baked into components. When required
Sanity data is unavailable, the site MUST surface a configuration/content error
rather than silently rendering placeholder text. Live Sanity copy is expected to
diverge from design mockups (Figma) — that divergence is correct CMS behavior,
not a bug to "fix" in code.

**Rationale**: Editors manage the site through Sanity Studio. Hardcoding content
in code defeats the CMS and creates drift between what editors control and what
actually renders.

### III. Figma-Driven Visual Fidelity

Layout, spacing, breakpoints, and component structure MUST match the connected
Figma design file. When comparing a rendered page against Figma, only styling
and markup are in scope for changes — copy differences are expected (see
Principle II) and MUST be resolved in Sanity Studio, not in component code.

**Rationale**: Design and content are governed by separate sources (Figma for
visual structure, Sanity for words/images). Conflating them causes visual
regressions when someone "corrects" text that was never wrong in code.

### IV. Simplicity & Minimal Abstraction

Prefer the direct, readable implementation over a new abstraction, config layer,
or generalized helper until at least two real call sites need it. Do not add
error handling, feature flags, or backwards-compatibility shims for scenarios
that cannot occur in this codebase. Refactors that reduce indirection (see the
project's history of `simplify`/`refactor` commits) are preferred over ones that
add it.

**Rationale**: This is a small, focused marketing/portfolio site, not a
platform. Premature abstraction here has historically been reverted via
follow-up simplification commits.

### V. Critical User Flows Require Test Coverage (Aspirational)

No test framework is wired up in this repository today. Going forward, before a
critical user flow — contact/inquiry form submission, work gallery navigation,
Sanity content error handling — ships or is materially changed, it MUST have
automated test coverage using a framework that is selected and documented via a
constitution amendment. Until a framework is adopted, PRs touching these flows
MUST include a manual test plan in the PR description as an interim substitute.

**Rationale**: The project has no regression safety net today. This principle
is deliberately aspirational and MUST be revisited (version-bumped) once a test
framework lands.

### VI. Small, Reviewed Changes

Changes land through pull requests reviewed and merged individually rather than
batched into large, mixed-purpose commits. Each PR should be scoped to one
concern (a feature, a fix, a refactor, or a style adjustment) so it can be
reviewed and reverted independently.

**Rationale**: The project's commit history is consistently structured this way
(discrete `feat:`/`fix:`/`refactor:`/`perf:`/`style:` commits merged via
individual PRs); this principle codifies the existing, working practice.

## Technology Stack Constraints

- Framework: Next.js (App Router) on the version pinned in `package.json` —
  see Principle I before touching framework-level code.
- Content: Sanity CMS via `next-sanity`; Studio is mounted at `/studio`.
- Styling: Sass (SCSS) and `styled-components`; match existing per-component
  conventions rather than introducing a third styling approach.
- Motion: GSAP (`gsap`, `@gsap/react`) for animation and scroll-driven effects.
- Language: TypeScript throughout; no new JavaScript files in `src/`.
- Hosting: Vercel.

## Development Workflow

- Run `npm run lint` before proposing a change is complete; fix or explicitly
  justify any new lint findings.
- There is no automated test suite in this repository today. Do not claim a
  change is "tested" based on type-checking or linting alone — for UI/behavior
  changes, verify manually (dev server + browser) per the project's standing
  guidance to test the golden path and edge cases before reporting completion.
  For the critical flows named in Principle V, include a manual test plan in
  the PR description until an automated framework is adopted.
- Environment variables required for local development are documented in
  `.env.example` / `README.md` (Sanity project ID, dataset, API version); keep
  that documentation in sync with any new required variable.

## Governance

This constitution supersedes ad-hoc conventions when the two conflict. Amendments
are made by editing `.specify/memory/constitution.md` directly (via
`/speckit-constitution`), incrementing the version per semantic versioning:

- MAJOR: backward-incompatible principle removal or redefinition.
- MINOR: a new principle or materially expanded section is added.
- PATCH: wording, clarification, or non-semantic fixes.

Every feature spec, plan, and task list produced by Spec Kit commands is
expected to be consistent with these principles; a conflict should be resolved
by amending this document (if the principle is wrong or outdated) or by
adjusting the feature work (if the principle still holds). Complexity that
violates Principle IV must be justified in the relevant plan's rationale, not
silently introduced.

**Version**: 1.1.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
