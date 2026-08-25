# Feature Specification: Home Page

**Feature Branch**: `001-home-page`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Home page — Document the existing home page: a Sanity-driven hero/manifesto experience (HomeExperience) with GSAP scroll animations, rendered from homePage CMS content."

## Clarifications

### Session 2026-08-18

- Q: Should decorative/motion-driven content (duplicate manifesto text, service-card icons) and CMS image alt text get explicit, testable accessibility requirements in this spec, or should the spec rely on the constitution's blanket accessibility principle without page-specific requirements? → A: Add explicit requirements: decorative/duplicate content excluded from assistive tech, all CMS images require meaningful alt text
- Q: Should this spec include an explicit, measurable performance success criterion for the hero's image loading, given the constitution's principle that image delivery is deliberately budgeted, or is performance out of scope for this documentation spec? → A: Add a success criterion tied to prioritized/eager loading of hero imagery, matching current implementation and the constitution's image-budget principle

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Arrive and read the hero (Priority: P1)

A first-time visitor lands on the site's home page and immediately sees who Larah Photo is: a brand logo, a portrait, a feature image, and a short tagline, along with one clear next step (a call-to-action link).

**Why this priority**: This is the first content any visitor sees. If it fails to render correctly or the CTA is missing, the visitor has nothing to act on and the page has failed at its primary job.

**Independent Test**: Load the home page fresh (no scrolling) and confirm the logo, tagline, portrait image, feature image, and CTA button are all visible and the CTA link works, independent of any other section on the page.

**Acceptance Scenarios**:

1. **Given** a visitor opens the home page for the first time, **When** the page finishes loading, **Then** the brand logo, hero tagline, hero portrait image, hero feature image, and a labeled call-to-action link are all visible.
2. **Given** a visitor's browser has no motion restrictions and the viewport is desktop-width, **When** the page loads, **Then** the tagline words, hero imagery, and call-to-action animate into place in a staggered sequence rather than appearing all at once.
3. **Given** a visitor has requested reduced motion at the OS/browser level, **When** the page loads, **Then** the same hero content is fully visible immediately, without any entrance animation.
4. **Given** a visitor selects the hero call-to-action, **When** they activate it, **Then** they are taken to the destination configured for that link.

---

### User Story 2 - Scroll through the manifesto (Priority: P2)

As a visitor continues scrolling, they encounter a manifesto section that stages three brand words and two images with scroll-linked motion, reinforcing the brand's visual identity before the visitor reaches the work samples.

**Why this priority**: This is the site's signature scroll moment and a key piece of brand storytelling, but the page remains usable and informative even if a visitor never scrolls this far, so it ranks below the hero.

**Independent Test**: Scroll from just above the manifesto section to just below it and confirm the three words and two images are present, readable, and shift position in relation to scroll progress, without needing to interact with any other section.

**Acceptance Scenarios**:

1. **Given** a visitor scrolls to the manifesto section on a desktop-width viewport with no motion restrictions, **When** they continue scrolling, **Then** the section holds in place while its words and images shift position in sync with scroll progress, then releases once the scroll-linked motion completes.
2. **Given** a visitor scrolls to the manifesto section on a tablet- or phone-width viewport with no motion restrictions, **When** the section first comes into view, **Then** its words and images animate in, and continue to drift at a smaller scale as the visitor scrolls through the section, without the section pinning in place.
3. **Given** a visitor has requested reduced motion, **When** they scroll through the manifesto section, **Then** the three words and two images are fully visible and readable with no scroll-linked movement.
4. **Given** the manifesto content is configured in the CMS, **When** the section renders, **Then** exactly three words and two images appear, matching the configured content.

---

### User Story 3 - Discover work and services (Priority: P3)

After the manifesto, a visitor reaches a summary of the photographer's body of work (a project count and a grid of featured projects) and a set of bookable service packages, each with enough detail to decide whether to inquire.

**Why this priority**: This section converts interest into action (viewing more work or booking a service), but a visitor who only wants a first impression may never need it, so it's the lowest-priority of the three primary journeys while still being essential to the page's business purpose.

**Independent Test**: Scroll to the work and services sections and confirm the project count, featured project grid, "view all work" link, and each service card (icon, title, description, features, price, booking link) render correctly, independent of the hero or manifesto sections.

**Acceptance Scenarios**:

1. **Given** the site has a set of work projects, **When** a visitor reaches the work section, **Then** they see the total number of projects, a grid of up to 7 featured projects, and a link to view all work.
2. **Given** the site has configured service packages, **When** a visitor reaches the services section, **Then** each service displays its icon, title, description, up to 5 listed features, starting price, and a "Book now" link to inquire.
3. **Given** a visitor scrolls the services section into view with no motion restrictions, **When** the section first becomes visible, **Then** its header and each service card fade and slide into place once, and remain visible on any further scrolling.
4. **Given** a visitor has requested reduced motion, **When** they reach the services section, **Then** the header and all service cards are visible immediately with no reveal animation.

---

### Edge Cases

