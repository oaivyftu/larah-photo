# Quickstart: Browser End-to-End Tests

**Feature**: 012-browser-e2e-tests | **Date**: 2026-08-29

How to run the suite, and how to prove it is worth having. Phase 1 output —
this is the validation guide, not the implementation; the work itself is in
`tasks.md`.

---

## Prerequisites

Nothing beyond what the project already required.

```bash
npm install
```

That is the whole setup. `npm install` brings in `@playwright/test` and its
`postinstall` script fetches the Chromium binary, the same way `prepare` already
installs the Git hooks — FR-006 says no manual setup beyond what the project
already requires, and a second command you have to be told about is exactly the
manual setup it forbids.

The cost is honest rather than hidden: that is a one-time download of roughly
150 MB, paid by every contributor whether or not they ever run the suite. Anyone
who does not want it can skip it:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
```

and fetch it later with `npx playwright install chromium`. If the browser is
missing when the suite runs, Playwright names it in the failure.

**Content is required.** These journeys need a rendering site, which needs a
content source (Principle I). Copy `.env.example` to `.env.local` and fill in
the Sanity values. If you skip this, the suite refuses to start and tells you
which variable is missing rather than producing nine assertion timeouts
(research.md §9).

---

## Run it

```bash
npm run test:e2e
```

That is the whole command (FR-006). It builds the app, starts it, runs nine
journeys under two motion preferences in Chromium, and stops the server. If
anything is already listening on port 3000 it is reused instead of building —
faster, and a weaker signal.

**Know when the reuse is lying to you.** A server left running from an earlier
session serves the code as it was then. Any run that has to reflect a change you
just made — above all the SC-007 check in scenario 4 — forces a fresh build:

```bash
E2E_FRESH_BUILD=1 npm run test:e2e
```

Other useful variations, all documented in `README.md`:

```bash
npm run test:e2e -- --headed
```

```bash
npm run test:e2e -- --ui
```

```bash
npm run test:e2e -- gallery
```

**It does not run on commit or push, and that is deliberate.** See
[contracts/run-location.md](./contracts/run-location.md) for where it does run
and why.

---

## Validation scenarios

Each one proves a success criterion. Run them in order the first time; after
that, scenario 1 is the routine and the rest are the ones to repeat when
something structural changes.

### 1. The suite passes on a clean tree — SC-001, SC-002, SC-003, SC-004

```bash
npm run test:e2e
```

**Expect**: 18 passing tests — the nine journeys of
[data-model.md](./data-model.md), each under `no-preference` and `reduce`. No
skips. The reduced-motion runs are named as such in the output, so SC-004 is
readable from the report rather than inferred.

### 2. A commit and a push are unchanged — SC-005

```bash
git commit --allow-empty -m "timing check"
```

```bash
git push --dry-run origin HEAD
```

**Expect**: neither hook boots a browser. `pre-commit` still prints
lint-staged, typecheck, design-system; `pre-push` still prints lint, typecheck,
test, design-system, build. Wall-clock time is within noise of what it was
before this feature.

**Also expect**, and this is the half that is easy to miss: both hooks still
type-check and lint `e2e/`. Introduce a type error into a spec file and the
commit fails. Excluded from the hooks means not _executed_ by them, not
invisible to them.

### 3. The run location is discoverable — SC-006

Ask the question a new contributor would, from the documentation alone:

- `README.md` → the quality-gates table lists `npm run test:e2e` beside
  `npm test`, and the paragraph below says it is not in either hook, and why.
- `AGENTS.md` §5 → the "Before you call it done" block names it as the command
  to run when the change touches the gallery, the transition, the pointer
  follower or a route's entry animation.
- Both point at [contracts/run-location.md](./contracts/run-location.md) for the
  long form.

**Expect**: three places, one answer, no contradiction. While you are there:
`README.md` currently claims the test suite runs on commit. It has run on push
since the constitution's v2.2.1 amendment. Fix it in the same pass — a document
that is wrong about one gate is not evidence for another.

### 4. A broken behaviour actually fails — SC-007

The one scenario that proves the suite is more than green decoration. Do this
once, by hand, and record the result.

Break one thing, on a clean tree, in an edit you will throw away: remove the
`onClick={onNext}` handler from the float nav's next control in
`src/components/work/WorkProjectGallery/WorkProjectGalleryClient.tsx`, or delete
the `ArrowLeft`/`ArrowRight` branch of the lightbox key handler in the same
file.

```bash
E2E_FRESH_BUILD=1 npm run test:e2e -- gallery
```

`E2E_FRESH_BUILD=1` is load-bearing here, not decoration: without it a server
still listening from an earlier run serves the unbroken build, the suite passes,
and the one check that proves this suite is worth having proves the opposite of
what it claims.

**Expect**: J1 (or J2) fails, and the failure message names what it expected —
the selected figure's `aria-label` moving from "1 of N" to "2 of N" — and what
it found, which is that it did not move. Not a bare timeout (FR-005).

Restore the file with `git checkout -- <path>` and re-run to confirm it passes
again. Record the observed failure output in the PR description; SC-007 asks for
this demonstrated once, not assumed.

### 5. Nothing is asserted on one route while copies go untested — SC-008

```bash
grep -rn "yPercent: 115" src
```

**Expect**: one hit, in `src/utils/usePageIntro.ts`. Before this feature there
were four — About, Service, Contact and Work each carried a byte-identical copy
of the page-heading reveal, so a test on one route would have reported success
while three drifted (research.md §10).

Then read the ledger at the end of [data-model.md](./data-model.md): every row's
"definitions after" column must read 1.

### 6. Reduced motion is real, not simulated — SC-004, Principle II

```bash
npm run test:e2e -- --grep "reduce"
```

**Expect**: passing, and — the part that matters — passing for the right reason.
Confirm by reading one spec: the preference is set with
`test.use({ reducedMotion: "reduce" })`, which emulates it at the browser level.
Nowhere in `e2e/` is `window.matchMedia` assigned to. If it were, the test would
be asserting that the code reads a preference rather than that it honours one,
which is the thing the unit suite already does and the thing this feature exists
to stop being satisfied by.

---

## When a journey fails

| Symptom                                                     | Look at                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Every journey fails before its first assertion              | Content. The global setup message names the missing environment variable              |
| Only the carousel journeys fail                             | Whether `flickity-enabled` ever landed — Flickity is dynamically imported             |
| Only the `reduce` variants fail                             | A `matchMedia` guard, most likely in `usePageIntro` or `GlassPointer`                 |
| J5 hangs and reports `pageTransition` never reached `ready` | The curtain covered and did not lift. This is the failure the feature was written for |
| J6 reports focus on `<body>`                                | Focus restoration after navigation — a real accessibility regression                  |
| A journey is flaky across runs                              | A `waitForTimeout` crept in. There should be none (research.md §12)                   |

---

## What this suite does not tell you

Worth reading before trusting a green run more than it deserves:

- **Nothing about appearance.** No colours, spacing or positions are checked
  (FR-009). A page can pass every journey and look wrong.
- **Nothing about the home page's scroll choreography, or the album layout's
  measurement code** — 54 of the 169 browser-coupled uncovered statements, against
  the 115 this suite does reach. Out of scope for this feature because FR-002
  does not name them and no user story describes them; recorded in the spec's
  Assumptions and research.md §11 as the obvious next feature rather than left to
  be discovered as a gap.
- **Nothing about Firefox or Safari.** Chromium only, for run-cost reasons
  (research.md §3). WebKit is the first engine to add if that changes.
- **Nothing about content failures.** Already covered without a browser in
  `src/sanity/fetchers.test.ts`; duplicating it here would be slower and no
  stronger.
