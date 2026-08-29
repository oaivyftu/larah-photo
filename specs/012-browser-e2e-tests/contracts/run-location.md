# Contract: Run Location

**Feature**: 012-browser-e2e-tests | **Date**: 2026-08-29

FR-004: "The suite MUST NOT run as part of the commit gate, and MUST NOT be
required for a routine push. **Where it does run MUST be written down, with the
reason.**" This file is that statement. SC-006 requires it to be discoverable
from the project's own contributor documentation, so it is also summarised in
`README.md` and `AGENTS.md`; this is the long form both point at.

---

## The statement

**The browser end-to-end suite runs when a person runs it, and nowhere else.**

```bash
npm run test:e2e
```

It does not run on `git commit`. It does not run on `git push`. It is not
required for either, and no hook may be changed to require it without amending
this file and the constitution's Principle V alongside it.

---

## Where it does run

| Situation                                                                                           | Runs? | Who triggers it                                        |
| --------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| While changing the gallery, the page transition, the pointer follower, or a route's entry animation | Yes   | The author, before opening the PR                      |
| Before a release                                                                                    | Yes   | The person releasing, against a fresh production build |
| After upgrading GSAP, Flickity or Next.js                                                           | Yes   | Whoever ran the upgrade                                |
| `git commit`                                                                                        | No    | —                                                      |
| `git push`                                                                                          | No    | —                                                      |
| Continuous integration                                                                              | N/A   | There is no pipeline                                   |

The first three are expectations on people, not mechanisms. That is a real
weakness and naming it is part of the contract: nothing forces this suite to
run. What the project gets in exchange is that the commit and push gates stay
as fast as they are today (SC-005), which is what keeps them from being
bypassed.

---

## Why not in a hook

Three reasons, in the order they matter:

1. **There is no CI, so a hooked run is paid entirely by the developer.** Every
   push would boot a browser and a production server on the machine of whoever
   is pushing. The existing push gate already runs lint, type-check, the audit,
   the whole Vitest suite and `next build`; adding a browser run on top changes
   the cost of pushing by a different order of magnitude, for a signal that
   changes far less often.
2. **This was already decided, twice.** Feature 009's FR-007 requires that
   neither Git hook depend on browser tests and says in the same sentence that
   E2E "remains available as a separate, manually- or CI-triggered process
   outside these hooks". The constitution's Principle V says E2E "is
   deliberately excluded from the commit and push gates and stays a manual
   command." This feature fulfils what both anticipated rather than reversing
   either.
3. **A gate people skip is worse than no gate.** The project already learned
   this from the design-system audit, which was deliberately kept out of the
   hooks until the tree passed it, because a check that fails on every run is
   noise a developer learns to bypass. A slow gate produces the same habit by a
   different route, and `--no-verify` is final here — nothing downstream
   re-runs what a bypass skipped.

---

## What the hooks still do to this suite

Excluded from the hooks is not excluded from the gates, and the difference is
deliberate:

| Check                         | Covers `e2e/`? | Why                                                        |
| ----------------------------- | -------------- | ---------------------------------------------------------- |
| `npm run typecheck`           | Yes            | `tsconfig.typecheck.json` includes `**/*.ts`               |
| `npm run lint`                | Yes            | Nothing in `eslint.config.mjs` ignores `e2e/`              |
| `npm test` (Vitest)           | No             | `vitest.config.mts` includes only `src/**/*.test.{ts,tsx}` |
| `npm run audit:design-system` | No             | No stylesheets in `e2e/`                                   |
| `npm run build`               | Yes            | `next build` type-checks the project, and `e2e/` is in it  |

So a spec file that does not compile, or that trips a lint rule, still fails the
commit — verified by putting a type error in `e2e/gallery.spec.ts` and watching
`npm run typecheck` reject it. Only _executing_ the suite is manual. This is the
correct split: the checks that cost milliseconds stay automatic, the one that
costs minutes stays deliberate.

The build row is a correction. This table first said `next build` does not cover
`e2e/`, on the reasoning that the suite is not part of the app bundle. True, and
irrelevant: `next build` runs its own TypeScript pass over the project, and the
base `tsconfig.json` includes `**/*.ts`. It was found the way these things
usually are — a type error in `e2e/support/variants.ts` failed a build that had
nothing to do with it.

Two directories of generated output — `playwright-report/` and `test-results/` —
must be ignored by Git **and** by ESLint. They contain bundled JavaScript, so
without the ESLint ignore the next `npm run lint` lints Playwright's own report
and the push gate fails on code nobody wrote.

---

## The revisit condition

**Reconsider this contract the day the project gains a CI pipeline.**

At that point the run cost moves off the developer's machine and the argument in
reason 1 stops holding. What should then be reconsidered together:

- Running the suite on pull requests (and only there — still not on `commit`).
- Adding the `firefox` and `webkit` projects that
  [research.md §3](../research.md) leaves out for the same cost reason. WebKit
  is the stronger of the two: `WorkProjectGalleryClient.tsx` already carries a
  comment about Safari not focusing a button on click, which is evidence of a
  divergence this project has actually hit.

Recorded here so that the reason to revisit is inherited rather than
rediscovered, which is the whole point of writing a run location down.

---

## Changing this contract

Moving the suite into a hook, or making it required for a push, is a change to
Principle V of the constitution as well as to FR-004 and SC-005 of this spec.
It needs all three updated in the same change, with the rationale. A hook edit
on its own is a defect, and `specs/012-browser-e2e-tests/` is where a reviewer
should look to find that out.
