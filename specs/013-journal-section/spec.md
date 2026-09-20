# Feature Specification: Journal Section

**Feature Branch**: `claude/larah-photo-journal-section-b8238c`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Add a Journal (blog) section to the Larah Photo site so the studio can publish long-form, location-specific articles that target local search terms the current five-page site cannot reach — e.g. \"best engagement photo spots London Ontario\" or \"wedding venues near London, Ontario\". Editors publish from the CMS Studio with no code change; a listing page and per-post pages carry article and breadcrumb structured data, appear in the sitemap, and join the primary navigation. Out of scope: comments, multiple authors, tags beyond one category, pagination, RSS."

## Clarifications

### Session 2026-09-14

- Q: When an editor sets a post's category in the Studio, should she pick from a fixed list, or type any text like she does for work projects today? → A: Fixed list — Portrait, Wedding, Engagement, Family, Graduation, Location Guide, Behind the Scenes; adding a category is a small code change.
- Q: What URL path and navigation label should the journal use? → A: `/journal` for the listing, `/journal/<slug>` for posts, labelled "Journal" in the primary navigation.
- Q: How should a post send readers on to the studio's work — a standard ending on every post, or related projects picked per post? → A: Standard ending only: every post ends with the same links to Contact and Work, worded in Journal page settings; no per-post related-project field.
- Q: What should happen when an editor gives a post a published date in the future? → A: Scheduled — the post stays hidden until its date arrives, then appears on its own, within the site's normal refresh window (up to an hour after the date).
- Q: Besides headings, paragraphs, images and links, what else should an editor be able to put in a post body? → A: Bulleted and numbered lists, optional image captions, pull quotes, bold/italic emphasis, and embeds (map and video), the last from an allowed-provider URL only.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read a local article found through search (Priority: P1)

A prospective client searches for something specific and local — a park, a venue, a style of session in London, Ontario — and lands directly on a journal post. The post reads as a real article: a clear title, a cover photograph, when it was published, where it is about, and a structured body of headings, paragraphs, photographs and links. Having read it, the visitor carries on into the studio's work gallery or contact page without hunting for the way there.

**Why this priority**: This is the reason the feature exists. A post page that renders correctly and is correctly represented to search engines delivers the local-search value on its own, even before a listing page or navigation entry exists — a post can be reached from search, from a shared link, or from the sitemap.

**Independent Test**: Publish one complete post, request its URL directly, and confirm the page shows every post field, that its search metadata and structured data describe that post, and that it offers a one-step path to the contact page and the work gallery.

**Acceptance Scenarios**:

1. **Given** a published post, **When** a visitor requests its URL, **Then** the page shows the post's title as the page's main heading, its cover image, its published date, its location, its category, and its full body — headings, paragraphs, lists, pull quotes, captioned images, links and embeds — in the order the editor wrote them.
2. **Given** a published post with no page-specific search title or description set, **When** its metadata is read, **Then** the search title is the post's title and the search description is the post's excerpt.
3. **Given** a published post with a page-specific search title and description set, **When** its metadata is read, **Then** those override values are used instead of the title and excerpt.
4. **Given** a published post, **When** its link is shared on social media or in a messaging app, **Then** the preview shows that post's own title, description and cover image.
5. **Given** a published post, **When** its structured data is read, **Then** it describes the post as an article (headline, cover image, published date, the studio as author and publisher) and includes a breadcrumb trail of Home › Journal › the post's title.
6. **Given** a visitor has finished reading a post, **When** they reach the end of it, **Then** they can go to the contact page and to the work gallery each in a single activation.
7. **Given** a visitor requests a post URL whose slug matches no live post, **When** the page is requested, **Then** a not-found outcome is returned and the page is not offered for indexing.

---

### User Story 2 - Publish, edit and unpublish a post from the Studio (Priority: P1)

