# Feature Specification: Browser End-to-End Tests

**Feature Branch**: `012-browser-e2e-tests`

**Created**: 2026-08-26

**Input**: User description: "Add browser end-to-end testing covering the behaviour unit and integration tests structurally cannot reach — the carousel, the scroll choreography, the page-transition curtain and the pointer follower — and decide explicitly where that suite runs."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The gallery is proven to work, not proven to be called (Priority: P1)

Someone changes the project gallery — a carousel option, a control, the lazy-loading window — and finds out before shipping whether a visitor can still move through a project's photographs. Today that answer only exists in a person's memory of having clicked through it once.

**Why this priority**: This is the largest untested surface in the codebase and the one a visitor spends the most time in. The existing tests assert the contract between the app and the carousel library; they cannot assert that the carousel then does anything, because in a headless DOM it does not. A test that passes while the gallery is broken is worse than no test, and that is precisely the test the current tooling can write.

**Independent Test**: Open a project, move through its photographs by control and by keyboard, open a photograph full-screen, close it, and confirm the visitor lands back where they were rather than one level too far.

**Acceptance Scenarios**:

1. **Given** a project with several photographs, **When** the visitor advances the gallery, **Then** the photograph on screen changes.
2. **Given** the gallery is open, **When** the visitor presses the arrow keys, **Then** the gallery moves in that direction.
3. **Given** the visitor is looking at a photograph full-screen inside the project preview, **When** they dismiss it, **Then** the project preview is still open behind it.
4. **Given** the visitor has not moved the pointer for a while, **When** they look at the screen, **Then** the controls have receded; **When** they move the pointer again, **Then** the controls return.

---

### User Story 2 - Moving between pages still works, and still lands the keyboard somewhere (Priority: P2)

Someone changes a link, a route, or the transition itself, and finds out whether navigation still completes — and whether a keyboard visitor still ends up in the page content rather than back at the top of the document.

**Why this priority**: The navigation interceptor's decision table is already covered without a browser, and covered well. What is not is whether the curtain actually lifts afterwards. A transition that covers and never reveals leaves the site looking dead, and nothing currently notices.

**Independent Test**: Follow a link between two pages, confirm the destination is reached and visible, and confirm focus is inside the page content rather than on the document body.

**Acceptance Scenarios**:

1. **Given** the visitor is on any page, **When** they follow an internal link, **Then** the destination page is reached and fully visible.
2. **Given** a navigation has completed, **When** the visitor presses Tab, **Then** focus continues from within the new page's content.
3. **Given** the visitor opens a project preview from the work index, **When** they dismiss it, **Then** they are returned to the index rather than further back.

---

### User Story 3 - Motion respects the visitor's stated preference (Priority: P3)

A visitor who has asked their operating system to reduce motion gets a site that respects it — and that fact is checked rather than assumed.

**Why this priority**: Constitution Principle II makes accessibility non-negotiable, and the reduced-motion branches are the part of it that current tests can only reach through a faked media query. Whether the animation is actually skipped is a browser question. Smaller than the first two stories in surface area, but the only one where failing means excluding people.

**Independent Test**: Run the same journeys with a reduced-motion preference set and confirm the page arrives at its finished state without the intervening animation.

**Acceptance Scenarios**:

1. **Given** a visitor who prefers reduced motion, **When** they open any page, **Then** the content is visible immediately rather than waiting for an entrance animation.
2. **Given** the same visitor, **When** they move the pointer over a labelled target, **Then** the label appears without a trailing animation.
3. **Given** a visitor with no such preference, **When** they open a page, **Then** the entrance animation runs and completes.

---

### Edge Cases

