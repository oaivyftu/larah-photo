# Feature Specification: Work Gallery

**Feature Branch**: `002-work-gallery`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Work gallery — Document the existing work gallery: masonry and featured grid views of photography projects (WorkMasonryGrid, WorkFeaturedGrid) sourced from Sanity workProject entries, filterable via WorkFilters, opening into a project detail view (WorkDetailModal/WorkDetailGallery) via an intercepting route at work/[slug]."

## Clarifications

### Session 2026-08-20

- Q: Should the work gallery spec include an explicit, measurable performance criterion for how card and gallery images load, given the constitution's principle that image delivery is deliberately budgeted? → A: Add a requirement/success criterion that initial visible cards load immediately and below-the-fold cards and full-size gallery images defer until needed, matching current lazy-loading behavior.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse the gallery and preview a project (Priority: P1)

A visitor opens the work page, sees a masonry grid of photography projects, and clicks one to preview it without losing their place in the gallery — the project's title, category, description, key details, and full image set open in an overlay above the grid, with a shareable link and a clear way to close back to the gallery.

**Why this priority**: Browsing and previewing projects is the entire purpose of the work page; without it the page has no value.

**Independent Test**: Load `/work`, click any project card, and confirm an overlay opens in place (URL updates to `/work/<slug>`) showing that project's title, description, meta details, and gallery, then confirm closing it returns to the same scroll position in the grid.

**Acceptance Scenarios**:

1. **Given** a visitor is on the work page, **When** the page loads, **Then** every published project renders as a card (image, title, meta) arranged in a masonry layout, with a loading placeholder shown until the layout is ready.
2. **Given** a visitor clicks a project card, **When** the preview opens, **Then** the browser URL changes to that project's permalink, the gallery behind it is dimmed and made inert, and the preview shows the project's title, category, share control, description, year, location, category, image count, and image grid.
3. **Given** the project preview is open, **When** the visitor presses Escape, clicks the close button, or clicks outside the preview panel, **Then** the preview closes and focus returns to the card that opened it.
4. **Given** the project preview is open, **When** the visitor copies or shares its link and someone opens that link directly (not via an in-app click), **Then** they land on a full standalone page for that project — not the overlay — showing the same title, description, meta, and gallery, plus a link back to the full work listing.

---

### User Story 2 - Filter projects by category (Priority: P2)

A visitor narrows the gallery to one category (e.g. "Wedding") using a set of filter controls, and the grid rearranges to show only matching projects.

**Why this priority**: Filtering makes a large gallery navigable, but the gallery is still fully usable without it, so it ranks below basic browsing.

**Independent Test**: Load `/work`, select a category filter, and confirm only projects in that category remain visible in the grid, independent of opening any project preview.

**Acceptance Scenarios**:

1. **Given** the work page has loaded, **When** the visitor views the filter controls, **Then** an "All" option plus one option per distinct project category present in the data are shown, with the active filter visually indicated.
2. **Given** a visitor selects a category filter, **When** the grid updates, **Then** only projects in that category remain visible and a text announcement of the filter name and resulting project count (correctly singular or plural) is made available to assistive technology.
3. **Given** a visitor selects "All" after filtering, **When** the grid updates, **Then** every project is visible again.

---

### User Story 3 - Zoom into an individual photo (Priority: P3)

While viewing a project's full gallery (either in the overlay or on its standalone page), a visitor clicks a specific photo to view it enlarged, then steps through the other photos in that project without leaving the enlarged view.

**Why this priority**: Reviewing thumbnails already conveys the project; full-size viewing is a valuable enhancement for visitors who want more detail, but the project can be evaluated without it.

**Independent Test**: Open any project's gallery, click a thumbnail, and confirm an enlarged, navigable view of that image opens on top of everything else and can be closed independently, without affecting the project preview or grid underneath.

**Acceptance Scenarios**:

1. **Given** a visitor is viewing a project's image grid, **When** they click a thumbnail, **Then** an enlarged view of that image opens, starting at the clicked image.
2. **Given** the enlarged image view is open on top of the project preview overlay, **When** the visitor presses Escape, **Then** only the enlarged image view closes, leaving the project preview open underneath.

---

### Edge Cases