- What happens when required home page content (tagline, hero images, manifesto words, CTA) is missing or invalid in the CMS? The page MUST surface an error rather than silently showing blank space or placeholder content.
- What happens when the manifesto words configured in the CMS number more or fewer than three? The system MUST treat this as invalid content and surface an error rather than rendering a partial or malformed manifesto.
- What happens when there are fewer than 7 featured projects? The work grid MUST show only the projects that exist, and the project count MUST reflect the true total.
- What happens when there is exactly 1 total project versus more than 1? The count label MUST read correctly in both the singular and plural case.
- What happens when a service does not match one of the known service categories (portrait, couple, wedding, family, graduation)? The card MUST still render using a generic fallback icon rather than failing to display.
- What happens if a visitor changes their OS-level motion preference mid-session, or resizes the browser across the desktop/tablet/phone thresholds? Each section's animation behavior MUST correspond to the visitor's current preference and current viewport width.
- What happens when a visitor scrolls the services section into view, then away, then back? The reveal animation MUST NOT replay once it has already played.
- What happens when there are zero featured projects or zero configured service packages? Each section's heading/eyebrow MUST still render; this is a valid empty content state (an empty grid or empty card list), not treated as missing/invalid required content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Home page MUST render its hero, manifesto, work, and services sections entirely from CMS-managed content, with no hardcoded production copy or imagery in the page itself.
- **FR-002**: Hero section MUST display a brand logo, a portrait image, a feature image, a tagline (rendered as individually presented words), and a labeled call-to-action link, all sourced from the home page CMS content.
- **FR-003**: Home page MUST support configuring the hero call-to-action's label and destination independently through the CMS.
- **FR-004**: On desktop-width viewports with no reduced-motion preference, the hero content MUST animate into view in a staggered sequence on page load.
- **FR-005**: Manifesto section MUST display exactly three brand words and two images sourced from the CMS; content with any other number of words MUST be treated as invalid.
- **FR-006**: On desktop-width viewports with no reduced-motion preference, the manifesto section MUST pin in place while scrolling and drive its word/image motion from scroll progress across an extended scroll distance, then release.
- **FR-007**: On tablet- and phone-width viewports with no reduced-motion preference, the manifesto section MUST reveal its words and images once when first scrolled into view, and continue a smaller-amplitude scroll-linked drift without pinning the section.
- **FR-008**: When a visitor has a reduced-motion preference set, no hero, manifesto, or services entrance/scroll animation MUST run; the corresponding content MUST still be fully visible and readable.
- **FR-009**: Work section MUST display the total count of projects (using correct singular/plural wording) and a grid of the featured projects (capped at 7), plus a link to the full work listing.
- **FR-010**: Services section MUST display each configured service package's icon, title, description, up to 5 listed features, starting price, and a booking link.
- **FR-011**: On viewports with no reduced-motion preference, the services section header and each service card MUST fade and slide into view the first time the section scrolls into the visitor's viewport, and MUST NOT re-trigger on subsequent scrolling.
- **FR-012**: When required home page content is missing or fails validation (e.g., missing tagline, images, or an incorrect number of manifesto words), the system MUST surface an error instead of rendering fallback or placeholder content.
- **FR-013**: Each service card whose identifier does not match a known service category MUST still render using a generic fallback icon.
- **FR-014**: Decorative or visually-duplicated content (e.g., the manifesto's on-screen word repeats, service-card category icons) MUST be hidden from assistive technology, and every CMS-sourced image on the page MUST have meaningful alt text.
- **FR-015**: The hero logo, portrait image, and feature image MUST be prioritized for immediate loading (not deferred like below-the-fold imagery), so the hero is visible without a perceptible loading delay on initial page load.

### Key Entities

- **Home Page Content**: The CMS-managed content for the page — hero tagline, hero portrait and feature images (with alt text), hero CTA label/destination, the three manifesto words, two manifesto images, and the eyebrow labels for the work and services sections.
- **Work Project**: A featured or general portfolio entry with the image(s) and metadata needed to appear in the home page's project grid, plus a flag/ordering that determines whether and where it appears among featured projects.
- **Service Package**: A bookable offering with an identifying category, title, description, feature list, starting price, and booking destination, shown as a card in the services section.
- **Site Settings**: Site-level identity (e.g., site name) used for the hero logo's accessible label.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of home page visits render the hero's logo, tagline, portrait, feature image, and call-to-action with no missing or blank content, across desktop, tablet, and phone viewport widths.
- **SC-002**: Visitors with a reduced-motion preference can read and use every section of the home page (hero, manifesto, work, services) with zero scroll- or load-triggered motion.
- **SC-003**: The displayed project count on the home page matches the true total number of published work projects at all times, including correct singular/plural phrasing.
- **SC-004**: Every service package configured in the CMS appears on the home page with all of its required details (icon, title, description, features, price, booking link) visible.
- **SC-005**: An editor who updates the home page's tagline, images, manifesto words, or CTA in the CMS sees the change reflected on the live home page without any code change.
- **SC-006**: Home page content that is missing or invalid in the CMS never results in a visitor seeing broken, blank, or placeholder sections — it results in a visible error state instead.
- **SC-007**: 100% of decorative or visually-duplicated elements on the home page are hidden from assistive technology, and 100% of images have non-empty, meaningful alt text.
- **SC-008**: The hero logo, portrait, and feature image are prioritized for immediate loading and appear without a perceptible delay on initial page load, across supported viewport widths.

## Assumptions

- This specification documents the home page's current, already-implemented behavior as a baseline (per the request to "document the existing home page"), rather than proposing new functionality.
- "Desktop-width," "tablet-width," and "phone-width" correspond to the project's existing responsive breakpoint thresholds; exact pixel values are an implementation detail outside this document's scope.
- The featured-work cap of 7 projects and the services feature-list cap of 5 items reflect current, intentional display limits rather than incidental constraints.
- Sanity CMS remains the sole source of this page's content, consistent with the project's content-source-of-truth principle.
- Visitors' reduced-motion preference is read from OS/browser-level settings, not from an in-app toggle.
