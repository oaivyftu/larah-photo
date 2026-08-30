# Contract: Test Surface

**Feature**: 012-browser-e2e-tests | **Date**: 2026-08-29

The suite reaches into the running app through a small, named set of DOM
handles. This file is the list. Anything on it is load-bearing: changing it
breaks tests, and the tests are the reason to know that before the change lands
rather than after.

It also draws the line the codebase should hold: **identity hooks yes, state
mirrors no.**

---

## The rule about selectors

| Allowed as a selector           | Why                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Role and accessible name        | What a visitor perceives, and what Principle II already requires be correct. First choice, always |
| A `data-*` identity attribute   | Names what an element _is_. This codebase already uses them everywhere as GSAP scope selectors    |
| A global class set by a library | `is-selected`, `flickity-enabled` — these are the library's own statement about its state         |

| Forbidden as a selector                      | Why                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| A CSS-module class name                      | They are hashed in a production build. `styles["…__float-nav--visible"]` is not the class in the DOM                                                |
| A `data-*` attribute added only for the test | If it mirrors React state, the test reads the state instead of the result — and the case worth catching is exactly the one where those two disagree |
| Element position (`nth-child`)               | Content is editor-owned (Principle I); the third card is not a stable thing                                                                         |
| Text copy                                    | Same reason. Every string on the site comes from Sanity                                                                                             |

**Identity vs. mirror, since this is the line that will be argued about**:
`data-glass-pointer` says "this div is the glass pointer" — it is a name, it is
true regardless of state, and it matches `data-manifesto`, `data-hero-media`,
`data-work-card` and the dozen other identity hooks already in the tree. A
hypothetical `data-current-index={currentIndex}` would say "React thinks the
carousel is on slide 3" — which is a claim the test should be checking against
the carousel, not accepting from the component.

---

## Handles the suite depends on

### Already in the tree — no change needed

| Handle                                                   | Element                                          | Read by        |
| -------------------------------------------------------- | ------------------------------------------------ | -------------- |
| `role="region"` + name `"{title} image gallery"`         | The carousel                                     | J1, J2         |
| `aria-roledescription="carousel"`                        | The carousel                                     | J1, J2         |
| `.flickity-enabled`                                      | The carousel, once Flickity boots                | J1, J2         |
| `.is-selected`                                           | The selected `<figure>` cell                     | J1, J2         |
| `aria-label="{n} of {N}: {alt}"`                         | Each `<figure>` slide                            | J1, J2         |
| `aria-live="polite"` text `"Image {n} of {N}"`           | Inside the float nav                             | J1, J2         |
| `role="button"` name `"Next image"` / `"Previous image"` | Float-nav controls                               | J1             |
| `role="button"` name `"Close gallery"`                   | Float-nav close, modal only                      | J3             |
| `role="dialog"` + `aria-modal`                           | Work detail preview and the lightbox             | J3, J7         |
| `data-work-modal`                                        | The project preview dialog                       | J3, J7         |
| `data-page-heading`                                      | `PageHeading`                                    | J8             |
| `data-active`                                            | The glass pointer pill                           | J9             |
| `data-work-card`                                         | Project cards on the work index                  | J3, J5, J7, J9 |
| `document.documentElement.dataset.pageTransition`        | `<html>`, set by `PageTransition`                | J5             |
| `document.documentElement.dataset.imageLightbox`         | `<html>`, set while the lightbox owns the screen | J3             |

Note how much of this is accessibility markup that already had to be right for
Principle II. That is not a coincidence and it is the argument for preferring
role-and-name selectors: they are the handles the project is already obliged to
keep correct.

### To be added — two identity hooks

| Handle                  | Element                                             | Why                                                                                                             |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `data-gallery-controls` | The float nav `<nav aria-label="Gallery controls">` | The nav is reachable by role and name, but J4 asserts on it repeatedly and a name keeps the assertions readable |
| `data-glass-pointer`    | The glass pointer pill                              | The pill is `aria-hidden="true"` — deliberately, it is decoration — so it has no accessible name to select by   |

Both are names, not state. Both match the existing convention. Neither changes
rendering.

---