- What happens when a visitor requests a project slug that doesn't exist? The system MUST show a not-found result rather than an empty or broken preview.
- What happens when a visitor navigates to a project link directly (fresh page load, not an in-app click)? The system MUST render the full standalone project page, not the overlay preview.
- What happens when a required gallery image is missing alt text in the CMS? The system MUST require alt text on every gallery image at the content level; images without it are not valid content.
- What happens when a visitor has a reduced-motion preference set? The work page's entrance animation MUST NOT run; the heading, filters, and cards MUST still be fully visible.
- What happens when a category has exactly one matching project versus more than one? The filter announcement MUST use correct singular/plural wording in both cases.
- What happens while the masonry layout is still calculating positions? The grid MUST show a placeholder rather than a visibly jumping or overlapping layout.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Work page MUST render every published project as a card in a masonry-arranged grid, with all project text and imagery sourced from the CMS.
- **FR-002**: System MUST derive the set of available category filters from the categories actually present among published projects, plus an "All" option, rather than a hardcoded list.
- **FR-003**: Selecting a category filter MUST show only projects in that category and MUST make the active filter and resulting result count available to assistive technology as a text announcement.
- **FR-004**: Clicking a project card from within the work page MUST open that project's full detail (title, category, description, year, location, category, image count, and image gallery) in an overlay above the gallery, without a full page navigation, while updating the browser URL to that project's permalink.
- **FR-005**: The overlay preview MUST make the underlying gallery inert and visually dimmed while open, trap keyboard focus within itself, and be dismissible via Escape, a close control, or a click outside the preview panel; closing it MUST return focus to the control that opened it.
- **FR-006**: Requesting a project's permalink directly (not via an in-app card click) MUST render a full standalone page with the same project content, plus a link back to the full work listing.
- **FR-007**: Every project detail view (overlay or standalone) MUST include a control to share/copy that project's permalink.
- **FR-008**: Clicking a thumbnail within a project's image gallery MUST open an enlarged, navigable view of that image, starting at the clicked image, layered above the project detail view.
- **FR-009**: When the enlarged image view is open above the overlay preview, Escape MUST close only the enlarged image view, and the preview's own close control MUST be inert while the enlarged view is open.
- **FR-010**: Requesting a project slug that does not correspond to a published project MUST result in a not-found outcome rather than an empty or partial detail view.
- **FR-011**: On viewports and settings with no reduced-motion preference, the work page's heading, filter controls, and initial set of cards MUST animate into view in a staggered sequence on load; with a reduced-motion preference, the same content MUST render fully visible with no animation.
- **FR-012**: Every gallery image in a project MUST have required alt text at the content level; the system MUST NOT allow a gallery image to be published without it.
- **FR-013**: Each project detail view MUST display the project's year, location, category, and total image count alongside its title and description.
- **FR-014**: Gallery card images MUST NOT all load immediately; only cards visible in the initial viewport MUST be prioritized for immediate loading, with the remainder and every project detail/gallery image deferred until the visitor scrolls or navigates near them.

### Key Entities

- **Work Project**: A photography project with a title, unique slug, category, year, location, description, a card image, a set of gallery images (each with required alt text), and flags/ordering controlling whether and where it appears among featured projects on the home page.
- **Work Page Content**: CMS-managed page-level copy for the work index (e.g. heading text).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of published work projects appear in the work gallery grid with correct image, title, and meta.
- **SC-002**: A visitor can go from the gallery to a fully detailed project preview in a single click, with no full page reload.
- **SC-003**: A shared project link opens directly to that project's full detail 100% of the time, without requiring the visitor to browse the gallery first.
- **SC-004**: Selecting any category filter shows only projects belonging to that category, with zero mismatched results.
- **SC-005**: Visitors with a reduced-motion preference can read and use the full work page and every project detail view with zero load-triggered motion.
- **SC-006**: Requesting a non-existent project link results in a clear not-found outcome, never a blank or broken screen.
- **SC-007**: Below-the-fold gallery cards and off-screen project images never load before they are needed, keeping initial page load proportional to what's visible rather than the full project catalog.

## Assumptions

- This specification documents the work gallery's current, already-implemented behavior as a baseline, rather than proposing new functionality.
- "Overlay preview" corresponds to the in-app modal experience reachable via an intercepting route; "standalone page" corresponds to the same content rendered as a full page for direct/shared links — both present identical project content.
- Category values are free-form CMS text; the system does not enforce a fixed category taxonomy beyond what projects actually use.
- Sanity CMS remains the sole source of project content, consistent with the project's content-source-of-truth principle.
- The featured-project ordering and homepage span fields exist to support the home page's grid and are not directly user-facing on the work index itself.
