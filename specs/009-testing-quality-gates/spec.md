# Feature Specification: Testing & Git Quality Gates

**Feature Branch**: `009-testing-quality-gates`

**Created**: 2026-08-20

**Status**: Implemented 2026-08-24 — all 31 tasks. Vitest, Prettier and both Git hooks are in the tree.

**Input**: User description: "Add automated testing and Git quality gates: unit tests and mock tests for the application, plus Husky + lint-staged Git hooks. Pre-commit hook runs ESLint, Prettier, TypeScript type-checking, unit tests, and mock tests. Pre-push hook additionally verifies the production build completes successfully. Investigate whether Playwright end-to-end tests should be included in these hooks or left to manual/CI-only runs, given their AI-token/CI cost versus value."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Verify logic with an automated test suite (Priority: P1)

A developer changes application logic (a utility function, a data transform, a component that depends on the CMS client or other external calls) and runs the test suite locally to confirm the change works and hasn't broken anything else, without needing to manually click through the site for every change.

**Why this priority**: Without any automated tests, every other quality gate in this feature (pre-commit, pre-push) has nothing to run — the test suite is the foundation everything else checks.

**Independent Test**: Run the test suite from a clean checkout and confirm it executes both isolated-logic tests and tests that exercise code depending on external services (with those services mocked, not called for real), reporting clear pass/fail results.

**Acceptance Scenarios**:

1. **Given** a developer runs the project's test command, **When** it executes, **Then** it runs both unit tests (isolated logic with no external dependencies) and mock tests (code that depends on external services such as the CMS client, with those dependencies replaced by mocks) and reports pass/fail per test.
2. **Given** a test fails, **When** the run completes, **Then** the failure output identifies which test failed and why, without requiring the developer to add their own debugging.
3. **Given** the test suite runs, **When** it executes mock tests, **Then** no real network or CMS request is made — all external calls are intercepted and replaced with mock data.

---

### User Story 2 - Catch problems before they're committed (Priority: P2)

A developer runs `git commit`. Before the commit is created, their staged code is automatically reformatted, then linted, type-checked, and tested — if any of those three fail, the commit is blocked with a clear explanation of what to fix.

**Why this priority**: This is the first line of defense that keeps broken or inconsistent code out of history at all, but it depends on the test suite from User Story 1 already existing.

**Independent Test**: Introduce a lint violation, a type error, or a failing test on a branch, attempt to commit, and confirm the commit is blocked with a message identifying which check failed; then fix it and confirm the commit succeeds. Separately, stage a badly-formatted but otherwise valid file, commit, and confirm the commit succeeds _and_ the committed content is formatted.

**Acceptance Scenarios**:

1. **Given** a developer attempts to commit code with a linting violation, a type error, or a failing unit/mock test, **When** the commit is attempted, **Then** the commit is blocked and the developer sees which check failed.
   1a. **Given** a developer stages a file whose formatting does not match the project's style but which is otherwise valid, **When** the commit is attempted, **Then** the file is reformatted automatically, the reformatted content is what gets committed, and the commit is _not_ blocked.
2. **Given** a developer attempts to commit code that passes every check, **When** the commit is attempted, **Then** the commit proceeds without unnecessary delay.
3. **Given** a new contributor clones the repository and installs dependencies, **When** they later run `git commit`, **Then** the pre-commit checks run automatically, without any manual hook-installation step.

---

### User Story 3 - Catch problems before they're pushed (Priority: P3)

A developer runs `git push`, and in addition to the same checks as commit time, the project's production build is verified to complete successfully — if the build fails, the push is blocked.

**Why this priority**: This is a second, stronger gate that catches build-breaking issues (e.g. issues that only surface during a production build) before they reach a shared branch; it builds on, but is a smaller addition than, the pre-commit gate.

**Independent Test**: Introduce a change that passes every pre-commit check but breaks the production build, attempt to push, and confirm the push is blocked with a message identifying the build failure; then fix it and confirm the push succeeds.

**Acceptance Scenarios**:

1. **Given** a developer attempts to push commits, **When** the push is attempted, **Then** the same checks as pre-commit run again, plus a full production build, and the push is blocked if any of them fail.
2. **Given** the production build fails during a push attempt, **When** the failure is reported, **Then** the developer sees that the build step specifically failed, distinct from a lint/format/type/test failure.
3. **Given** all pre-push checks pass, **When** the push is attempted, **Then** it proceeds normally.

---

### Edge Cases

