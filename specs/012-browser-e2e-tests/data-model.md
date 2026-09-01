# Data Model: Browser End-to-End Tests

**Feature**: 012-browser-e2e-tests | **Date**: 2026-08-29

Phase 1 output. This feature stores no runtime data — its "model" is the set of
things the suite is made of, taken from the spec's Key Entities and made
concrete enough to build from.

---

## Journey

A sequence a visitor could actually perform, expressed in their terms. The unit
of this suite.

| Field       | Meaning                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `name`      | What the visitor did, in their words. Becomes the Playwright test title and the failure header |
| `entry`     | The route the journey starts on. Always a route, never a component                             |
| `steps`     | Visitor actions — click a control, press a key, move the pointer, wait for idle                |
| `outcome`   | The observable end state (see **Observable**). Exactly one per journey                         |
| `variants`  | Which motion preferences this journey runs under (see **Motion preference variant**)           |
| `traces_to` | The spec acceptance scenario and success criterion it discharges                               |

**Rules**

- A journey MUST NOT reference a project slug, a photograph count, or a piece of
  page copy. Content is editor-owned (Principle I), so it is discovered at run
  time — a project card followed from the work index, the count read from the
  gallery's own live region (research.md §5). J1 and J2 go further and pick a
  project that _has_ several photographs rather than assuming the first one
  does: `workProject.images` carries no minimum in the schema, so a
  one-photograph project first on the index is a permitted content state, and
  the journeys would then fail on the dataset rather than on the software.
- A journey's `outcome` MUST be an Observable from the table below. "A function
  was called" and "state updated" are not outcomes (FR-003).
- A journey body is defined once and imported by each of its variants. Copying
  a body to change its ending is the duplication FR-007 forbids, applied to the
  suite itself (research.md §4).

### The journey inventory

| ID  | Name                                                               | Entry                | Outcome                                                            | Traces to        |
| --- | ------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------ | ---------------- |
| J1  | Advance the gallery with the next control                          | project detail       | A different slide carries `is-selected`; the live region counts up | US1 AS1 → SC-001 |
| J2  | Move the gallery with the arrow keys                               | project detail       | Selection moves in the pressed direction, both ways                | US1 AS2 → SC-001 |
| J3  | Dismiss a full-screen photograph opened inside the project preview | work index → preview | The preview dialog is still open; the URL is still the project's   | US1 AS3 → SC-002 |
| J4  | Let the pointer idle, then move it                                 | project detail       | Gallery controls lose the visible class, then regain it            | US1 AS4          |
| J5  | Follow an internal link                                            | any page             | Destination route reached and its heading visible                  | US2 AS1 → SC-003 |
| J6  | Press Tab after a navigation                                       | any page             | `document.activeElement` is inside the page content, not `<body>`  | US2 AS2 → SC-003 |
| J7  | Dismiss the project preview                                        | work index → preview | Back on the work index, not one level past it                      | US2 AS3          |
| J8  | Open a page and let it arrive                                      | any page             | Page content reaches its finished state                            | US3 AS1, AS3     |
| J9  | Hover a labelled target                                            | work index           | The pointer label becomes active                                   | US3 AS2          |

Nine journeys. J3 and J7 are separate on purpose: they dismiss different things
from the same screen, and SC-002 exists because the nested one is where it
fails.

---

## Motion preference variant

A run of a journey under a stated accessibility preference. Not a separate
journey — the same one, with a different expected ending.

| Field        | Meaning                                    |
| ------------ | ------------------------------------------ |
| `preference` | `no-preference` or `reduce`                |
| `journey`    | The Journey this varies                    |
| `ending`     | What "arrived" means under this preference |

**Rules**

- Set on the browser context — `test.use({ contextOptions: { reducedMotion } })`
  in this Playwright version, not the top-level form most examples show — never
  by overriding `matchMedia` (research.md §4). A faked query asserts that the
  code reads a preference, not that it honours one.
- Every journey has both variants (SC-004). Where the ending is identical under
  both — J1 through J7 all end on the same observable — the variant is a
  `test.use` wrapper around the same imported body, not a second copy.
- Only J8 has genuinely different endings, and that difference is the point:

| Journey | `no-preference` ending                        | `reduce` ending                      |
| ------- | --------------------------------------------- | ------------------------------------ |
| J1–J7   | same observable                               | same observable                      |
| J8      | parked at `opacity: 0`, then animates to rest | never parked; at rest from the start |
| J9      | label appears, trailing follow enabled        | label appears, no trailing animation |

J8's `reduce` ending is the one that catches a real regression: `usePageIntro`
never builds the timeline under `reduce`, so nothing is parked at `opacity: 0`.
If that guard breaks, a reduced-motion visitor gets a permanently invisible
page — and today nothing notices.

