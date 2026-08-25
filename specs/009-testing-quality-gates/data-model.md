# Phase 1 Data Model: Testing & Git Quality Gates

This feature has no runtime domain data — it is developer tooling. The "entities" below are the config/artifact shapes the plan introduces, carried over from the spec's Key Entities section.

## Unit Test

- **Location convention**: colocated as `*.test.ts` / `*.test.tsx` next to the module under test (e.g. `src/utils/formatWorkCategory.test.ts`).
- **Scope**: pure functions/utilities and Client Components with no mocked external dependency required (or trivial ones, e.g. a pointer/label hook).
- **Runner**: Vitest, `environment: "jsdom"` for anything rendering React.
- **Validation rule**: MUST NOT import `src/sanity/client` or perform any network call; if it needs CMS data, it belongs in the Mock Test category instead.

## Mock Test

- **Location convention**: colocated as `*.test.ts` / `*.test.tsx`, same as unit tests — the distinction is the mocking, not the file location.
- **Scope**: `src/sanity/fetchers.ts` functions, and any Client Component/hook that consumes CMS-shaped data, exercised with the Sanity client module mocked via `vi.mock("@/sanity/client")`.
- **Validation rule**: MUST NOT make a real network/Content Lake request during the test run (research.md §3); asserts against fixture data returned by the mock.

## Pre-commit Gate (config artifact)

- **File**: `.husky/pre-commit`
- **Steps** (in order, first failure stops the hook): `lint-staged` (ESLint `--fix` + Prettier `--write` on staged files, with lint-staged re-staging what it rewrote) → `tsc --noEmit -p tsconfig.typecheck.json` (whole project) → `vitest run` (whole project: unit + mock tests).
- **Exit behavior**: non-zero exit from any step blocks the commit (standard Husky/Git behavior). Prettier `--write` cannot produce a non-zero exit for badly-formatted input — it fixes it — so formatting corrects rather than blocks (spec FR-003a). ESLint `--fix` still blocks on any violation it cannot auto-fix.

## Pre-push Gate (config artifact)

- **File**: `.husky/pre-push`
- **Steps**: the same lint / typecheck / test steps as the Pre-commit Gate, plus `next build` (production build) as a final step. Note the ordering benefit: `next build` regenerates `.next/`, but `typecheck` reads `tsconfig.typecheck.json`, which excludes `.next` — so the type-check result does not depend on whether the build ran first.
- **Exit behavior**: non-zero exit from any step (including the build) blocks the push.

## lint-staged Configuration (config artifact)

- **Location**: `lint-staged` key in `package.json` (or `.lintstagedrc.json` — either is equivalent; `package.json` keeps hook config in one place).
- **Shape**: maps file glob patterns to the commands run only against matching staged files —
  - `*.{ts,tsx,js,jsx}` → `eslint --fix`
  - `*.{ts,tsx,js,jsx,scss,json,md}` → `prettier --write`

## Package Scripts (config artifact)

New/changed `package.json` scripts this feature introduces — see `contracts/npm-scripts.md` for the full contract.
