# Feature Specification: SEO & Metadata

**Feature Branch**: `008-seo-metadata`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "SEO & metadata — Document existing SEO surface: sitemap, robots.txt, web manifest, and per-page metadata and structured data."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Be discoverable and correctly represented in search results (Priority: P1)

A search engine crawls the site, discovers every public page (and each work project's photos) through a sitemap, and for each page reads a distinct, accurate title, description, canonical URL, and preview image so that search results and shared links represent that specific page rather than a generic fallback.

**Why this priority**: Without correct discovery and per-page metadata, the site cannot be found or fairly represented in search results or link previews, which undermines the site's purpose as a public portfolio.

**Independent Test**: Fetch the sitemap and confirm it lists every static page and every published project's URL with its photos; separately, request any page's metadata and confirm it has a distinct title, description, canonical URL, and preview image matching that page's own content.

**Acceptance Scenarios**:

1. **Given** a crawler requests the site's sitemap, **When** it is generated, **Then** it lists every static public page and every published work project's page, each with the photos belonging to that project.
2. **Given** a crawler or visitor requests any public page, **When** its metadata is read, **Then** the page has its own title, description, canonical URL, and social preview image distinct from every other page's.
3. **Given** a visitor shares a link to any public page on social media or messaging apps, **When** the link is unfurled, **Then** the preview shows that page's own title, description, and image.
4. **Given** a crawler requests the site's robots rules, **When** the site is not yet ready to be indexed, **Then** the rules disallow crawling entirely; once the site is ready, **Then** the rules allow crawling of public pages while disallowing the CMS Studio and internal API routes, and reference the sitemap.

---

### User Story 2 - See rich results and an installable app icon (Priority: P2)

A search engine renders enhanced ("rich") results for the studio's business identity, work projects, and services using structured data embedded in each page, and a visitor who adds the site to their home screen sees a proper app name, icon, and theme color instead of a bare browser tab.

**Why this priority**: Structured data and a web manifest improve how the site is presented once it is already discoverable, but the site remains functional and indexable without them, so this ranks below basic discoverability.

**Independent Test**: Inspect the structured data embedded in the home, work, project, service, about, and contact pages and confirm each describes the correct entity type and content; separately, request the web app manifest and confirm it declares the site's name, icons, and theme colors.

**Acceptance Scenarios**:

1. **Given** any public page loads, **When** its structured data is read, **Then** it includes the studio's business identity; and for pages below the site root (work listing, project detail, services, contact), a breadcrumb trail matching that page's position in the site.
2. **Given** the work listing page loads, **When** its structured data is read, **Then** it describes the collection of work projects; given a project detail page loads, **Then** its structured data describes that specific project.
3. **Given** the services page loads, **When** its structured data is read, **Then** it describes the list of service packages, priced in the site's configured currency.
4. **Given** a visitor requests the web app manifest, **When** it is read, **Then** it declares the site's name, description, start URL, display mode, background/theme colors, and icon set.

---

### Edge Cases

- What happens when the site is not yet ready for public launch? Crawling MUST be fully disallowed for every route, regardless of any other robots rule.
- What happens when a page has no dedicated preview image available (e.g. no projects exist yet)? The page MUST still produce valid metadata using the site-wide fallback image rather than omitting the image entirely or erroring.
- What happens for the intercepted project-preview overlay versus the standalone project page, both reachable at the same URL? The overlay is a client-side-navigation presentation only — a crawler, a shared link, or a refresh always renders the standalone page. So exactly one canonical URL and one set of structured data exist per project, and duplicate content cannot arise.
- What happens if the site is marked ready for indexing but the public site URL is still misconfigured (e.g. pointing at a local address)? The system MUST fail loudly (e.g. at build/startup) rather than publish incorrect canonical/OG URLs to the public.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST generate a sitemap listing every static public page and every published work project's detail page, with each project entry including its card image and full gallery images.
- **FR-002**: Every public page MUST expose a distinct page title, meta description, canonical URL, and Open Graph/social preview metadata derived from that page's own content.
- **FR-003**: System MUST generate robots rules that fully disallow crawling when the site is not marked ready for indexing, and that otherwise allow crawling of public pages while disallowing the CMS Studio route and internal API routes, referencing the sitemap.
- **FR-004**: System MUST generate a web app manifest declaring the site's name, short name, description, start URL, display mode, background color, theme color, and an icon set including a maskable icon.
- **FR-005**: Every public page MUST embed structured data describing the studio's business identity, emitted once from the shared page shell so no individual page can omit it.
- **FR-005a**: Pages that sit below the site root MUST additionally embed a breadcrumb trail reflecting their position in the hierarchy. This applies to the work listing, project detail, services, about, and contact pages. The home page carries a site-level descriptor instead of a breadcrumb (it _is_ the root, so a trail would have a single entry).
- **FR-006**: The work listing page MUST embed structured data describing the collection of work projects; each project detail page MUST embed structured data describing that specific project. The in-app overlay does not emit its own structured data and does not need to: interception occurs only on client-side navigation, so any crawler, shared link, or page refresh receives the standalone project page and its structured data instead.
- **FR-007**: The services page MUST embed structured data describing the list of service packages, including pricing in the site's configured currency.
- **FR-008**: The about and contact pages MUST embed structured data describing their respective content.
- **FR-009**: A project's URL MUST resolve to exactly one canonical URL, so search engines and shared links never see duplicate content. The in-app overlay does not declare its own canonical URL; because interception applies only to client-side navigation, every crawler or direct request to a project URL renders the standalone page and reads that page's canonical.
- **FR-010**: When a page has no page-specific preview image, metadata generation MUST fall back to a site-wide default image rather than omitting the image or failing.
- **FR-011**: If indexing is enabled while the configured public site URL is invalid (e.g. a local address), the system MUST fail at build/startup rather than publish incorrect canonical and social URLs.

### Key Entities

- **Page Metadata**: Per-route title, description, canonical URL, and social preview data derived from that page's content.
- **Sitemap Entry**: A public URL with its last-modified timestamp and, for project pages, the set of associated images.
- **Structured Data Document**: A page-embedded description of an entity (business, breadcrumb, work collection, project, service list, about, contact) used by search engines for rich results.
- **Site Indexability Setting**: A site-wide flag controlling whether the site is crawlable at all, independent of individual page rules.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of public pages and published work projects appear in the sitemap.
- **SC-002**: 100% of public pages expose a distinct title, description, canonical URL, and preview image matching their own content — zero pages share another page's metadata.
- **SC-003**: When the site is not marked ready for indexing, 0% of routes are crawlable; once marked ready, 100% of public routes are crawlable and the CMS Studio and API routes remain disallowed.
- **SC-004**: A link to any public page, when shared, unfurls with that page's own title, description, and image in social/messaging previews.
- **SC-005**: Every public page passes structured-data validation for its declared entity type(s) with zero errors.
- **SC-006**: A visitor who installs the site to their home screen sees the correct app name, icon, and theme color, matching the site's brand.

## Assumptions

- This specification documents the site's current, already-implemented SEO and metadata behavior as a baseline, rather than proposing new functionality.
- Site indexability is controlled by a single site-wide setting that defaults to "not indexable," requiring an explicit, deliberate opt-in before launch.
- "Public pages" refers to the home, work listing, project detail, about, service, and contact pages; the CMS Studio and internal API routes are explicitly excluded from indexing and structured data.
- The about page was originally missing the breadcrumb every other sub-page emits (FR-005a). That gap was an oversight rather than a design choice, and has since been closed: the page now emits the same two-entry trail as the contact page.
