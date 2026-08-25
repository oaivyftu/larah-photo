# Feature Specification: Contact Page

**Feature Branch**: `005-contact-page`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Contact page — Document the existing contact page: content sourced from the contactPage schema and site settings, showing direct contact details (email, phone, Instagram)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a way to get in touch (Priority: P1)

A visitor navigates to the contact page to find a way to reach the photographer, and sees a page title along with the studio's email address, phone number, and Instagram handle, each usable as a direct link (email client, phone dialer, or Instagram profile).

**Why this priority**: This is the entire content and purpose of the page; without it a visitor has no way to reach the photographer.

**Independent Test**: Load the contact page and confirm the title and all three contact methods (email, phone, Instagram) are visible, each a working link to the correct destination.

**Acceptance Scenarios**:

1. **Given** a visitor opens the contact page, **When** the page finishes loading, **Then** the page title, an email link, a phone link, and an Instagram link are all visible.
2. **Given** a visitor selects the email link, **When** they activate it, **Then** their email client opens a new message addressed to the studio's configured email address.
3. **Given** a visitor selects the phone link, **When** they activate it, **Then** their device offers to dial the studio's configured phone number.
4. **Given** a visitor selects the Instagram link, **When** they activate it, **Then** it opens the studio's configured Instagram profile in a new tab, labeled with the account's handle.
5. **Given** a visitor's browser has no motion restrictions, **When** the page loads, **Then** the title and contact details animate into place in a staggered sequence rather than appearing all at once.
6. **Given** a visitor has requested reduced motion, **When** the page loads, **Then** the same title and contact details are fully visible immediately, without any entrance animation.

---

### Edge Cases

- What happens when the configured Instagram URL doesn't include a parseable username? The link MUST still work and MUST fall back to a generic "Instagram" label rather than breaking or showing malformed text.
- What happens when the page title, email, phone, or Instagram URL is missing or invalid in the CMS/site settings? The page MUST surface an error rather than silently rendering blank space or placeholder content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Contact page MUST render its title from CMS-managed content, with no hardcoded production copy in the page itself.
- **FR-002**: Contact page MUST display the studio's email, phone number, and Instagram profile as direct, individually labeled links, sourced from site-wide settings.
- **FR-003**: The email link MUST open the visitor's email client addressed to the configured email address; the phone link MUST invoke the visitor's dialer with the configured phone number.
- **FR-004**: The Instagram link MUST open the configured profile URL in a new tab and MUST derive its visible label from the profile's username, falling back to a generic label when a username cannot be parsed from the URL.
- **FR-005**: On viewports with no reduced-motion preference, the page title and contact details MUST animate into view in a staggered sequence on load.
- **FR-006**: When a visitor has a reduced-motion preference set, no entrance animation MUST run; the title and contact details MUST still be fully visible and readable.
- **FR-007**: When required contact page content is missing or fails validation, the system MUST surface an error instead of rendering fallback or placeholder content.

### Key Entities

- **Contact Page Content**: CMS-managed page-level copy for the contact page (title words).
- **Site Contact Settings**: Site-wide settings supplying the studio's email address, phone number, and Instagram URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of contact page visits render the title and all three contact links (email, phone, Instagram) with no missing or blank content.
- **SC-002**: Every contact link on the page opens the correct destination (mail composer, dialer, or Instagram profile) on first activation.
- **SC-003**: Visitors with a reduced-motion preference can read the full contact page with zero load-triggered motion.
- **SC-004**: An editor who updates the contact page's title or the studio's email, phone, or Instagram URL in site settings sees the change reflected on the live contact page without any code change.
- **SC-005**: Contact page content that is missing or invalid never results in a visitor seeing a broken, blank, or placeholder page — it results in a visible error state instead.

## Assumptions

- This specification documents the contact page's current, already-implemented behavior as a baseline, rather than proposing new functionality.
- Sanity CMS and site settings remain the sole source of this page's content, consistent with the project's content-source-of-truth principle.
- Visitors' reduced-motion preference is read from OS/browser-level settings, not from an in-app toggle.
- An inquiry form component exists in the codebase but is not currently rendered on the contact page and has no working submission endpoint; it is out of scope for this specification since it is not part of the page's live, user-facing behavior.
