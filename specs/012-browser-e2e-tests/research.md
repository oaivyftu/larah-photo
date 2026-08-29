# Research: Browser End-to-End Tests

**Feature**: 012-browser-e2e-tests | **Date**: 2026-08-29

Phase 0 output. Each section resolves one unknown the Technical Context could
not answer from the spec alone.

---

## 1. The tool: Playwright Test

**Decision**: `@playwright/test` (1.62.1 at time of writing), installed as a dev
dependency, driving a real browser against a served build of this app.

**Rationale**: three things point at it and nothing points away.

- **The constitution already named it.** Principle V says "Playwright/E2E is
  deliberately excluded from the commit and push gates and stays a manual
  command." The tool choice was made when 009 shipped; what was deferred was
  adopting it. Picking something else now would mean amending the constitution
  for no gain.
- **This Next.js version ships a guide for it.** Principle VI requires consulting
  `node_modules/next/dist/docs/` rather than memorised conventions, and
  `01-app/02-guides/testing/playwright.md` exists alongside the `vitest.md` this
  project already followed for `vitest.config.mts`. The same directory's
  `index.md` says, of the exact gap this feature exists to close: async Server
  Components are better served by end-to-end testing than unit testing.
- **It answers FR-001 directly.** GSAP timelines, Flickity, `matchMedia`,
  scroll position and focus all behave as themselves, because they are running
  in a browser rather than against a substitute.

**Alternatives considered**:

| Option              | Rejected because                                                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cypress             | Also documented by this Next.js version, but its own guide there carries the caveat that it does not support async Server Components — the specific thing this suite must reach. Reduced-motion emulation is also not first-class. |
| WebdriverIO         | No Next.js guide in the pinned version, no advantage over Playwright for this shape of work, and a smaller amount of the project's existing documentation would apply.                                                             |
| Vitest Browser Mode | Genuinely the strongest alternative and treated as such — see §2.                                                                                                                                                                  |

**Dependency justification (FR-008, Technology Constraints)**: the stack does
not solve this problem. The existing runner is jsdom, which has no layout
engine, no compositor, no scrolling and no paint. The 169 uncovered
browser-coupled statements are unreachable there by construction, not by
omission — reaching them without a browser means replacing GSAP and Flickity
with stand-ins and asserting the stand-ins were called, which passes while the
gallery is broken. That is the case the constraint asks for.

---

## 2. Why not Vitest Browser Mode

**Decision**: not used. Playwright Test runs the suite; Vitest keeps the unit
and integration suite, unchanged.

**Rationale**: the constraint says a new dependency needs justification when the
stack already solves the problem, so the honest question is whether Vitest 4's
browser mode already does. It does not, for two reasons that are structural
rather than preferential:

- **It would not avoid the dependency.** Browser mode needs a provider, and that
  provider is Playwright (or WebdriverIO). The browser binaries and the driver
  arrive either way; the only thing at stake is which runner sits on top.
- **Its unit is a mounted component, not a served route.** Browser mode renders
  the component under test into a page that Vite serves. Three of this feature's
  targets are not components: the page-transition curtain is driven by
  `document.documentElement.dataset.pageTransition` set by the App Router's
  navigation lifecycle, the project preview is an intercepting route
  (`src/app/(site)/@modal/(.)work/[slug]`), and "an internal navigation
  completes" (US2) is a statement about the router, not about a tree. Mounting
  `WorkGalleryClient` in a browser proves more than mounting it in jsdom, but it
  still cannot navigate anywhere.

**Alternative considered**: run both — browser mode for the carousel, Playwright
for navigation. Rejected: two browser runners, two configs and two sets of
conventions for one suite of nine journeys, and the carousel journeys are the
ones that most need the real page (the pointer-idle timer, the nested lightbox,
the scroll container).

---

## 3. Browsers: Chromium only

**Decision**: one project in `playwright.config.ts`, Chromium, desktop viewport.
Firefox and WebKit are not configured.

**Rationale**: FR-002 asks for behavioural coverage, not compatibility coverage.
The Playwright guide's default of three engines triples install size, browser
download and wall-clock time for a suite that runs on a developer's machine on
demand — and every extra second of a manual command is a reason not to run it.
Cross-engine differences in Flickity and GSAP are real, but catching them is a
different goal with a different trigger (a library upgrade, not a feature
change), and buying it here would make the routine run three times slower for a
signal that changes far less often.

