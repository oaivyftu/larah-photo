# Contract: Run Location

**Feature**: 012-browser-e2e-tests | **Created**: 2026-08-29 | **Amended**: 2026-08-31

FR-004: "The suite MUST NOT run as part of the commit gate. It MUST run as part
of the push gate. Where it does and does not run MUST be written down, with the
reason." This file is that statement. SC-006 requires it to be discoverable
from the project's own contributor documentation, so it is also summarised in
`README.md` and `AGENTS.md`; this is the long form both point at.

**This is the second version of this contract.** The first kept the suite
manual-only, with the same status as `--headed` or `--ui`: something a person
types. Constitution v2.3.0 reversed that. The reasoning for the first version is
kept below, in **Why it was manual-only until 2026-08-31**, because it was
correct when written and most of it is still true — what changed is a judgement
call sitting on top of it, not the facts underneath.

---

## The statement

**The browser end-to-end suite runs automatically on `git push`, and only
there.**

```bash
PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e
```

is what `.husky/pre-push` runs. A push whose suite fails does not leave the
machine, the same guarantee `npm test` and `npm run build` already give.

It does **not** run on `git commit` — a browser suite is too slow to pay on
every small commit, the same reasoning that already keeps `npm test` out of
`pre-commit`. And a person can still run it directly, any time:

```bash
npm run test:e2e
```

for a manual check before opening a PR, with `--headed`, `--ui`, or a `--grep`
filter — see `README.md`.

---

## Where it does run

| Situation                                                                                           | Runs?                                                                  | Who / what triggers it                |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| `git push`                                                                                          | Yes, automatically                                                     | `.husky/pre-push`                     |
| `git commit`                                                                                        | No                                                                     | —                                     |
| Manually, any time                                                                                  | Yes, on request                                                        | `npm run test:e2e`, typed by a person |
| While changing the gallery, the page transition, the pointer follower, or a route's entry animation | Yes, twice — once manually while iterating, once automatically at push | The author, then the hook             |
| Continuous integration                                                                              | N/A                                                                    | There is no pipeline                  |

---

## Why it moved to the push gate

The push hook already runs the two slowest checks in the project — `npm test`
and `npm run build` — because a signal that only fires once per push is still
strong enough to keep a broken change off a shared branch, and paying it on
every commit would be worse. The E2E suite is the same shape of check, just
slower again, and it earned the same treatment by doing what a gate is supposed
to do: catching something the faster checks could not.