- What happens when a developer intentionally bypasses hooks (e.g. a standard Git bypass flag)? This remains the developer's explicit choice and is not something the hooks can or should prevent.
- What happens when there are no staged files relevant to a given check (e.g. no `.ts`/`.tsx` files staged)? That check MUST pass trivially rather than failing or erroring.
- What happens when the pre-commit and pre-push checks overlap (lint/format/type run at both stages)? Both stages MUST still run their full defined check set; pre-push is a superset of pre-commit, never a lighter version of it.
- What happens with end-to-end (full browser) tests? They are explicitly NOT part of the automated pre-commit or pre-push gates in this feature; see Assumptions for the rationale and how they remain available.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Project MUST have an automated unit test suite covering isolated application logic (functions/utilities with no external dependencies).
- **FR-002**: Project MUST have automated "mock" tests covering code that depends on external services (e.g. the CMS client, network requests, browser-only APIs), with those dependencies replaced by mocks so no real external call is made during the test run.
- **FR-003**: A pre-commit Git hook MUST run automatically on every commit attempt and MUST block the commit if linting or type-checking fails. The test suite is deliberately **not** part of this hook — it is the slowest check in the set and belongs to the push gate (FR-004), where it still runs before any code leaves the machine.
- **FR-003a**: Formatting MUST be applied automatically to staged files during the pre-commit hook, and the reformatted result MUST be included in the commit being created. Formatting is a _correction_ step, not a blocking gate: a developer MUST NOT have to fix formatting by hand and re-run the commit. Consequently no commit can enter history with unformatted content, which is the outcome a blocking format check would have aimed at.
- **FR-004**: A pre-push Git hook MUST run automatically on every push attempt and MUST block the push if any pre-commit-level check fails, if the unit or mock tests fail, or if the production build fails to complete.
- **FR-005**: Both hooks MUST report which specific check failed (lint, type-check, unit test, mock test, or build) so a developer can address it directly.
- **FR-006**: Hooks MUST be installed automatically as part of the project's standard dependency-installation step, requiring no separate manual setup by a new contributor.
- **FR-007**: Neither hook MUST require running full browser-based end-to-end tests; end-to-end testing remains available as a separate, manually- or CI-triggered process outside these hooks.
- **FR-008**: Checks that operate on file content (linting, formatting) SHOULD run only against the files staged for commit where practical, so the pre-commit hook stays fast; test and build checks run against the full project regardless.

### Key Entities

- **Unit Test**: An automated test of isolated application logic with no external dependencies.
- **Mock Test**: An automated test of code that depends on an external service or browser API, where that dependency is replaced with a mock/stub so the test runs without a real network or CMS call.
- **Pre-commit Gate**: An automatic formatting step applied to staged files, followed by the set of checks (lint, type-check) that must pass before a commit is created.
- **Pre-push Gate**: The pre-commit gate plus the test suite and a production build verification, run before code leaves the developer's machine.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of commits that fail linting or type-checking are blocked before entering history; and 100% of commits that enter history contain correctly formatted content, without the developer having formatted it by hand.
- **SC-002**: 100% of pushes that fail any pre-commit-level check, fail the test suite, or fail to build are blocked before reaching the remote.
- **SC-003**: A new contributor can go from cloning the repository to having working commit-time quality checks with zero manual hook-setup steps beyond the standard install command.
- **SC-004**: A developer can identify which specific check failed within the hook's own output, without needing to re-run checks individually to find out.
- **SC-005**: Routine commits and pushes that pass all checks complete without the developer needing to wait on a full end-to-end browser test run.

## Assumptions

- "Mock tests" refers to automated tests that exercise code with external dependencies (CMS client calls, network requests, browser-only APIs) replaced by mocks/stubs — not a separate testing framework from unit tests, but a distinct category of test target.
- Full end-to-end (real-browser) testing is deliberately excluded from both Git hooks in this feature. Given the project has no CI pipeline configured today, running a full browser suite on every commit/push would run entirely on the developer's machine (or consume paid CI/AI-agent minutes if later automated), for a signal that changes far less often than lint/type/unit feedback. This feature treats end-to-end testing as a manual, developer-triggered activity, revisited separately if/when a CI pipeline is introduced.

  **Superseded 2026-08-31** (constitution v2.3.0, Principle V): once feature 012 delivered the suite this assumption anticipated, it moved to `.husky/pre-push` — the reasoning above (no CI, cost falls on the pusher) is still accurate and was outweighed rather than disproven; see `specs/012-browser-e2e-tests/contracts/run-location.md` for the decision and the evidence behind it. This entry is left as written because it correctly describes what 009 shipped; it is not the current state.

- No CI pipeline currently exists in this repository; these Git hooks are the only automated quality gate in scope for this feature. CI-based enforcement (e.g. re-running the same checks on a hosted runner) is out of scope.
- Bypassing hooks via a standard Git override flag remains possible, as with any local Git hook; preventing bypass entirely would require server-side enforcement, which is out of scope.
