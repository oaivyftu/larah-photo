# Quickstart: Testing & Git Quality Gates

Validates that the feature works end-to-end once implemented. Assumes `npm install` has already been run (which also installs the Husky hooks per FR-006).

## Prerequisites

- Dependencies installed: `npm install` (installs Vitest, Testing Library, Prettier, Husky, lint-staged, and runs `prepare` to wire up `.husky/`).
- A clean git working tree on a scratch branch (these scenarios intentionally create failing commits/pushes).

## Scenario 1 — Unit + mock test suite runs and passes

```bash
npm test
```

**Expected**: Vitest reports both a unit test (e.g. a `src/utils/*` formatter) and a mock test (e.g. `src/sanity/fetchers.ts` with the client mocked) passing, with zero real network calls made. Exit code 0.

## Scenario 2 — Pre-commit blocks a lint/type/test failure

```bash
# Introduce one failure at a time and confirm each is caught:
git add -A && git commit -m "test: trigger pre-commit"
```

**Expected**, one at a time:

- A lint violation ESLint cannot auto-fix → blocked, hook output names the ESLint step.
- A type error (assign a `string` to a `number`-typed variable) → blocked by `typecheck`.
- A broken expectation in an existing test → blocked by `test`.

**Then**: revert all injected failures, commit again → commit succeeds.

## Scenario 2a — Formatting is corrected, not blocked (FR-003a)

```bash
printf 'const   x =    1\n' >> src/utils/formatWorkCategory.ts   # badly formatted, still valid
git add -A && git commit -m "test: formatting is auto-applied"
git show --stat HEAD && git diff HEAD -- src/utils/formatWorkCategory.ts
```

**Expected**: the commit **succeeds** (formatting never blocks), and the committed content is Prettier-formatted — `git diff HEAD` is empty, confirming lint-staged re-staged what Prettier rewrote rather than leaving the fix unstaged.

## Scenario 2b — Type-check is independent of build state (research.md §8)

```bash
rm -rf .next
npm run typecheck   # tsc --noEmit -p tsconfig.typecheck.json
```

**Expected**: exit 0 with no `.next/types/validator.ts` TS2307 errors, whether `.next/` is absent, fresh, or stale. Running it against the base config (`npx tsc --noEmit`) on a stale `.next/` is what fails — that contrast is the point of the separate config.

## Scenario 3 — Pre-push blocks a build failure that passes pre-commit

```bash
# Introduce a change that type-checks and passes tests/lint but breaks `next build`
# (e.g. reference an undefined env-derived constant only evaluated at build time)
git commit -am "test: trigger pre-push build failure" --no-verify  # bypass pre-commit intentionally for this isolated scenario
git push
```

**Expected**: Push is blocked; hook output identifies the `next build` step as the failure, distinct from lint/type/test. Revert the change, push again → push succeeds (assuming pre-commit's checks also pass on the real attempt).

## Scenario 4 — New contributor gets hooks with zero manual setup

```bash
# From a fresh clone:
npm install
git commit --allow-empty -m "test: hooks fire without manual husky install"
```

**Expected**: The pre-commit hook fires (visible output from lint-staged/typecheck/test steps) even though no one ran a separate `husky install` command — confirms FR-006.

## Scenario 5 — Playwright is not part of either hook

```bash
# Comments are stripped first: both hooks *mention* Playwright to explain why
# it is excluded, and that explanation is evidence of compliance, not a breach.
# What matters is that no line either hook executes invokes a browser suite.
grep -rhv '^\s*#' .husky/pre-commit .husky/pre-push | grep -i "playwright\|e2e\|cypress"
```

**Expected**: No matches. No E2E command is executed by either hook — confirms FR-007 / research.md §4. Note that no `test:e2e` script exists in `package.json` yet either: Playwright has not been adopted, only reserved as the future home for async-Server-Component coverage (research.md §2). Add the script alongside Playwright itself, not before.

## Reference

- Script/hook names and exit-code contract: [contracts/npm-scripts.md](./contracts/npm-scripts.md)
- Test/config artifact shapes: [data-model.md](./data-model.md)
- Framework and mocking decisions with rationale: [research.md](./research.md)