The studio owner writes a new article in the CMS Studio the same way she already manages work projects and services: she fills in the post's fields, writes the body with headings and inline photographs, and publishes. Within seconds it is live — no developer, no deploy. Later she corrects a typo, or unpublishes a post entirely, and the live site follows.

**Why this priority**: Tied for first with Story 1. The journal only closes the content gap if new posts can be produced without code changes at a steady cadence; a post page nobody can publish to has no value, and a publishing flow with nowhere to render has none either. Story 1 is listed first only because it is the visible outcome.

**Independent Test**: In the Studio, create a post, try to publish it with a required field empty (and confirm the Studio blocks it), complete it and publish, confirm it appears live within the normal content-propagation window, edit it and confirm the change appears, then unpublish it and confirm its URL becomes not-found.

**Acceptance Scenarios**:

1. **Given** an editor is in the Studio, **When** they create a journal post, **Then** they can enter a title, a slug generated from the title, a cover image with alt text, an excerpt, a body, a location, a category, a published date, and optional search title and description overrides.
2. **Given** an editor is writing a post body, **When** they compose it, **Then** they can add section headings, paragraphs with bold and italic emphasis, bulleted and numbered lists, pull quotes, links on selected text, inline images each with its own required alt text and an optional caption, and map or video embeds pasted as a URL.
3. **Given** a post is missing any required field (title, slug, cover image, cover alt text, excerpt, body, location, category, published date) or has an inline image without alt text, **When** the editor tries to publish, **Then** the Studio prevents publishing and identifies the field that needs attention.
4. **Given** an editor publishes a complete post dated today or earlier, **When** publishing completes, **Then** the post is visible at its URL, on the journal listing, and in the sitemap within the same window that existing content changes take effect, with no deploy.
5. **Given** an editor publishes a post dated in the future, **When** publishing completes, **Then** the post stays absent from its URL, the listing and the sitemap, and the Studio shows the editor that the post is scheduled; **When** its date arrives, **Then** the post appears on its own with no further editor action.
6. **Given** an editor edits and republishes a live post, **When** publishing completes, **Then** the live post page and its listing entry reflect the change within that same window.
7. **Given** an editor unpublishes or deletes a live post, **When** the change takes effect, **Then** the post's URL returns a not-found outcome, and the post no longer appears on the listing page or in the sitemap.
8. **Given** a published post's data reaches the site incomplete despite Studio validation (for example after a content-model change), **When** a page that depends on it is requested, **Then** the site raises an explicit content error naming the post and the missing field, rather than rendering a placeholder or silently omitting the post.

---

### User Story 3 - Browse the journal from the navigation (Priority: P2)

A visitor already on the site selects "Journal" in the primary navigation and sees every live post, newest first, each shown with its cover image, title, excerpt and published date. They choose one and open the post.

**Why this priority**: The listing and navigation entry make the journal discoverable to visitors already on the site and give search engines a hub linking every post. Valuable, but the search-driven value of Story 1 and the publishing flow of Story 2 exist without it.

**Independent Test**: With several live posts carrying different published dates, open the journal listing and confirm every live post appears once, in reverse-chronological order, with all four listing fields; confirm the navigation marks Journal as the current section on both the listing and a post page.

**Acceptance Scenarios**:

1. **Given** several live posts, **When** a visitor opens the journal listing, **Then** every live post appears exactly once, ordered by published date with the most recent first, each showing its cover image, title, excerpt and published date, and each linking to its post page.
2. **Given** two posts share the same published date, **When** the listing renders, **Then** their relative order is stable across every request.
3. **Given** the editor has added a Journal entry to the primary navigation in site settings, **When** a visitor is on the journal listing or on any post page, **Then** that entry is marked as the current section, visually and for assistive technology.
4. **Given** the journal listing page loads, **When** its structured data is read, **Then** it describes the journal as a collection of articles and includes a breadcrumb trail of Home › Journal.
5. **Given** a visitor follows a link from the listing to a post, **When** the navigation happens, **Then** it behaves like every other internal page navigation on the site, including the branded page transition and focus moving to the new page's main content.
6. **Given** no posts are live yet, **When** a visitor opens the journal listing, **Then** the page renders its heading and an editor-authored empty-state message rather than an error or a blank area.

