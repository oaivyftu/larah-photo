# Phase 0 Research: Testing & Git Quality Gates

## 1. Unit/mock test framework

**Decision**: Vitest + React Testing Library + `jsdom`.

**Rationale**:
- `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` is this pinned Next.js version's own recommended path for unit testing under the App Router, per constitution Principle VI (consult the bundled docs, not memorized conventions).
- The project is ESM-native (`tsconfig.json` → `"module": "esnext"`, `"moduleResolution": "bundler"`), which Vitest (Vite-based) handles natively; Jest requires extra ESM/transform configuration to match.
- `vite-tsconfig-paths` resolves the existing `@/*` path alias with no duplicate config.
- Fulfils constitution Principle V ("Critical User Flows Require Test Coverage"), which required a framework to be selected and documented via a constitution amendment. **This has already happened**: constitution v2.1.0 (2026-08-24) names Vitest as the selected framework ahead of implementation, so this decision is now recorded, not pending. **Remaining follow-up**: once the suite actually lands (`npm test` exists and passes), amend again (PATCH) to delete Principle V's interim clause and point the Development Workflow gates at the hook scripts by name.

**Alternatives considered**:
- **Jest**: still fully supported (`.../testing/jest.md` exists in the same docs tree) but needs manual ESM/SWC transform wiring that Vitest gets for free from the existing Vite-style TS config; no advantage here.
- **Cypress component testing**: heavier runtime, primarily aimed at E2E-style component tests; overkill for isolated unit/mock coverage.

## 2. Async Server Components are out of unit-test scope

**Finding**: The same Next.js docs state plainly: *"Since `async` Server Components are new to the React ecosystem, Vitest currently does not support them... we recommend using E2E tests for `async` components."*

**Implication for this project**: Every route's `page.tsx` (`src/app/(site)/**/page.tsx`) is an async Server Component that calls `getXPage()`/`getXxx()` fetchers directly. These pages themselves are **not** unit/mock-testable with Vitest — that gap is exactly what Playwright (or another E2E tool) exists to cover, which directly informs the Playwright question in Section 4 below: Playwright is not redundant with the unit/mock suite, it is the only tool that can exercise these pages end-to-end.

