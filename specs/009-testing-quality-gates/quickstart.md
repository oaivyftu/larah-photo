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

## Scenario 2 — Pre-commit blocks a lint/format/type/test failure

```bash
# Introduce one failure at a time and confirm each is caught:
echo "const x=1" >> src/utils/formatWorkCategory.ts   # lint/format violation
git add -A && git commit -m "test: trigger pre-commit"
```

**Expected**: Commit is blocked; hook output names the failing step (ESLint or Prettier). Revert the change, repeat by introducing a type error (assign a `string` to a `number`-typed variable) → blocked by `typecheck`. Repeat by breaking an existing test's expectation → blocked by `test`.

**Then**: revert all injected failures, commit again → commit succeeds.

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
grep -r "playwright" .husky/ 2>/dev/null
```

**Expected**: No matches. `test:e2e` (or equivalent) exists as a standalone `package.json` script but is not referenced by `.husky/pre-commit` or `.husky/pre-push` — confirms FR-007 / research.md §4.

## Reference

- Script/hook names and exit-code contract: [contracts/npm-scripts.md](./contracts/npm-scripts.md)
- Test/config artifact shapes: [data-model.md](./data-model.md)
- Framework and mocking decisions with rationale: [research.md](./research.md)