**The specific evidence.** The review round on
[PR #26](https://github.com/oaivyftu/larah-photo/pull/26) — the same PR that
first shipped this suite — found two things that a green `npm test` and a green
`npm run build` both missed:

1. **A real accessibility regression.** `PageTransition` lost the ability to
   move keyboard focus into a newly-loaded page whenever a visitor clicked a
   link within 780ms of the page loading — hitting reduced-motion visitors
   hardest, since their content appears immediately and they click sooner. The
   unit suite could not see this because it depends on the App Router's actual
   navigation lifecycle timing, which jsdom does not have.
2. **A test that could not fail.** One of the nine journeys asserted only the
   _finished_ state of an entrance animation, which is indistinguishable from a
   page that never had one. Demonstrated by deleting the animation and watching
   the suite stay green.

Both were caught by _running the suite_, not by writing it — which is the
argument for making that running automatic rather than optional. A suite that
only executes when someone remembers to type the command is a suite that can
silently stop protecting anything, and there would be no signal that it had.

**What did not change.** There is still no CI pipeline. This cost is still paid
entirely on the machine of whoever is pushing, not amortised across a shared
runner. That fact was the whole argument for keeping the suite manual in the
first version of this contract, and it has not gotten weaker — it has been
outweighed, not refuted. Recording that plainly here is the difference between
a decision and a correction: nothing was factually wrong before, a different
trade was made this time. See the constitution's Sync Impact Report (2.3.0) for
the same argument in that document's own voice.

---

## What the hook actually runs, and why it differs from the plain command

```bash
PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e
```

not the bare `npm run test:e2e` a person would type. Two deliberate departures:

- **`E2E_FRESH_BUILD=1`** forces Playwright to build and start its own server
  rather than reusing whatever answers on the port. A push gate that reused a
  stray server would be testing whatever that server happened to be serving —
  possibly a different branch, possibly stale code — instead of the change
  actually being pushed. That defeats the entire point of a gate.
- **`PORT=3100`** moves the suite off the default port so the hook cannot fail
  with `EADDRINUSE` just because a developer has `npm run dev` open in another
  terminal, or another Git worktree's dev server is holding 3000. This is not a
  hypothetical: building this feature hit that exact collision once, and it
  silently pointed the browser at another worktree's server for an entire run
  (see `research.md` §8's account of it).

`.env.local` must still be configured with working Sanity credentials for the
hook to pass — but this is not a new requirement the E2E step introduces. The
`build` step immediately before it in the same hook already needs those
credentials to statically generate the work pages, so a push that could not
have built before this change cannot push now either.

---

## What the hooks do to the suite regardless of whether they execute it

Independent of the question above, both hooks type-check and lint `e2e/`
because nothing excludes that directory from `tsconfig.typecheck.json` or
`eslint.config.mjs`. So a spec file that does not compile has always failed
`pre-commit`, before this amendment and after it — verified by putting a type
error in `e2e/gallery.spec.ts` and watching `npm run typecheck` reject it. What
this amendment changes is whether the suite's tests are _executed_, which used
to happen only on request and now also happens on every push.

`next build`'s own TypeScript pass also covers `e2e/`, for the same reason —
found the way these things usually are, when a type error in
`e2e/support/variants.ts` failed a build that had nothing to do with it.

Two directories of generated output — `playwright-report/` and `test-results/`
— are ignored by Git **and** by ESLint. They contain bundled JavaScript, so
without the ESLint ignore a run's own report would fail the next lint pass on
code nobody wrote.

---

## Why it was manual-only until 2026-08-31

Kept for the reasoning, not as the current state — everything below describes a
position this contract no longer holds.

1. **There is no CI, so a hooked run is paid entirely by the developer.** Every
   push would boot a browser and a production server on the machine of whoever
   is pushing. The existing push gate already ran lint, type-check, the audit,
   the whole Vitest suite and `next build`; adding a browser run on top changed
   the cost of pushing by a different order of magnitude, for a signal that
   changed far less often. _(Still true. See "What did not change" above — this
   was outweighed, not disproven.)_
2. **This was already decided, twice.** Feature 009's FR-007 required that
   neither Git hook depend on browser tests. The constitution's Principle V said
   E2E "is deliberately excluded from the commit and push gates and stays a
   manual command." Feature 012 was written to fulfil what both anticipated
   rather than reverse either. _(This amendment is what changed that — a third,
   explicit decision, not a quiet reversal of the first two.)_
3. **A gate people skip is worse than no gate.** The project had already learned
   this from the design-system audit, kept out of the hooks until the tree
   passed it, because a check that fails on every run is noise a developer
   learns to bypass. _(The mitigation for moving E2E in anyway: the suite had
   already been proven stable — 18/18 passing, demonstrated failing correctly
   when broken on purpose — before this amendment, which is the same bar the
   audit had to clear first.)_

---

## The revisit condition, updated

The original revisit condition was "the day the project gains a CI pipeline."
That day still matters, but for a different reason now: once CI exists, the
cost this contract accepts — every push paying for a browser run on the
developer's own machine — can move to a shared runner instead, which is worth
doing regardless of whether the suite stays in the hook. At that point,
reconsider together:

- Running the suite in CI instead of (or in addition to) the local hook.
- Adding the `firefox` and `webkit` projects that
  [research.md §3](../research.md) leaves out for cost reasons — cheap on a
  shared runner, expensive on a laptop.

If the push-time cost ever becomes the wrong trade again — flakiness, a growing
journey count, a runner arriving that makes local execution redundant — moving
it back to manual-only is a legitimate direction too, and follows the same
process as this amendment did: constitution Principle V, this file's Statement,
`spec.md` FR-004/SC-005, `.husky/pre-push`, `README.md`, `AGENTS.md`, all in one
change.

---

## Changing this contract

Moving the suite to a different gate — back to manual, or into CI once one
exists — is a change to Principle V of the constitution as well as to FR-004
and SC-005 of this spec, and to `.husky/pre-push` itself. It needs all three
updated in the same change, with the rationale. A hook edit on its own is a
defect, and `specs/012-browser-e2e-tests/` is where a reviewer should look to
find out why the hook looks the way it does.