- What if an animation never completes? The suite must fail on a state that never arrives rather than waiting indefinitely and reporting a timeout with no explanation of what was expected.
- What if the CMS is unreachable when the suite runs? Then the site cannot render at all, and this suite has nothing to say about it. The content-failure path is already covered without a browser, so these tests need a working content source and should say so rather than producing a confusing failure.
- What about a behaviour that exists on one route but is written separately on four? Testing one route proves one route. See the Assumptions on the repeated page-entry animation.
- What about visual appearance — colours, spacing, exact positions? Out of scope. This feature tests that behaviour happens, not that it looks right; pixel comparison is a separate decision with its own maintenance cost.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The suite MUST exercise the site in a real browser, with the real animation and carousel libraries running, rather than substituting them.
- **FR-002**: The suite MUST cover gallery navigation, page-to-page navigation, and the reduced-motion variants of both.
- **FR-003**: Each test MUST assert an observable outcome a visitor could describe — a different photograph on screen, a page reached, a control gone — rather than that an internal function was called.
- **FR-004**: The suite MUST NOT run as part of the commit gate. It MUST run as part of the push gate (constitution v2.3.0 — see Assumptions). Where it does and does not run MUST be written down, with the reason.
- **FR-005**: A failing test MUST report what was expected and what was found, so that a failure is actionable without re-running it locally to see.
- **FR-006**: The suite MUST be runnable on demand by one documented command, with no manual setup beyond what the project already requires.
- **FR-007**: Where a behaviour under test is currently written out separately in several places, it MUST be reduced to one definition before being tested, or the test's limited reach MUST be recorded against it.
- **FR-008**: Adding this capability MUST carry a written justification for the dependency it introduces, per the constitution's technology constraints.
- **FR-009**: The suite MUST NOT assert visual appearance.

### Key Entities

- **Journey**: A sequence a visitor could actually perform, expressed in their terms. The unit of this suite, as distinct from a unit test's function or an integration test's component group.
- **Motion preference variant**: A run of a journey under a stated accessibility preference. Not a separate journey — the same one, with a different expected ending.
- **Run location**: The written statement of where the suite executes and where it deliberately does not, with the reason. New in this feature and the thing FR-004 makes checkable.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A visitor can move through a project's photographs, by control and by keyboard, and this is verified automatically rather than remembered.
- **SC-002**: Dismissing a full-screen photograph returns the visitor to the project preview, not past it — verified for the nested case specifically, which is where it fails.
- **SC-003**: An internal navigation completes and leaves focus inside the destination content.
- **SC-004**: Every journey has a reduced-motion counterpart that reaches the same end state.
- **SC-005**: A commit completes without waiting for a browser, unchanged from today. A routine push waits for one — this is now the point of the gate, not a regression to guard against.
- **SC-006**: The command that runs the suite, and the statement of where it runs and does not, are both discoverable from the project's own contributor documentation.
- **SC-007**: A deliberately broken behaviour — a disabled control, a removed key handler — fails the suite, demonstrated once rather than assumed.
- **SC-008**: No behaviour is asserted on one route while identical copies of it remain untested on others.

## Assumptions

- **Measured position, re-measured 2026-08-29.** After the unit and integration work: 544 tests, 81.4% of statements, 74.0% of branches, 84.0% of functions, with Sanity Studio schema definitions excluded from the denominator as declarative configuration that never runs on the site. Of the 186 statements still uncovered, **169 — 91% — are browser-coupled**:

  | Area                                    | Uncovered | Why it resists a headless test        |
  | --------------------------------------- | --------- | ------------------------------------- |
  | Project gallery carousel and controls   | 96        | Carousel library, pointer-idle timers |
  | Home page scroll choreography           | 48        | Scroll-position-driven animation      |
  | Pointer follower                        | 15        | Frame-by-frame easing loop            |
  | Project album layout                    | 6         | Layout measurement                    |
  | Page-entry intro callbacks, four routes | 4         | Timeline built only outside `reduce`  |

  The last row and the corrected total are a fix, recorded rather than quietly applied. The first version of this table listed four rows summing to 165 beside a stated total of 170, and the missing row is the one that matters most to this feature: the four route intro callbacks are the duplicated page-heading reveal that FR-007 requires consolidated before it is tested. The remaining 17 of the 186 are not counted here — a `catch` branch in the contact page's Instagram-label helper, the Studio route, and a scatter of single statements across layouts and fetchers — so the browser-coupled figure is 169, and 169/186 is the 91% the sentence already claimed. Two of those 17 are a judgement call rather than a fact: the focus-and-`inert` handling in the work detail modal, and one statement in the page transition, are browser behaviour by nature but sit inside components the existing tests already cover well. Counted out, and named here so the next person can disagree with the reasoning rather than the arithmetic.

  Reaching these without a browser means replacing both libraries with stand-ins and asserting the stand-ins were called, which passes when the gallery is completely broken and fails when a library version changes. That is the reason they were left, and the reason this feature exists.

