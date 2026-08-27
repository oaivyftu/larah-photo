# Feature Specification: Site Navigation & Shell

**Feature Branch**: `006-site-navigation-shell`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Site navigation & shell — Document the existing site chrome: MainNav, SiteHeader, SiteFooter, PageShell, and PageTransition, including page-transition animations, driven by siteSettings."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Move around the site via consistent chrome (Priority: P1)

On every page, a visitor sees the same header (logo, primary navigation, a prominent "message on Instagram" action) and footer (studio statement, business email/phone, location, social link, a link to the work page, and a "back to top" control), and can always tell which section of the site they're currently on.

**Why this priority**: This is the site's primary means of getting from one page to another; without consistent, working chrome the site is not navigable as a whole.

**Independent Test**: Load any page and confirm the header and footer render with correct links and content, and that the navigation item matching the current page is visually and programmatically marked as current.

**Acceptance Scenarios**:

1. **Given** a visitor loads any page, **When** the page renders, **Then** a header with the site logo, primary navigation links, and an Instagram call-to-action appears, and a footer with the studio's statement, contact details, location, social link, work link, and "back to top" control appears.
2. **Given** a visitor is on a given section of the site, **When** they view the primary navigation, **Then** the link corresponding to their current section is marked as the current page for both sighted and assistive-technology users.
3. **Given** a visitor selects "back to top" in the footer, **When** they activate it, **Then** the page scrolls to the top and keyboard focus moves there.
4. **Given** a visitor is on the home page, **When** the header renders, **Then** the header's own logo is not shown, since the home page displays its own full-size logo in the hero.

---

### User Story 2 - Experience a branded transition between pages (Priority: P2)

When a visitor follows an internal link to a different page, a short branded animation (a curtain bearing the site logo) covers the screen before the new page appears, rather than an abrupt jump.

**Why this priority**: This is a polish/branding layer over standard navigation; the site remains fully usable via instant navigation if this animation is absent, so it ranks below the core navigation chrome.

**Independent Test**: From any page, click a link to a different page and confirm a covering animation plays before the destination page's content is shown, and confirm it does not delay navigation for links that don't qualify (new tab, download, external, same-page anchor, or in-app modal links).

**Acceptance Scenarios**:

1. **Given** a visitor clicks an internal link to a different page in the same tab, **When** the click is registered, **Then** the transition animation covers the screen before the browser navigates to the new page, and reveals the new page shortly after.
2. **Given** a visitor opens a link in a new tab, uses a modifier key (Cmd/Ctrl/Shift/Alt), clicks a download link, clicks an external-site link, or clicks a link that only changes the page's hash, **When** the click is registered, **Then** no transition animation plays and the browser's normal link behavior is used.
3. **Given** a visitor clicks a project card that opens the in-app project preview overlay, **When** the click is registered, **Then** the full-page transition animation does NOT play, since the underlying page is not actually changing.
4. **Given** a visitor is on the Studio (CMS) route, **When** they navigate within it, **Then** no page-transition chrome renders at all.

---

### User Story 3 - Navigate and orient via keyboard and screen reader (Priority: P3)

A keyboard or screen-reader user can skip the header to reach the page's main content directly, and after any full-page navigation, their focus and the assistive-technology announcement both reflect the new page rather than staying stuck at the previous location.

**Why this priority**: This ensures the site's navigation is usable by keyboard and assistive-technology visitors, which is essential for accessibility but is an enhancement layered on top of the baseline navigation already covered by User Story 1.

**Independent Test**: Tab to the very first interactive element on any page and confirm a "skip to content" link appears and moves focus to the main content region when activated; separately, navigate to a different page and confirm focus moves to that page's main content and the new page's title is announced.

**Acceptance Scenarios**:

1. **Given** a visitor tabs to the first focusable element on any page, **When** it receives focus, **Then** a "skip to content" link is available that moves focus to the main content region when activated.
2. **Given** a visitor completes an internal, full-page navigation, **When** the new page finishes revealing, **Then** keyboard focus moves to that page's main content region and the new page's title is announced to assistive technology.
3. **Given** a visitor is on the very first page load of a session (not a navigation), **When** the page finishes loading, **Then** no focus-move or route-change announcement occurs, since nothing has been navigated away from.