---

### Edge Cases

- **A post's published date is in the future.** The post is scheduled: it stays off the public site — its URL, the listing, the sitemap and all structured data — until that date arrives, then appears without anyone reopening the Studio. Because the site refreshes on its own at most hourly when no publish notification arrives, a scheduled post may appear up to an hour after its date rather than exactly at it.
- **An editor changes a live post's slug.** The post moves to the new URL, and the old URL returns not-found. No redirect is created; the Studio should warn that changing a published post's slug breaks existing links.
- **Two posts are given the same slug.** The Studio MUST NOT allow it — slugs are unique across journal posts.
- **A post slug collides with the listing path itself or with a work project slug.** Journal posts live under their own path, so a post and a work project may share a slug without conflict.
- **The excerpt, search title or search description is long.** The Studio advises the editor when the excerpt exceeds 200 characters, the search title exceeds 60, or the search description exceeds 160, but does not block publishing — these are guidance for how search results truncate, not content rules.
- **A search title or description override is set to only whitespace.** It is treated as not set, and the fallback (title or excerpt) is used.
- **An embed URL is from a provider that is not on the allowed list.** The Studio refuses it at publish time and explains why, rather than the site rendering an unknown third party's frame.
- **An embed is blocked or fails to load** (an extension, a strict browser, a provider outage). The post still reads end to end, and the embed's reserved space does not leave the layout broken (FR-002d).
- **A body link points to another page on this site.** It navigates within the site like any internal link, with the page transition. A link to another site opens as an ordinary external link and does not trigger the transition.
- **A body contains a heading at the same level as the page's main heading.** The post title is the page's only top-level heading; body headings are offered to the editor only at the levels beneath it, so the page's heading outline stays valid.
- **The post's category is one the work gallery uses.** The two sections share the category name but are independent: selecting a work filter does not show posts, and a post's category does not create or change a work filter.
- **A visitor has a reduced-motion preference.** Any entrance animation on the listing or post page does not run, and all content renders fully visible.
- **A post has many inline images.** Only images in or near the initial viewport load immediately; the rest load as the visitor scrolls toward them.
- **Zero live posts** (none published, or every published post still scheduled). The listing renders its empty state (Story 3, scenario 6), the sitemap still lists the listing page, and no post entries appear. This is a valid content state, not a content error — the same way an empty set of work projects is not an error today.

## Requirements _(mandatory)_

### Functional Requirements

**Content model & publishing**

