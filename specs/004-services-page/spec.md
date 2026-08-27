# Feature Specification: Services Page

**Feature Branch**: `004-services-page`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Services page — Document the existing services page: a list of service packages (ServiceExperience) sourced from Sanity servicePackage/servicePage schemas."

## Clarifications

### Session 2026-08-20

- Q: Should the services page spec include an explicit image-loading performance requirement, matching the same treatment given to the home page and work gallery? → A: Add a requirement that only the initially visible package images load immediately and the rest defer.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Review service packages and book (Priority: P1)

A visitor navigates to the services page to see what photography sessions are offered, reviews each package's description, included features, and starting price, and follows a "Book now" link to inquire about the one they want.

**Why this priority**: This page exists to convert visitor interest into a booking inquiry; without a clear, complete list of bookable packages the page has no purpose.

**Independent Test**: Load the services page and confirm each configured service package renders with its title, description, image, feature list, starting price, and a working "Book now" link, then confirm following that link reaches the booking destination.

**Acceptance Scenarios**:

1. **Given** a visitor opens the services page, **When** the page finishes loading, **Then** the page title and every configured service package appear, each showing an index/order marker, title, description, image, list of included features, starting price, and a "Book now" link.
2. **Given** a visitor selects a package's "Book now" link, **When** they activate it, **Then** they are taken to that package's configured booking destination.
3. **Given** a visitor's browser has no motion restrictions, **When** the page loads, **Then** the title and each service package animate into place in a staggered sequence rather than appearing all at once.
4. **Given** a visitor has requested reduced motion, **When** the page loads, **Then** the same title and all service packages are fully visible immediately, without any entrance animation.

---

### Edge Cases

- What happens when the services page has zero configured service packages? The page MUST still render its title without error, showing no package rows rather than broken layout.
- What happens when a service package is missing its price? The page MUST NOT display a broken or malformed price value.
- What happens when a service package doesn't specify a booking link? The system MUST fall back to the site's general contact destination.
- What happens when required content (page title, or a package's title/image) is missing or invalid in the CMS? The page MUST surface an error rather than silently rendering blank space or placeholder content.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Services page MUST render its title and the full list of configured service packages entirely from CMS-managed content, with no hardcoded production copy, pricing, or imagery in the page itself.
- **FR-002**: Each service package MUST display its display index/order marker, title, description, image, an ordered list of included features, and a starting price.
- **FR-003**: Each service package MUST include a "Book now" link that navigates to that package's configured booking destination, defaulting to the site's general contact page when none is configured.
- **FR-004**: On viewports with no reduced-motion preference, the page title and each service package row MUST animate into view in a staggered sequence on load.
- **FR-005**: When a visitor has a reduced-motion preference set, no entrance animation MUST run; the title and every service package MUST still be fully visible and readable.
- **FR-006**: When required services page content is missing or fails validation, the system MUST surface an error instead of rendering fallback or placeholder content.
- **FR-007**: Service packages MUST render in the order configured in the CMS.
- **FR-008**: Only service package images visible in the initial viewport MUST be prioritized for immediate loading; images for packages further down the page MUST defer until the visitor scrolls near them.

### Key Entities

- **Service Page Content**: CMS-managed page-level copy for the services index (title words).
- **Service Package**: A bookable photography session offering with a display index, title, description, feature list, starting price, an image (with alt text), and a booking link destination.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of configured service packages appear on the services page with complete details (title, description, image, features, price, booking link).
- **SC-002**: A visitor can go from the services page to the booking destination for any package in a single click.
- **SC-003**: Visitors with a reduced-motion preference can read the full services page with zero load-triggered motion.
- **SC-004**: An editor who adds, removes, reorders, or updates a service package in the CMS sees the change reflected on the live services page without any code change.
- **SC-005**: Services page content that is missing or invalid in the CMS never results in a visitor seeing a broken, blank, or placeholder page — it results in a visible error state instead.
- **SC-006**: Package images below the initial viewport never load before the visitor scrolls near them, keeping initial page load proportional to what's visible rather than the full package list.

## Assumptions

- This specification documents the services page's current, already-implemented behavior as a baseline, rather than proposing new functionality.
- Sanity CMS remains the sole source of this page's content, consistent with the project's content-source-of-truth principle.
- Pricing is displayed in a single site-wide currency; multi-currency display is out of scope.
- Visitors' reduced-motion preference is read from OS/browser-level settings, not from an in-app toggle.