## How each state is read

The handles above locate elements; these are the assertions made on them.

| State                       | Assertion                                                                                 | Journey |
| --------------------------- | ----------------------------------------------------------------------------------------- | ------- |
| The carousel initialised    | The carousel region has class `flickity-enabled`                                          | J1, J2  |
| Which photograph is current | `figure.is-selected` has the expected `aria-label` prefix (`"2 of 6:"`)                   | J1, J2  |
| The photograph changed      | The selected figure's `aria-label` differs from the one captured before                   | J1, J2  |
| The controls are visible    | Computed `opacity` of `[data-gallery-controls]` is `"1"`                                  | J4      |
| The controls have receded   | Computed `opacity` of `[data-gallery-controls]` is `"0"`                                  | J4      |
| The preview is still open   | `[role="dialog"]` is attached, and the URL is still the project's                         | J3      |
| The navigation completed    | `document.documentElement.dataset.pageTransition === "ready"`                             | J5      |
| Focus moved to the content  | `document.activeElement.id === "main-content"` after a navigation                         | J6      |
| Tab continues from there    | The next focused element is inside `#main-content` or follows it in document order        | J6      |
| The intro was parked        | Heading `opacity` sampled at `larah:page-ready` — `"0"` with motion, `"1"` under `reduce` | J8      |
| The page content arrived    | Computed `opacity` of `[data-page-heading] > span` is `"1"`                               | J8      |
| The pointer label is on     | `[data-glass-pointer]` has attribute `data-active`                                        | J9      |

**On the parked-intro row, which review added.** J8 first asserted only the
finished state — and a finished state is exactly what a page with no entrance
animation has, so deleting the reveal left the test green. An end-state
assertion cannot tell "the animation ran and finished" apart from "there was no
animation". The fix is an observable from _during_ the cycle: an init script
records the heading's opacity when the page fires `larah:page-ready`, which is
after `usePageIntro` parks it and before it plays. `"0"` means a timeline
exists; `"1"` means none was built. It is also what makes the two motion
variants distinguishable by evidence rather than by the label on the describe
block — if the browser never received the preference, the `reduce` run reads
`"0"` and fails.

**On J6's two rows, which were one row until the journey was written.** The
first draft asserted that after Tab the focused element is inside `<main>`. That
is wrong about the app and wrong about the requirement: several pages have no
focusable element in their content at all, so the correct next stop is the
footer -- which is still continuing forwards. What must never happen is landing
back in the header, which is what "back at the top of the document" means. The
assertion is therefore document order, not containment.

**On the three computed-`opacity` reads and FR-009**: FR-009 excludes asserting
visual _appearance_ — colours, spacing, exact positions, screenshot diffs. These
three are not appearance questions. `opacity: 0` on the float nav is what
`pointer-events: none` accompanies, so it is the difference between a control
that works and one that does not; `opacity: 0` on a heading is `usePageIntro`'s
parked state, and the failure it guards against is a page that never becomes
visible at all. Both are things a visitor would describe. No assertion in this
suite reads a colour, a size, a position or a transform.

---

## What the suite must never do

- Take a screenshot for comparison, or call `toHaveScreenshot` (FR-009).
- Assert a `transform`, a bounding box, a colour, or a font metric — a transform
  value is a visual assertion in DOM clothing, and it breaks on an easing change
  that breaks nothing for a visitor.
- Call `page.waitForTimeout`. Every wait is a retrying assertion that names what
  it is waiting for, so a failure says what did not arrive (FR-005,
  research.md §12).
- Hardcode a slug, a title, a photograph count, or any other editor-owned value
  (Principle I, research.md §5).
- Stub, mock or replace GSAP, Flickity or `matchMedia`. That is the thing this
  suite exists not to do (FR-001).

---

## Changing an entry on this list

A change to any handle above is a change to this contract. Update the handle and
the spec that reads it in the same commit, and run `npm run test:e2e` before
pushing — the push gate will not catch it (see
[run-location.md](./run-location.md)). Removing a handle without a replacement
means removing the journey that reads it, which means the acceptance scenario it
traces to is no longer covered; that is a spec change, not a cleanup.