- **FR-001**: The CMS Studio MUST provide a Journal Post content type with these fields: title (required), slug (required, unique across posts, generated from the title), cover image (required) with alt text (required), excerpt (required), body (required), location (required, free text in the same "venue, city, province" convention as the work project location field), category (required), published date (required, defaulting to the day the post is created), search title override (optional) and search description override (optional).
- **FR-002**: The post body MUST support section headings at the levels below the page's main heading; paragraphs, with bold and italic emphasis inside them; bulleted and numbered lists; links on selected text; pull quotes; inline images; and embeds. It MUST NOT be limited to a list of plain paragraph strings.
- **FR-002a**: Every inline image MUST require alt text and MUST accept an optional caption. The caption is shown to every reader beneath the image; the alt text describes the image for assistive technology. A caption MUST NOT satisfy the alt-text requirement, and an image MUST NOT be publishable with a caption but no alt text.
- **FR-002b**: An embed MUST be created by pasting a URL from an allowed provider — a map location or a video — and the set of allowed providers MUST be explicit. The editor MUST NOT be able to paste raw markup or script into a post. A URL from an unrecognised provider MUST be refused in the Studio, with an explanation, rather than published and rendered.
- **FR-002c**: Every embed MUST carry an editor-provided description naming what it shows, exposed to assistive technology. Embeds MUST NOT play automatically, MUST NOT load until the visitor scrolls near them, and MUST reserve their space in the layout so surrounding text does not shift when they load.
- **FR-002d**: A post's readable content — title, cover image, body text and images — MUST render and be readable regardless of whether an embed loads, is slow, or is blocked by the visitor's browser or extensions. A failed embed MUST NOT blank the page, collapse the layout, or raise a content error.
- **FR-003**: The category field MUST offer a fixed list the editor chooses from, containing the five categories the work gallery uses today — Portrait, Wedding, Engagement, Family, Graduation — plus two editorial categories: Location Guide and Behind the Scenes.
- **FR-004**: The Studio MUST prevent publishing a post with any required field empty, or with an inline image missing alt text, and MUST indicate which field needs attention.
- **FR-005**: The Studio MUST advise, without blocking, when the excerpt exceeds 200 characters, the search title override exceeds 60 characters, or the search description override exceeds 160 characters.
- **FR-006**: The CMS Studio MUST provide Journal page settings that hold the listing page's heading, the empty-state message shown when no posts are published, and the end-of-post call-to-action copy. None of this copy may be written into the site's code.
- **FR-007**: Publishing, editing, unpublishing or deleting a post MUST take effect on the live site through the same content-update mechanism as all existing content — within seconds of a publish notification, and at most one hour later if a notification is missed — with no deploy.
- **FR-007a**: A post is **live** when it is published in the Studio AND its published date has arrived. A published post dated in the future is **scheduled**: it MUST NOT appear at its own URL, on the listing page, in the sitemap, or in any structured data until its date arrives, and MUST then appear with no further editor action, within the same refresh window as FR-007 (so at most one hour after the date). The published date is a calendar date, and a post becomes live at the start of that day in the studio's own time zone (America/Toronto), not the visitor's.
- **FR-007b**: The Studio MUST show the editor whether a published post is live or still scheduled, so a future date is never mistaken for a failed publish.

**Post page**

- **FR-008**: The journal listing MUST be available at `/journal`, and each published post at its own canonical URL `/journal/<slug>`, formed from the post's slug.
- **FR-009**: The post page MUST display the post title as the page's single top-level heading, followed by the cover image, the published date, the location, the category, and the body rendered with its full structure intact.
- **FR-010**: The published date MUST be shown in a human-readable form and exposed to assistive technology and search engines as a date, and MUST display as the calendar date the editor chose regardless of the visitor's time zone.
- **FR-011**: Every post page MUST end with a call-to-action offering a single-activation path to the contact page and to the work gallery, using the copy from Journal page settings.
- **FR-012**: A request for a slug that matches no live post — unknown, unpublished, deleted, or still scheduled — MUST produce a not-found outcome, and that response MUST NOT be offered for indexing.

**Listing page**

- **FR-013**: The journal listing page MUST show every live post exactly once, ordered by published date descending, with a stable tiebreak for posts sharing a date (most recently created first).
- **FR-014**: Each listing entry MUST show the post's cover image, title, excerpt and published date, and MUST link to the post page.
- **FR-015**: When no posts are live — none published, or every published post still scheduled — the listing page MUST render its heading and the editor-authored empty-state message.
- **FR-016**: The listing is a single unpaginated page; it MUST NOT paginate or load more posts on scroll.

**Search metadata, structured data & sitemap**