---

### Edge Cases

- What happens when a visitor uses the browser's back button to return from a project detail page to the gallery it was opened from? The system MUST reopen that project as the in-app overlay rather than the full-page transition, matching how it was originally opened.
- What happens when a visitor clicks a link whose destination is identical to the current URL? No transition or navigation MUST occur.
- What happens when required site settings (navigation items, Instagram URL, site name) are missing or invalid? The chrome MUST surface an error rather than silently rendering blank or broken navigation.
- What happens when navigation items are configured with zero entries? This MUST be treated as invalid configuration, since primary navigation is required.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every page MUST render a header containing the site logo (except on the home page, where it is hidden to avoid duplicating the hero's own logo), the primary navigation, and an Instagram call-to-action, and a footer containing the studio's statement, business email, business phone, location, an Instagram link, a link to the work page, and a "back to top" control.
- **FR-002**: Primary navigation items, the site name, and the Instagram URL used in the header and footer MUST be sourced entirely from site-wide CMS settings, not hardcoded.
- **FR-003**: The primary navigation link matching the visitor's current section MUST be marked as the current page both visually and via an accessible "current page" indicator.
- **FR-004**: Activating the footer's "back to top" control MUST scroll the page to the top and move keyboard focus there.
- **FR-005**: Clicking an internal link to a different page (in the same tab, without modifier keys, not a download, and not opening a new tab) MUST trigger a covering transition animation before the browser navigates, and MUST reveal the destination page shortly after navigation completes.
- **FR-006**: Links that open in a new tab, are modified-clicked, point to a download, point to an external origin, only change the current page's hash, or are marked as opening an in-app overlay MUST NOT trigger the full-page transition animation.
- **FR-007**: The transition system MUST NOT render at all on the CMS Studio route.
- **FR-008**: Every page MUST provide a "skip to content" link, positioned to be the first focusable element, that moves keyboard focus to the page's main content region when activated.
- **FR-009**: After a full-page internal navigation completes, keyboard focus MUST move to the new page's main content region and the new page's title MUST be announced to assistive technology; this MUST NOT occur on the initial page load of a session.
- **FR-010**: Returning to a gallery context via browser back navigation from a project detail URL MUST reopen that project as the in-app overlay rather than performing a full-page transition.
- **FR-011**: When required site-wide settings needed for navigation or chrome are missing or invalid, the system MUST surface an error rather than rendering broken or blank chrome.

### Key Entities

- **Site Settings**: Site-wide configuration driving the shell — site name, Instagram URL, business email/phone, location, footer statement, and the ordered list of primary navigation items (label + destination).
- **Navigation Item**: A single primary navigation entry with a label and a destination path.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of pages render a complete, working header and footer with no missing links or content.
- **SC-002**: A visitor can identify their current section from the navigation on 100% of pages that correspond to a navigation item.
- **SC-003**: Every qualifying internal link navigation shows the branded transition before the destination page becomes visible; every non-qualifying link (new tab, external, download, hash-only, modal) bypasses it, with zero incorrect classifications.
- **SC-004**: 100% of full-page navigations result in keyboard focus landing on the new page's main content and an assistive-technology announcement of the new page title, excluding the initial page load.
- **SC-005**: A keyboard user can reach a page's main content in a single activation from the first focusable element on the page.
- **SC-006**: An editor who updates site settings (navigation items, contact details, footer statement) sees the change reflected across every page's chrome without any code change.

## Assumptions

- This specification documents the site's navigation and shell current, already-implemented behavior as a baseline, rather than proposing new functionality.
- Sanity CMS site settings remain the sole source of navigation, contact, and footer content, consistent with the project's content-source-of-truth principle.
- "In-app overlay" links refer to the work gallery's project-preview links, the only current use of the modal-route navigation exemption.
- The CMS Studio route intentionally falls outside this shell and its transition system, since it renders its own independent interface.
