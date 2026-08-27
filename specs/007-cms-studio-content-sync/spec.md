# Feature Specification: CMS Studio & Content Sync

**Feature Branch**: `007-cms-studio-content-sync`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "CMS Studio & content sync — Document the existing CMS integration: the embedded Sanity Studio, and the revalidate webhook that invalidates the site's cache on content changes."

## Clarifications

### Session 2026-08-20

- Q: The webhook endpoint only validates the HMAC signature — it has no replay protection or rate limiting beyond that. Should the spec explicitly document this as a known limitation, or leave it unmentioned? → A: Document as a known limitation so a future reader doesn't mistake silence for a guarantee.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Edit site content through the Studio (Priority: P1)

An editor signs in to the content editing interface, hosted as part of the site, and updates the site's pages, projects, services, and settings through structured forms rather than by touching code.

**Why this priority**: The entire site's content model depends on editors being able to reach and use this interface; without it, no content can be managed at all.

**Independent Test**: Open the Studio route and confirm it loads a complete editing interface listing the site's content types, independent of any public-facing page.

**Acceptance Scenarios**:

1. **Given** an authorized editor navigates to the Studio route, **When** it loads, **Then** they see a content editing interface covering every content type the site uses (site settings, pages, work projects, service packages).
2. **Given** the Studio interface renders, **When** it loads, **Then** it displays with its own complete visual design, unaffected by the public site's styling.
3. **Given** a search engine or crawler reaches the Studio route, **When** it requests the page, **Then** the response indicates the page must not be indexed or followed.

---

### User Story 2 - See published edits appear on the live site quickly (Priority: P2)

After an editor publishes a change in the Studio, that change becomes visible on the live public site within seconds, without anyone needing to trigger a deploy or manually clear a cache.

**Why this priority**: Editors expect their changes to take effect promptly; without fast propagation the CMS would still work but would feel unreliable and hard to trust, so this ranks just below having an editing interface at all.

**Independent Test**: Publish a change to any content type in the Studio and confirm the corresponding public page reflects the new content within seconds, without a code deploy.

**Acceptance Scenarios**:

1. **Given** an editor publishes a change to any content document, **When** the publish completes, **Then** a notification is sent that causes the site's cached content for that change to be invalidated.
2. **Given** the site's cache has just been invalidated for a change, **When** the next visitor requests an affected page, **Then** they are served content reflecting the update, with any use of a temporarily stale cached response no later than the following request.
3. **Given** no publish has occurred recently, **When** the site's automatic cache expiry window elapses, **Then** the site refreshes its content from the CMS on its own, even without a publish notification.

---

### Edge Cases

- What happens when the cache-invalidation notification arrives without a valid signature/secret? The system MUST reject it rather than invalidating the cache.
- What happens when the notification's payload doesn't identify a content type? The system MUST reject it as invalid rather than invalidating the cache blindly.
- What happens when the cache-invalidation mechanism is not configured (no secret set)? The endpoint MUST fail clearly rather than silently accepting notifications it cannot verify.
- What happens when a document is published as soon as it is created, before it's fully consistent across the CMS's storage? The invalidation MUST still result in the fresh version being served, not a partially-updated one.
- **Known limitation**: The notification endpoint validates only the request's signature; it does not currently implement replay protection (rejecting a previously-seen valid request) or rate limiting. A validly-signed request can be resent without being detected as a duplicate.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The site MUST provide an embedded content editing interface, reachable at a dedicated route, covering every content type the public site renders (site settings, home/about/service/contact/work page content, work projects, service packages).
- **FR-002**: The editing interface MUST render with its own visual design, isolated from the public site's global styling.
- **FR-003**: The editing interface's route MUST be excluded from search engine indexing and following.
- **FR-004**: The system MUST expose a notification endpoint that, given a valid signed request identifying a changed content type, invalidates the site's cached content so subsequent requests reflect the change.
- **FR-005**: The notification endpoint MUST reject requests with an invalid or missing signature, and MUST reject requests whose payload does not identify a content type.
- **FR-006**: When the endpoint's required signing secret is not configured, the endpoint MUST respond with a clear failure rather than accepting unverifiable requests.
- **FR-007**: Independent of any publish notification, the site MUST automatically refresh its cached content from the CMS on a fixed maximum interval, so content eventually becomes current even if a notification is missed.

### Key Entities

- **Content Document**: Any CMS-managed record the public site depends on (site settings, page content documents, work projects, service packages), each with a content type used to route change notifications.
- **Cache Invalidation Notification**: A signed request identifying which content type changed, used to trigger a targeted cache refresh.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An editor can reach and use the content editing interface for every content type the site depends on, with zero content types unmanageable through it.
- **SC-002**: A published content change is reflected on the live site within seconds of publishing, for at least the next visitor request after invalidation.
- **SC-003**: Unsigned or invalid cache-invalidation requests never succeed in invalidating the cache.
- **SC-004**: Even with zero publish notifications, no page's content is more than one hour stale relative to the CMS.
- **SC-005**: The content editing interface is never indexed by search engines.

## Assumptions

- This specification documents the current, already-implemented CMS integration as a baseline, rather than proposing new functionality.
- "Editor" refers to anyone with valid credentials to the CMS project; authentication/authorization within the editing interface itself is provided by the CMS platform and is out of scope for this specification.
- The one-hour automatic refresh interval is the current, intentional fallback cadence rather than an incidental value.