**Recorded so it is revisitable**: the day the project gains CI, adding
`firefox` and `webkit` projects is a config change of a few lines and the run
cost lands on the pipeline rather than the developer. That is the moment to
reconsider, and it is the same moment §7 names for moving the suite into a gate.

**Alternative considered**: Chromium + WebKit, on the argument that WebKit is
the engine behind Safari and the gallery's focus-restoration code already
carries a Safari-specific comment (`WorkProjectGalleryClient.tsx`: "Safari does
not focus a button on click"). Rejected for this feature but noted as the
strongest candidate if one engine is ever added — that comment is evidence of a
real, previously-hit divergence.

---

## 4. Reduced motion is set on the browser, not faked

**Decision**: `reducedMotion: "reduce"` as a Playwright context option, applied
per test file via `test.use({ reducedMotion: "reduce" })`.

**Rationale**: this is the whole point of US3. The unit suite can only reach the
reduced-motion branches by replacing `window.matchMedia`, which asserts that the
code reads a query, not that the browser answers it. Playwright emulates the
preference at the browser level, so `gsap.matchMedia()` in `usePageIntro` and
the `(prefers-reduced-motion: reduce)` branch in `GlassPointer` resolve the same
way they would for a visitor who set it in their OS.

**Consequence for structure**: a reduced-motion variant is the same journey with
a different expected ending (spec, Key Entities), so the journey body is written
once and imported into both a default-motion and a reduced-motion spec file
rather than copied. This is the same rule FR-007 applies to the app: one
definition, two call sites.

---

## 5. Journeys discover content; they never hardcode a slug

**Decision**: no test contains a project slug, a photograph count, or a piece of
copy. A journey that needs a project opens the work index and follows the first
project card; a journey that needs "the next photograph" reads the current index
from the gallery's own live region.

**Rationale**: Principle I makes Sanity the sole source of content, which means
every slug, title and gallery length is editor-owned and can change without a
code change. A test asserting `/work/coastal-morning` has six photographs is a
test that fails when an editor renames a project — a failure that reports
nothing about the software. FR-003 asks for outcomes a visitor could describe,
and "the photograph on screen changed" is describable without knowing which
photograph it was.

**Mechanically**: the gallery renders `Image {n} of {total}` into an
`aria-live="polite"` region and labels each slide
`` `${index + 1} of ${total}: ${alt}` ``. Both are content-shaped but
count-driven, so a journey can assert movement — from "1 of N" to "2 of N" —
without knowing N.

---

## 6. What "the photograph changed" is asserted on

**Decision**: the selected slide's identity, via Flickity's `is-selected` class
on the `<figure>` cell and that figure's `aria-label`. Never a screenshot, never
a pixel, never a computed transform.

**Rationale**: FR-009 excludes visual assertions, and a transform value would be
a visual assertion wearing a DOM disguise — it fails on an easing change that
breaks nothing. The selected cell is the carousel's own statement about which
photograph is current, it is what the accessible name exposes to a screen
reader, and it is what a visitor would describe. It also happens to be the thing
that stops being true when Flickity fails to initialise, which is the failure
this suite exists to catch.

**Confirmed against the source**: `GallerySlide` renders a `<figure>` as a
direct child of the carousel `<div ref={carouselRef}>`, so the figures _are_ the
Flickity cells and `is-selected` lands on them.

**Alternative considered**: asserting on `currentIndex` via a test-only data
attribute. Rejected — it would mean adding a hook to production markup whose
only reader is the test, and it would report React state rather than what the
carousel actually did. If those two ever disagree, the bug is exactly the one
worth catching, and this assertion catches it while the state-reading one does
not.

---

## 7. Where the suite runs, and where it deliberately does not

**Decision**: `npm run test:e2e`, invoked by a person. Not in `.husky/pre-commit`,
not in `.husky/pre-push`, not in any hook. Written down in README.md and
AGENTS.md with the reason (FR-004, SC-005, SC-006).

**Rationale**: unchanged from 009's, and 009's reasoning still holds. There is
no CI pipeline, so a browser run in a hook executes entirely on the developer's
machine, for a signal that changes far less often than lint, type and unit
feedback, and it needs a booted app that a broken build would have failed
without. A push-time gate needs a pipeline to justify it, and introducing one is
a larger decision than this feature should make.

**The statement of run location is itself the deliverable.** FR-004's second
sentence — "Where it does run MUST be written down, with the reason" — makes the
Run location a Key Entity, so it gets a written home rather than living in a
commit message. See `contracts/run-location.md`.

**Recorded revisit condition**: if CI arrives, the reason to reconsider is
already on the record rather than needing rediscovery. The same trigger applies
to §3's browser matrix.

**A property worth naming**: the suite is excluded from the _hooks_, not from
the _gates_. `tsconfig.typecheck.json` includes `**/*.ts` and ESLint lints
everything outside its ignore list, so `e2e/*.spec.ts` is type-checked and
linted by both hooks even though it is never executed by them. A spec file that
does not compile cannot be committed. That is the right split: the cheap checks
stay automatic, the expensive one stays deliberate.

---

## 8. The server the suite drives

**Decision**: Playwright's `webServer` runs `npm run build && npm run start`,
with `reuseExistingServer: !process.env.E2E_FRESH_BUILD` — so a server already
listening on 3000 is used by default, and `E2E_FRESH_BUILD=1` forces a build.

**Rationale**: the Next.js guide recommends running against production code, and
here that is more than a general preference — the page-transition curtain and
the intro timelines are sensitive to hydration timing, and dev-mode
double-rendering under React Strict Mode is exactly the kind of difference that
produces a suite passing on one and failing on the other. Production is the
behaviour worth asserting.

Reuse defaults to on — rather than the guide's `!process.env.CI`, which with no
CI (§7) would mean never reusing — because the common case is a developer with
the dev server already up who wants the run to start now rather than after a full
build.

**The escape hatch is not optional convenience, it is a correctness guard.** A
reused server is a weaker signal than a fresh production build, and there is one
case where it is actively wrong: the SC-007 demonstration deliberately breaks a
behaviour and expects the suite to fail. If a `next start` from an earlier run is
still listening, Playwright reuses it, the browser gets the pre-break build, and
the suite passes — the one check that proves this suite is worth having would
report the opposite of the truth. `E2E_FRESH_BUILD=1` exists for that, and the
task that performs the demonstration uses it.

A plain boolean `reuseExistingServer: true` was the first draft. It was rejected
for exactly the failure above: a config with no way to say "build it properly
this time" makes the weaker signal the only signal.

**Alternative considered**: always `next dev`, for speed. Rejected — it makes
the fast path the only path, and the timing differences above are precisely
where a curtain that never lifts would hide.

---

## 9. Failing fast when content is missing

**Decision**: a `globalSetup` that checks `NEXT_PUBLIC_SANITY_PROJECT_ID` and
`NEXT_PUBLIC_SANITY_DATASET` are set and that the work index renders at least
one project card, and throws a named error if not.

**Rationale**: the spec's edge case. Without this, an unconfigured `.env.local`
produces a wall of assertion timeouts from journeys that never had a page to
run against — the ambiguous failure FR-005 forbids. The content-failure path
itself is already covered without a browser (`src/sanity/fetchers.test.ts`), so
this suite does not duplicate it; it just refuses to start and says why.

The message names the missing variable and points at `.env.example`, so the fix
is in the failure rather than one investigation away.

---

## 10. The duplicated heading reveal, consolidated before it is tested

**Decision**: move the page-heading reveal into `usePageIntro`. The four route
components keep only what is theirs.

**Rationale**: FR-007 and SC-008. The same tween — `[data-page-heading] > span`,
`yPercent: 115`, `opacity: 0`, `rotate: 2`, `duration: 0.82`, `stagger: 0.07`,
`ease: "power4.out"` — is written out identically in
`AboutExperience.tsx`, `ServiceExperience.tsx`, `ContactExperience.tsx` and
`WorkGalleryClient.tsx`. Asserting the reveal on one route would say nothing
about the other three, and would report success while three copies drifted.
That is the false assurance this feature exists to remove.

**Shape**: `usePageIntro` prepends the heading tween to the timeline it hands to
`buildIntro`, guarded on the scope actually containing a `[data-page-heading]`
so a future page without one does not tween an empty selector. Each page's own
follow-on tween keeps its own relative offset — `-=0.42` on About and Contact,
`-=0.4` on Service, `-=0.38` on Work — because those differ per page and are
therefore genuinely local. Only the identical part moves.

**On Principle IV**: the seven values are motion constants, and IV forbids them
being "magic numbers duplicated across components". Consolidating to one hook
satisfies that. Promoting them further into `src/constants/` is deliberately not
done — after this change there is exactly one call site, and a shared-constants
file whose entries have one reader each is a second dictionary, not a shared
decision. The same reasoning the design system applies to its two naming tiers.

**Not consolidated**: `HomeExperience.tsx` has no `PageHeading` and does not use
`usePageIntro`; it is a scroll choreography, not a page-entry animation. Nothing
about it is duplicated, so FR-007 does not reach it.

---

## 11. What this feature deliberately does not test

**Decision**: two areas are not covered by this feature's journeys — the home
page scroll choreography (48 statements) and the project album layout's
measurement code (6). 115 of the 169 browser-coupled uncovered statements are in
scope; 54 are not.

**Rationale, stated plainly because it weakens the feature's own headline**:
FR-002 is an exhaustive list — "gallery navigation, page-to-page navigation, and
the reduced-motion variants of both" — and no user story in the spec describes a
home-page scroll journey or an album-layout journey. Writing one would be adding
a requirement in the plan, which is the wrong place for it. So this feature
closes roughly two thirds of the browser-coupled gap, not all of it, and saying
"169 statements are browser-coupled" next to a suite that reaches 115 of them,
without saying which 115, would misrepresent what shipped.

**Where the numbers come from**: re-measured on 2026-08-29 with
`npx vitest run --coverage`. 186 uncovered statements in total, of which 169 are
browser-coupled. The spec's Assumptions carried a table summing to 165 beside a
stated total of 170; the gap was one missing row — the four route intro
callbacks, which are the duplicated page-heading reveal §10 consolidates — plus
one statement counted as browser-coupled that is not (a `catch` branch in the
contact page's Instagram-label helper). Both are corrected in the spec rather
than worked around here.

**Recorded as the obvious next feature** rather than as an oversight. The
machinery this feature installs — the config, the server, the reduced-motion
variant pattern, the run-location statement — is what those journeys would need,
and they would be a spec-and-tasks addition rather than new infrastructure.

---

## 12. Flake discipline: assert the end state, never sleep

**Decision**: no `page.waitForTimeout`. Every wait is a web-first assertion
(`expect(locator).toHaveClass(...)`, `toContainText(...)`) with Playwright's
retrying timeout, and every assertion names the thing it is waiting for.

**Rationale**: the spec's first edge case — an animation that never completes
must fail on a state that never arrived, with an explanation, rather than time
out anonymously. A web-first assertion does exactly that: it prints the expected
value and the last observed one. A `waitForTimeout` followed by a bare
assertion prints neither, and on a machine under load it is also the thing that
makes a suite flaky enough to be ignored.

**One place needs care**: US1 scenario 4, the controls receding after a pointer
idle period. That is a real timer, so the test does have to let wall-clock time
pass — but it passes it by asserting the controls' visible class is _gone_,
which is the state, with a timeout comfortably above the idle period. The
distinction matters: waiting for a state with a generous bound is not the same
as sleeping for a guessed duration and hoping.

---

## 13. Where the files live

**Decision**: `e2e/` at the repository root. Specs named `*.spec.ts`, shared
journey bodies in `e2e/journeys/`.

**Rationale**: `vitest.config.mts` includes only `src/**/*.test.{ts,tsx}`, so
anything outside `src/` is already invisible to the unit runner and the two
suites cannot collide. The `.spec.ts` suffix beside Vitest's `.test.ts` makes
which runner owns a file readable from the filename, which matters more here
than usual because both runners define a global called `test` with different
semantics.

**Also required, and easy to miss**: `playwright-report/` and `test-results/`
are generated output containing bundled JavaScript. They need adding to
`.gitignore` and to `eslint.config.mjs`'s `globalIgnores`, or the next
`npm run lint` lints Playwright's own report bundle and the push gate fails on
code nobody wrote. Feature 010's `.claude/**` ignore is there for the same
reason.