**What Vitest *can* cover** (the actual surface for this feature's unit + mock tests):
- Pure utility/formatting functions (`src/utils/*`, e.g. `formatWorkCategory`, `structuredData.ts` builders).
- Client Components (`"use client"` files: `WorkFilters`, `WorkCard`, `WorkMasonryGrid`, `InquiryForm`, `MainNav`, etc.) via `@testing-library/react`.
- Data-fetching modules (`src/sanity/fetchers.ts`) with the Sanity client mocked — this is the project's "mock test" category.

## 3. Mocking strategy for CMS/network dependencies

**Decision**: `vi.mock()` at the module boundary (mock `@/sanity/client`'s exported client, and `next/cache`'s `revalidateTag` where relevant) rather than introducing a network-level mocking library.

**Rationale**: `src/sanity/fetchers.ts` already funnels every CMS read through one client module and one `SANITY_CACHE_TAG`/fetch wrapper. Mocking that single module boundary is sufficient to test fetchers and any component that consumes them without a real network/Content Lake call, and needs no new runtime dependency — consistent with the constitution's Technology Constraints ("New dependencies for problems already solved by this stack require justification").

**Alternatives considered**:
- **MSW (Mock Service Worker)**: intercepts at the HTTP layer, which is more realistic but adds a new dependency and setup surface (service worker/node interceptors) for a problem `vi.mock()` already solves given the single-client architecture here. Revisit only if the project later adds more third-party HTTP integrations worth intercepting uniformly.

## 4. Should Playwright run inside the Git hooks?

**Decision**: No. Playwright (or any full-browser E2E suite) is explicitly **excluded** from both the pre-commit and pre-push hooks. It remains a separate, manually-triggered command (e.g. `npm run test:e2e`), not part of this feature's automated gates.

**Rationale**:
- **Cost/speed mismatch with a local Git hook**: E2E suites spin up a real browser and (for this project) a running Next.js server, taking substantially longer than lint/type-check/unit — turning every commit or push into a multi-minute wait is the kind of friction that gets hooks disabled with `--no-verify`, defeating the point of having them.
- **No CI today**: this repository has no `.github/workflows` (or other CI config), so there is no hosted runner to absorb that cost either — it would run entirely on the developer's own machine, on every commit.
- **Coverage overlap is low, not zero**: per Section 2, Playwright is genuinely the only tool here that exercises the async Server Component pages end-to-end, so it has real value — just not at every-commit granularity. It's better suited to a pre-release/manual check or a future CI stage than a pre-commit/pre-push gate.
- **Matches the user's own instinct**: the request already leaned toward "I can manually check by myself" — this research confirms that's the right default rather than a shortcut being taken.

**Alternatives considered**:
- **Run a trimmed/smoke-only Playwright subset in pre-push**: rejected for now — even a "smoke" run still needs a built/served app, which is materially slower than the build-completeness check already planned for pre-push, for overlapping signal (a broken build already fails pre-push without booting a browser).
- **Skip Playwright entirely, including manually**: rejected — Section 2 shows it's the only coverage path for async Server Components, so removing it entirely would leave those pages with zero automated coverage, manual or otherwise. Keeping it available (just outside the hooks) is the right balance.

## 5. Git hooks: Husky + lint-staged

**Decision**: Husky v9 (`.husky/pre-commit`, `.husky/pre-push`) + `lint-staged` for the file-scoped checks (ESLint, Prettier), with whole-project commands (`tsc --noEmit -p tsconfig.typecheck.json` — see §8 for why not the base config —, `vitest run`, `next build`) invoked directly from the hook scripts rather than through lint-staged.

**Rationale**: lint-staged is designed to run file-pattern-scoped tools (like ESLint/Prettier `--fix`) only against staged files, which is exactly what FR-008 (spec) asks for to keep pre-commit fast. Type-checking, the test suite, and the production build are whole-project operations by nature (a type error or test failure elsewhere in the project is still a real problem even if the file that broke it isn't staged), so those run unscoped, directly from the hook script, not through lint-staged.

**Alternatives considered**:
- **pre-commit (Python tool)**: a capable cross-language framework, but the project is entirely JS/TS-tooled already (npm scripts, ESLint, no other language), so it would add a second, redundant hook-management ecosystem.
- **simple-git-hooks**: lighter-weight than Husky, but lacks Husky's install-on-`npm install` convention (`prepare` script), which is what FR-006 (automatic install for new contributors) relies on.

## 6. "TSLint" correction

**Finding**: The user's request mentions "tslint" for type-checking. TSLint has been deprecated since 2019 in favor of `typescript-eslint`, which this project's ESLint config already includes (`eslint-config-next/typescript` in `eslint.config.mjs`). There is nothing separate to add for "TSLint" as a tool.

**Decision**: Interpret "tslint" as the two things it maps to in this stack: (a) the TypeScript-aware ESLint rules already wired into `eslint.config.mjs` (covered by the existing `npm run lint` in both hooks), and (b) a dedicated `tsc --noEmit` type-check step (not currently a package.json script), added as its own hook step since ESLint's TS rules do not perform full program type-checking on their own. That step must not use the base `tsconfig.json` — see §8.

## 7. Prettier

**Finding**: No Prettier config or dependency currently exists in the project (`package.json`, root directory both checked). Formatting is presently unenforced.

**Decision**: Add `prettier` as a new dev dependency with a project config (`.prettierrc`) consistent with the existing code style (double quotes, semicolons, as seen throughout `src/`), plus `eslint-config-prettier` to disable any ESLint formatting rules that would conflict with Prettier's own formatting.

## 8. Type-checking must not read `.next/` (verified failure)

**Finding**: `tsc --noEmit` against the base `tsconfig.json` **fails on this repo today**, before any of this feature is implemented. `tsconfig.json` includes `.next/types/**/*.ts`, and a `.next/` left over from an earlier route layout (before the `(site)` route group) still references paths that no longer exist:

```
.next/types/validator.ts(89,39): error TS2307: Cannot find module '../../src/app/page.js'
.next/types/validator.ts(134,39): error TS2307: Cannot find module '../../src/app/api/contact/route.js'
```

Ten errors, none of them about the source code. Wiring the hook to plain `tsc --noEmit` would block the very first commit for a reason unrelated to the change being made — the exact friction that gets hooks bypassed with `--no-verify` (same argument as §4).

**Decision**: add `tsconfig.typecheck.json`, which extends the base config but drops `.next/types/**/*.ts` from `include` (an extending config *replaces* `include` rather than merging it) and excludes `.next` and `.claude` outright. The `typecheck` script and both hooks use `-p tsconfig.typecheck.json`. The base `tsconfig.json` is left untouched, so the editor and `next build` keep their generated route type-safety.

**Verified**: `npx tsc --noEmit -p tsconfig.typecheck.json` exits 0 on the current tree, and still exits 2 on an injected `const x: number = "str"` — so it is a real gate, not a config that silently checks nothing.

**Alternatives considered**:
- **Delete `.next/` inside the hook before type-checking**: correct but slow — it throws away the incremental build cache on every commit.
- **Run `next build` before `typecheck`**: makes pre-commit as slow as pre-push, and pre-commit is explicitly not supposed to build (FR-007 / contracts).
- **Remove `.next/types` from the base `tsconfig.json`**: rejected — that would lose route type-checking in the editor and during `next build`, a real safety net, to fix a problem that only affects the hook.

## 9. Prettier formats, it does not gate

**Finding**: spec FR-003 originally required the commit to be *blocked* on a formatting failure, while data-model.md specified `prettier --write` in lint-staged. Those cannot both hold: `--write` rewrites the file and exits 0, so it never blocks.

**Decision**: keep `--write` and correct the requirement (now FR-003a). lint-staged re-stages the files it rewrites, so the formatted content is what gets committed — no commit enters history unformatted, which is the outcome the blocking check was reaching for, reached without making the developer fix by hand and commit twice. `prettier --check` stays available as the `format:check` script for manual or future-CI use, and is deliberately not in either hook.

**Alternatives considered**:
- **`prettier --check` in lint-staged**: rejected. It blocks the commit to tell the developer to run a command that the hook could simply have run for them.