- **FR-017**: Each post page MUST expose a distinct title, description, canonical URL and social preview. The title MUST be the search title override when set and non-blank, otherwise the post title; the description MUST be the search description override when set and non-blank, otherwise the excerpt; the preview image MUST be the post's cover image.
- **FR-018**: The listing page MUST expose its own distinct title, description, canonical URL and social preview, derived the same way the other listing page on the site (the work page) derives its own.
- **FR-019**: Each post page MUST embed structured data describing the post as an article — headline, description, cover image, published date, last-modified date, and the studio as both author and publisher, referencing the studio identity the page shell already declares — together with a breadcrumb trail Home › Journal › post title.
- **FR-020**: The listing page MUST embed structured data describing the journal as a collection of the live articles, together with a breadcrumb trail Home › Journal.
- **FR-021**: The sitemap MUST list the journal listing page and every live post's page. Each post entry MUST carry its cover image and inline images, as work project entries carry their photographs, and a last-modified time reflecting when that post was last changed.
- **FR-022**: Unpublished, deleted and scheduled posts MUST NOT appear in the listing, the sitemap, or any structured data.

**Navigation & shell**

- **FR-023**: The journal listing and post pages MUST render inside the site's standard page shell — header, footer, skip-to-content link, page transition and route-change focus handling — with no journal-specific exceptions.
- **FR-024**: When site settings contain a primary navigation entry pointing to `/journal` (labelled "Journal"), that entry MUST be marked as the current section on the listing page and on every post page. Adding, renaming or reordering that entry remains an editor action in site settings.

**Content errors, accessibility & performance**

- **FR-025**: When a published post, or the Journal page settings, reaches the site missing a required field, the page depending on it MUST raise an explicit content error identifying the document and the field, consistent with every other content type on the site. It MUST NOT render a placeholder, substitute default copy, or silently skip the post.
- **FR-026**: Every image on journal pages — cover and inline — MUST render with its editor-provided alt text.
- **FR-027**: Any entrance animation on the listing or post page MUST be skipped under a reduced-motion preference, with all content fully visible.
- **FR-028**: Only listing covers and post images in or near the initial viewport MUST load immediately; the rest MUST be deferred until the visitor scrolls near them.

### Key Entities

- **Journal Post**: A single long-form article. Title, unique slug, cover image with alt text, excerpt, structured body, location, category, published date, optional search title and description overrides, and a last-changed time maintained by the CMS. Visible on the public site only while published and its published date has arrived (see FR-007a).
- **Post Body**: The ordered content of a post — section headings; paragraphs with bold/italic emphasis; bulleted and numbered lists; pull quotes; text links; inline images, each with required alt text and an optional caption; and map or video embeds, each identified by a provider URL and an accessible description.
- **Post Category**: One value from a fixed list shared in name with the work gallery's categories (Portrait, Wedding, Engagement, Family, Graduation) plus editorial categories (Location Guide, Behind the Scenes). Used for display and structured data; it drives no filtering in this feature.
- **Journal Page Settings**: A single settings document holding the listing heading, the empty-state message, and the end-of-post call-to-action copy.
- **Navigation Item** _(existing)_: The editor-managed site settings entry that adds the journal to the primary navigation.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The studio owner can take a finished draft from the Studio to a live post page within 1 minute of pressing publish (for a post dated today or earlier), with zero code changes and zero deploys — sustained across every post published in the first three months.
- **SC-002**: 100% of live posts appear on the listing page in the correct order and in the sitemap; 0 unpublished, deleted or still-scheduled posts are reachable at their URL, on the listing, or in the sitemap once the change has taken effect. A scheduled post appears within 1 hour of its date arriving, with no editor action.
- **SC-003**: 100% of journal pages pass structured-data validation for their article or collection type and their breadcrumb with zero errors.
- **SC-004**: 100% of post pages expose a title, description, canonical URL and preview image unique to that post; 0 post pages have an empty description.
- **SC-005**: 0 journal pages ever render placeholder or default content; every test case of a published post or Journal page settings missing a required field produces an explicit content error.
- **SC-006**: From the end of any post, a visitor reaches the contact page or the work gallery in 1 activation.
- **SC-007a**: A post containing embeds becomes readable — title, cover image and body text — without waiting for any embed to load, in 100% of cases, including when every embed is blocked.
- **SC-007**: A keyboard or screen-reader visitor can reach and read every post field and every body section, with every image announced by its alt text — 0 accessibility violations of the kind the site's existing checks detect.
- **SC-008**: Within three months of the first posts going live, journal posts appear in the site's search analytics with impressions for local long-tail queries that none of the five existing pages had impressions for. (A business outcome to track after launch, not a release gate.)