- **This feature covers 115 of those 169, not all of them.** The gallery (96), the pointer follower (15) and the four intro callbacks are in scope. The home page's scroll choreography (48) and the project album layout's measurement code (6) are **out of scope** — no user story above describes a home-page scroll journey or an album-layout journey, and FR-002's list is exhaustive rather than illustrative. Stated here so the headline reads honestly: this closes roughly two thirds of the browser-coupled gap and leaves a named third for a following feature, which will be able to reuse this one's configuration, server setup and reduced-motion variant pattern rather than building them again.

- **This does not reverse feature 009, contrary to how it was first described.** 009's FR-007 requires that neither Git hook depend on browser tests, and says in the same sentence that end-to-end testing "remains available as a separate, manually- or CI-triggered process outside these hooks". The constitution says the same: E2E "is deliberately excluded from the commit and push gates and stays a manual command." So this feature fulfils what both documents already anticipated. What it must not do is quietly move the suite into a hook, which FR-004 and SC-005 prevent.

- **Amended 2026-08-31: the suite moved from manual-only to the push gate**
  (constitution v2.3.0, Principle V). The two bullets above described the
  position taken when this feature shipped and are left as written — they were
  true then, and the reasoning in them (no CI, so a hooked run is paid entirely
  by whoever pushes) is still true now and still not disputed. What changed is
  the judgement call sitting on top of that reasoning: the suite has since
  caught a real accessibility regression and one of its own tests that could
  not fail (`PageTransition`'s focus restoration, and J8 — PR #26's review
  round), and that record moved the trade from "not worth the cost" to "worth
  the cost". FR-004 and SC-005 above reflect the new position; the full
  statement is `contracts/run-location.md`, rewritten in the same change.

- **The suite runs on demand, not on a hook.** 009's reasoning is unchanged: the project has no continuous-integration pipeline, so a browser run in a hook executes entirely on the developer's machine for a signal that changes far less often than lint, type and unit feedback. A push-time gate would need a CI pipeline to justify it, and introducing one is a larger decision than this feature should make. Recorded here so that the day CI arrives, the reason to revisit is on the record rather than rediscovered.

- **The repeated page-entry animation is consolidated first, not tested around.** The heading reveal is currently written out identically in four route components — the same seven properties in each. A test asserting the reveal on one route would say nothing about the other three, which is exactly the false assurance this feature exists to avoid (FR-007, SC-008). The shared hook that already owns the surrounding machinery gains the reveal itself, and the four copies go. This was found during feature 011 and deliberately recorded as out of scope there; it is in scope here because testing makes it load-bearing.

- **The dependency is justified, not assumed.** A browser automation tool is a genuine addition and the constitution requires a reason. The reason is that the stack does not solve this problem: the existing runner has no layout, no compositor, and no scrolling, so the untested 169 statements are unreachable by construction rather than by omission. This is the case the constraint asks for, and it is written into the plan rather than left implied.

- **Verification, not appearance.** The suite asserts that behaviour happens. Screenshot comparison is a different tool with a different maintenance profile — it fails on font rendering and animation timing, which on a site built around motion would produce failures nobody trusts. Excluded deliberately (FR-009), and revisitable on its own merits.

- **Content is assumed available.** These journeys need a rendering site, which needs a content source. The behaviour when content is missing is already covered without a browser, so this suite does not duplicate it and should report a clear setup failure rather than an ambiguous one.

- **Constitution Principle V needs a small correction alongside this work.** It currently states that work gallery navigation "is covered only at the component level (`WorkFilters.test.tsx`)". That stopped being true when the integration test for that flow landed. Not this feature's subject, but this feature is the natural moment to fix it.

- This specification proposes new work, like features 009 through 011 and unlike specs 001–008, which document already-shipped behaviour.
