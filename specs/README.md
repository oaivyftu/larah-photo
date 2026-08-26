# Specs

Spec Kit features for this project. Two kinds live here, and they are
deliberately **not** structured the same way.

## Retrospective specs (001–008) — spec-only by design

Features `001` through `008` document behaviour that was **already built and
shipped** before Spec Kit was introduced. Each one says so explicitly in its
own Assumptions section:

> This specification documents the … current, already-implemented behavior as a
> baseline, rather than proposing new functionality.

These have `spec.md` + `checklists/` and **no `plan.md`, and no `tasks.md`.
That is intentional, not an oversight — do not "fix" it by running
`/speckit-plan` across them.** `/speckit-plan` produces an _implementation_
plan whose purpose is to feed `/speckit-tasks` → `/speckit-implement`. Running
that pipeline against code that already exists generates tasks to build things
that are already running, and multiplies the number of artifacts that have to
be kept in sync with the codebase for no gain.

**Known consequence**: `.specify/scripts/bash/check-prerequisites.sh` hard-fails
without `plan.md`, so `/speckit-tasks`, `/speckit-analyze`, `/speckit-converge`
and `/speckit-implement` cannot run on `001`–`008` as they stand:

```
ERROR: plan.md not found in $FEATURE_DIR
Run /speckit-plan first to create the implementation plan.
```

This is accepted. The trade-off is that spec-vs-code drift in these eight is not
caught by any automated Spec Kit command and has to be checked deliberately.
Drift is real and has already been found: `008-seo-metadata` FR-005/FR-006/FR-009
described breadcrumb and overlay structured-data behaviour the code never had,
and were corrected on 2026-08-24 to match the implementation.

If a retrospective feature ever gains genuinely _new_ scope, plan that new work
rather than back-filling a plan for the shipped baseline.

## Forward-looking specs (009+) — full artifact set

These are specified _before_ being built, so they carry the full artifact set:
`spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`,
`contracts/`, `tasks.md`.

- **`009-testing-quality-gates`** — shipped 2026-08-24. Vitest suite (31 tests),
  Prettier, and Husky pre-commit/pre-push hooks are all in the tree; all 31
  tasks are checked off.
- **`010-design-system-compliance`** — shipped 2026-08-25; all 39 tasks checked
  off. Every colour, type size and spacing value resolves through
  `src/styles/`, the four-way copy of the page-entry animation is one hook, and
  the TypeScript breakpoint mirror is test-enforced. `npm run audit:design-system`
  passes and runs in pre-push.
- **`011-typography-motion-tokens`** — specified 2026-08-25, not yet planned.
  Extends 010's zero-literal rule to the categories its check never inspected:
  line height, font weight, letter spacing, and motion (duration and easing).
  188 literals across 59 distinct values. Also makes the check's coverage
  explicit, since implicit coverage is why these four drifted. Next step:
  `/speckit-plan`.

## Targeting a feature

`.specify/feature.json` holds the active feature directory and currently points
at `011-typography-motion-tokens`. To run a Spec Kit command against a different
one without editing that file, set the override read by
`.specify/scripts/bash/common.sh`:

```bash
SPECIFY_FEATURE_DIRECTORY=specs/008-seo-metadata
```