## Assumptions

- **The studio owner is the only author.** Article structured data names the studio itself — the business identity the site already declares — as author and publisher. No per-person author field or bio exists.
- **"Override with fallback" is new to the editor, not to the site.** No existing content type has editor-set search title or description fields today; the site's pages derive their titles and descriptions from content in code, and project pages already swap in their own photograph for the site-wide preview image. The journal is the first content type where the editor can override search title and description directly. Adding the same override fields to the existing pages is out of scope.
- **The category list is fixed rather than free text.** Work project categories are free text today and the gallery's filters are derived from whatever values exist. A fixed list was confirmed for posts (see Clarifications) so typos ("Weddings", "wedding ") cannot split one category into several. Adding a new category is a small content-model change requiring a code change and deploy, made rarely; it never blocks publishing a post in an existing category.
- **Categories drive no filtering or category archive pages.** The listing is a single list (the brief rules out a wider taxonomy and pagination); category is shown on the post and emitted in structured data.
- **The published date schedules the post** (see Clarifications). A post goes live when it is published and its date has arrived, so an editor can finish a post today and have it appear on a chosen future date. Timing is approximate rather than exact: with no publish notification to trigger it, the site refreshes at most hourly, so a scheduled post can appear up to an hour after its date. Scheduling to a specific time of day is out of scope — the field is a calendar date, read in the studio's own time zone.
- **No redirects on slug change.** Changing a published post's slug breaks the old URL; the Studio warns the editor, but redirect management is out of scope.
- **The journal lives at its own top-level path, `/journal`** (see Clarifications), separate from `/work`, so post and project slugs never collide. The path is treated as permanent once posts are indexed; changing it later would require redirects, which are out of scope.
- **The home page is unchanged.** A "latest posts" teaser on the home page, related-post suggestions, and a structured "related work projects" field on posts are out of scope (see Clarifications). An editor can still point readers at a specific gallery with an ordinary link in the post body.
- **Visual design follows the existing design system.** There is no dedicated design for the journal yet; listing and post pages compose the site's existing tokens and shared components. If a design is produced before implementation, it takes precedence.
- **Image delivery stays within the current budget.** Journal images use the site's existing image sizes and quality settings; no new ones are introduced.
- **Embeds are third-party content, and are treated as such** (see Clarifications). They are the only part of a journal page served by someone other than this site, which is why they are limited to an explicit provider allow-list, loaded only when scrolled near, and never permitted as raw editor-supplied markup. Where a provider offers a privacy-preserving embed mode (for example a no-tracking-cookie video URL), that mode is the one to use: the site has no cookie-consent banner today, and this feature does not add one. The provider list is expected to be short — a map provider and one or two video providers — and adding to it is a code change, like adding a category.
- **Embeds are optional in every post.** A post with no embed is complete and normal; embeds are for venue guides and similar posts where a map or a walkthrough video genuinely helps.
- **Critical-flow coverage applies.** Journal content-error handling is part of the site's "content error handling" critical flow and needs the same automated coverage the existing content types have before it ships.
- **Downstream spec updates.** When implemented, this feature changes behaviour documented in three retrospective specs, which should be updated in the same change: `006-site-navigation-shell` (a new section in the shell), `007-cms-studio-content-sync` (new content types in the Studio) and `008-seo-metadata` (new public pages, sitemap entries and structured data types).
- **Out of scope** (from the brief): comments or any reader interaction, multiple authors or author bios, tags or any taxonomy beyond the single category, pagination or infinite scroll, and an RSS feed.
