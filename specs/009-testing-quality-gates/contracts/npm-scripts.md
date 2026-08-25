# Contract: package.json Scripts & Hook Interface

This feature's "interface to other systems" is the set of npm scripts and Git hooks a developer (or a future CI system) invokes. This contract fixes their names and exit-code semantics so tasks/implementation stay consistent with the spec's requirements.

## npm scripts

| Script | Command (indicative) | Exit 0 means | Used by |
|---|---|---|---|
| `test` | `vitest run` | All unit + mock tests passed | pre-commit, pre-push, manual |
| `test:watch` | `vitest` | — (interactive, not used by hooks) | manual dev loop |
| `typecheck` | `tsc --noEmit -p tsconfig.typecheck.json` | No TypeScript type errors project-wide | pre-commit, pre-push, manual |
| `lint` | `eslint` (existing — unchanged, no path argument) | No lint **errors**; warnings do not fail the run | manual, CI-equivalent to lint-staged's scoped run |
| `format` | `prettier --write .` | — | manual |
| `format:check` | `prettier --check .` | All files match Prettier formatting | manual / future CI only — **not** used by either hook (see below) |
| `test:e2e` | `playwright test` (if/when added) | All E2E scenarios passed | **manual only** — not wired into any Git hook (research.md §4) |
| `prepare` | `husky` | Hooks installed into `.husky/` | automatically on `npm install` (FR-006) |

### Open decision: do warnings block?

`eslint` exits 0 on warnings. The repo currently emits exactly one
(`'InquiryForm' is defined but never used` in
`src/app/(site)/contact/ContactExperience.tsx` — dead code, see
`specs/005-contact-page/spec.md` Assumptions), so a hook running plain `lint`
would pass today. Adding `--max-warnings=0` would make that warning block every
commit until the dead import is removed. Not decided here; implementation must
pick one deliberately rather than inheriting whichever behaviour falls out.

## Git hooks

### `.husky/pre-commit`

- **Trigger**: `git commit` (any commit, any branch).
- **Contract**: exits non-zero (blocking the commit) if any of — staged-file ESLint, project-wide `typecheck`, project-wide `test` — fails. Exits 0 otherwise.
- **Formatting is not a gate**: lint-staged runs `prettier --write` on staged files and lint-staged re-stages what it rewrote, so the formatted result lands in the commit. Prettier therefore never blocks a commit (spec FR-003a). `prettier --check` / the `format:check` script is deliberately **not** wired into this hook — it would force the developer to fix by hand and re-run what `--write` already fixed, for no additional guarantee.
- **MUST NOT** invoke `test:e2e` or `build` (spec FR-007; pre-push owns the build check).

### `.husky/pre-push`

- **Trigger**: `git push` (any push, any branch/remote).
- **Contract**: runs the same checks as `pre-commit`, plus `next build`. Exits non-zero (blocking the push) if any step fails, including the build. Exits 0 otherwise.
- **MUST NOT** invoke `test:e2e` (spec FR-007; Playwright stays manual/CI-only per research.md §4).

## Failure reporting contract (spec FR-005)

Every hook step MUST run as a separate command invocation (not chained silently with `&&` inside a single opaque wrapper without labeling) so that when a step fails, the developer's terminal output identifies which named step (lint, typecheck, test, build) produced the failure — satisfying "developer can identify which specific check failed within the hook's own output" (SC-004). Formatting is absent from that list because it corrects rather than fails (FR-003a).