**One variant traces to no acceptance scenario, deliberately.** US3 AS2 describes
only the `reduce` case of J9, so J9's `no-preference` run has no scenario behind
it. It exists because SC-004 requires every journey to have both, and it is worth
keeping: it is the control that makes the `reduce` run mean something. Noted so a
reader looking for its scenario stops looking rather than assuming one was lost.

---

## Observable

The vocabulary of endings. A journey's outcome must be one of these; anything
else is either an implementation detail or a visual assertion (FR-009).

| Observable           | Read from                                                          | Used by    |
| -------------------- | ------------------------------------------------------------------ | ---------- |
| Selected photograph  | `is-selected` on the `<figure>` cell, plus its `aria-label`        | J1, J2     |
| Photograph position  | The gallery's `aria-live` region — "Image _n_ of _N_"              | J1, J2     |
| Dialog still open    | `[role="dialog"]` visible, and `aria-modal`                        | J3         |
| Route                | `page.url()`                                                       | J3, J5, J7 |
| Control visibility   | Computed `opacity` of `[data-gallery-controls]`                    | J4         |
| Focus moved          | `document.activeElement.id` is `main-content` after navigating     | J6         |
| Tab continues        | Next focus is inside `#main-content` or follows it in the document | J6         |
| Intro parked         | Heading `opacity` sampled at `larah:page-ready`                    | J8         |
| Content at rest      | Computed `opacity` of the page heading spans reaching `1`          | J8         |
| Pointer label active | `data-active` on the glass pointer                                 | J9         |

The labelled targets are the three `usePointerLabel` call sites — the work card
("View"), the detail gallery's zoom buttons ("Zoom"), and the project gallery
carousel ("Close"). J9 uses the work card, because the work index is the only
one of the three reachable without first completing another journey.

**Excluded by FR-009**, and worth naming so the line is not redrawn later by
accident: screenshots, pixel comparison, computed `transform` values, element
bounding boxes, colours, and font metrics. A transform value is a visual
assertion wearing a DOM disguise — it breaks on an easing change that breaks
nothing for a visitor.

`Content at rest` is the one that sits closest to the line. It is admitted
because `opacity` here is not an appearance question but a can-the-visitor-see-
the-page question: `usePageIntro` parks the content at `opacity: 0` and the
failure mode is that it never leaves.

---

## Run location

The written statement of where the suite executes and where it deliberately does
not, with the reason. New in this feature, and the thing FR-004 makes checkable.

**Amended 2026-08-31** (constitution v2.3.0): moved from manual-only to the
push gate. The table below is the current state; `contracts/run-location.md`
keeps the prior state's reasoning alongside the new one rather than discarding
it.

| Field      | Value                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`  | `PORT=3100 E2E_FRESH_BUILD=1 npm run test:e2e` (hook) · `npm run test:e2e` (manual)                                                                                                                                                               |
| `trigger`  | `.husky/pre-push`, automatically — plus a person, on demand, any time                                                                                                                                                                             |
| `excluded` | `.husky/pre-commit` only                                                                                                                                                                                                                          |
| `reason`   | The push gate already pays for the two slowest checks (`npm test`, `npm run build`); the suite earned the same treatment by catching what those two missed (a real focus-restoration bug, and a test that could not fail — PR #26's review round) |
| `revisit`  | The day CI exists — the cost can move off the developer's machine regardless of whether the suite stays in the hook                                                                                                                               |
| `written`  | `README.md` quality-gates table, `AGENTS.md` §5, `contracts/run-location.md`, constitution Principle V                                                                                                                                            |

The full statement, in the form the contract requires, is
[contracts/run-location.md](./contracts/run-location.md). It is a deliverable,
not a note: FR-004's second sentence makes it one.

---

## Shared-behaviour ledger

SC-008 says no behaviour may be asserted on one route while identical copies of
it remain untested on others. That is only checkable if the copies are known, so
this table is the record — and its second column must read "one" for every row
before the feature is done.

| Behaviour               | Definitions before                | Definitions after  | Asserted by     |
| ----------------------- | --------------------------------- | ------------------ | --------------- |
| Page heading reveal     | 4 (About, Service, Contact, Work) | 1 (`usePageIntro`) | J8              |
| Page-ready wait         | 1 (`playOnPageReady`)             | 1                  | J8 (indirectly) |
| Gallery paging          | 1 (`WorkProjectGalleryClient`)    | 1                  | J1, J2          |
| Pointer-idle reveal     | 1 (`WorkProjectGalleryClient`)    | 1                  | J4              |
| Page-transition curtain | 1 (`PageTransition`)              | 1                  | J5              |
| Pointer label           | 1 (`GlassPointer`)                | 1                  | J9              |

Only the first row required work; the rest were already single-definition and
are listed so the check is a reading of the table rather than a fresh search.
The per-page follow-on tweens are deliberately absent — they differ per page
(`-=0.42`, `-=0.4`, `-=0.38`) and are local decisions, not copies
(research.md §10).
