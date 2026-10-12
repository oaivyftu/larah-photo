# Feature Specification: Service Landing Pages

**Feature Branch**: `claude/larah-service-landing-pages-2c6a15`

**Created**: 2026-10-06

**Amended**: 2026-10-07 — content-quality requirements added (FR-038 to FR-043) before planning, so that every page carries its own substantial, accurate, locally specific content rather than a template with the keyword swapped.

**Status**: Draft

**Input**: User description: "Add service landing pages for the Larah Photo site so a prospective client who searches for a specific kind of session in London, Ontario — for example \"portrait photographer London Ontario\", \"engagement photographer London Ontario\", \"pre-wedding photographer London Ontario\", \"family photographer London Ontario\" or \"graduation photographer London Ontario\" — can land on a page that is about exactly that service, rather than on the generic home or work pages. One landing page per service package the studio sells (Portrait, Engagement, Family, Graduation), each tied to one service package and one project category, added, edited and removed in the CMS Studio with no code change. Engagement is also searched as \"pre-wedding\", so that page is written for both names and an editor can record an alternate name for any service; both names resolve to the one Engagement page. Each page has an editor-controlled published switch, its own title, description, canonical URL and social preview image, appears in the sitemap when published, is linked from the services page and from the matching projects, and carries service, FAQ and breadcrumb structured data tied to the studio's business identity. Out of scope: a standalone pre-wedding page, wedding-day pages, neighbourhood or other-city pages, changes to the work page filter, and any change to the home page copy or the primary navigation."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Land on a page about exactly the service I searched for (Priority: P1)

A prospective client searches for a specific kind of session in London, Ontario — "family photographer London Ontario", say — and lands directly on a page that is about family sessions and nothing else. The page names the service and the city in its heading, opens with a short introduction from the studio, explains in a few sections what is particular to that kind of session, shows the studio's published family projects, shows the matching service package with its starting price, answers the questions a client usually has before booking, and ends with an obvious way to get in touch.

The page has to feel complete even when the category is thin. Family and Graduation have two projects each today; the introduction, the editorial sections, the package with its price and the questions carry the page, and the projects are simply whichever published ones exist. What the page says is the studio's own and specific to that service — it is not the same page with the service name swapped.

**Why this priority**: This is the reason the feature exists. A single complete landing page, correctly represented to search engines, delivers the local-search value on its own — before any other page exists, before the sitemap or the internal links are in place.

**Independent Test**: Publish one landing page for a category with only a couple of projects, request its URL directly, and confirm every section is present and readable, the metadata and structured data describe that service, and the contact page is one activation away.

**Acceptance Scenarios**:

1. **Given** a live landing page, **When** a visitor requests its URL, **Then** the page shows, in this order: a single top-level heading naming the service and the city, the editor's introduction, the editor's content sections, the published projects in the matching category, the matching service package, the editor's frequently asked questions, and a call to action leading to the contact page.
2. **Given** a live landing page whose category holds only two published projects, **When** the page renders, **Then** exactly those two projects appear and the page shows no empty slot, gap or placeholder where further projects would go.
3. **Given** a live landing page, **When** a visitor looks at the service package, **Then** it shows the package's title, description, included features, starting price in the site's currency, image and booking link — the same details the services page shows for that package.
4. **Given** a live landing page, **When** a visitor selects one of its projects, **Then** they reach that project's own page.
5. **Given** a live landing page, **When** a visitor activates the contact call to action, **Then** they reach the contact page.
6. **Given** a live landing page, **When** its metadata is read, **Then** it has a title, description, canonical URL and social preview image of its own. The title, description and canonical URL are shared with no other page on the site, and the preview image with no other landing page. (The services page already previews with the lead package's image and is not changed, so the landing page for that one package shares that image with it.)
7. **Given** a live landing page, **When** its structured data is read, **Then** it describes the service, the page's questions and answers, and a breadcrumb trail, and refers to the studio's existing business identity rather than restating it.
8. **Given** a request for a URL that matches no live landing page — unknown, switched off, or deleted — **When** the page is requested, **Then** a not-found outcome is returned and the response is not offered for indexing.

---

### User Story 2 - Find the Engagement page by searching either "engagement" or "pre-wedding" (Priority: P1)

Clients use "engagement" and "pre-wedding" interchangeably, and both searches have to reach the same page. The Engagement landing page is written for both names: a client searching "pre-wedding photographer London Ontario" and a client searching "engagement photographer London Ontario" each land on a page whose heading, introduction, questions, title, description and structured data speak in the words they used. There is exactly one such page, so the two searches never compete with each other.

An editor can record an alternate name for any service in the Studio, so the same approach works for another service later without a code change.

**Why this priority**: Without this the studio would either miss half of the engagement searches or publish two near-identical pages that undercut each other. It is the only service in the launch set with a second name, and the brief singles it out.

**Independent Test**: With the Engagement page live and "Pre-wedding" recorded as its alternate name, read the page and its metadata and structured data, and confirm both names appear naturally in each of the six places the brief lists; confirm no second page exists for either name.

**Acceptance Scenarios**:

1. **Given** the Engagement page is live with "Pre-wedding" as its alternate name, **When** a visitor reads the page, **Then** the heading, the introduction and at least one question-and-answer use both "engagement" and "pre-wedding".
2. **Given** the same page, **When** its title and description are read, **Then** each uses both names.
3. **Given** the same page, **When** its structured data is read, **Then** the service description names "pre-wedding" as the service's alternate name, and the page's questions and answers use both names.
4. **Given** an editor records an alternate name on a different service's landing page, **When** the change takes effect, **Then** that page's heading and structured data carry the alternate name too, with no code change.
5. **Given** an editor removes the alternate name from a page, **When** the change takes effect, **Then** the heading and structured data no longer mention it.
6. **Given** the whole site, **When** a visitor or crawler looks for a separate pre-wedding page, **Then** none exists: the Engagement page is the one page for both names.

---

### User Story 3 - Add, hold back, edit and remove a page from the Studio (Priority: P1)

The studio owner manages these pages the same way she manages work projects and services: in the CMS Studio, with no developer. She creates a landing page by choosing a service package and a project category and writing the introduction and questions. She leaves it switched off until she is happy with it — a category with two projects might not be ready — and nothing about it is visible to visitors, the sitemap or search engines. When she switches it on, it goes live. She can later edit it, switch it off again, or delete it, and the live site follows each change.

**Why this priority**: Tied for first with Story 1. The pages only close the search gap if new ones can be produced, and held back, without code changes; the hold-back switch is what lets the studio launch with strong pages first and add the thinner ones when there is material.

**Independent Test**: In the Studio, create a landing page and try to publish it with a required field empty (the Studio blocks it), complete it with the switch off and confirm nothing is exposed, switch it on and confirm it is live and listed, edit it and confirm the change, then switch it off and confirm it disappears everywhere.

**Acceptance Scenarios**:

1. **Given** an editor is in the Studio, **When** they create a service landing page, **Then** they can choose a service package, name the service for the heading, enter the project category it shows, set a slug, record an alternate name (optional), write the introduction, write content sections as heading-and-text pairs, write frequently asked questions as question-and-answer pairs, write the search title and search description, and turn the published switch on or off.
2. **Given** a new landing page, **When** it is created, **Then** its published switch is off until the editor turns it on.
3. **Given** a landing page is missing any required field, **When** the editor tries to publish it in the Studio, **Then** the Studio prevents it and identifies the field that needs attention.
4. **Given** a complete landing page with its switch off, **When** it is published in the Studio, **Then** its URL returns not-found, it is absent from the sitemap, it is not linked from the services page or from any project, and it contributes no structured data anywhere.
5. **Given** a complete landing page, **When** the editor turns the switch on, **Then** within the same window existing content changes take effect in, the page is live at its URL, listed in the sitemap, linked from the services page and from the matching projects, with no deploy.
6. **Given** a live landing page, **When** the editor edits it, **Then** the live page reflects the change within that same window.
7. **Given** a live landing page, **When** the editor turns the switch off or deletes the page, **Then** its URL returns not-found and it disappears from the sitemap and from every link to it, within that same window.
8. **Given** a landing page already exists for a service package or for a project category, **When** an editor tries to create a second page for the same package or the same category, **Then** the Studio prevents it, so no two pages compete for one service.
9. **Given** a landing page whose introduction, sections, questions or total editorial text fall below the minimums (FR-039), **When** the editor tries to publish it, **Then** the Studio prevents publishing and names each part that is too short and by how much, so a thin page cannot be published by accident.
10. **Given** a landing page with fewer than three content sections, **When** the editor tries to publish it, **Then** the Studio prevents it and says how many sections are needed.

---

### User Story 4 - Reach every landing page from within the site (Priority: P2)

A visitor on the services page sees, against each package that has a live landing page, a way through to it. A visitor viewing a project sees a way to the landing page for that project's kind of session. Search engines crawling the site follow the same links, so no landing page is an orphan reachable only by typing its URL.

**Why this priority**: Internal links and the sitemap help search engines find and weigh the pages, and give existing visitors a path to them. The pages already deliver value from a direct search hit without them (Story 1), so this ranks below the pages themselves.

**Independent Test**: With two pages live and one switched off, open the services page and a project in each of the three categories (live, switched-off, and one with no page at all) and confirm links appear only for the live ones; fetch the sitemap and confirm only the live pages are listed.

**Acceptance Scenarios**:

1. **Given** a package whose landing page is live, **When** a visitor views the services page, **Then** that package offers a link to its landing page; a package with no live landing page offers none, and the page otherwise looks and behaves as before.
2. **Given** a project whose category matches a live landing page, **When** a visitor views that project's page, **Then** it offers a link to that landing page.
3. **Given** a project whose category matches no live landing page — none exists, or it is switched off — **When** a visitor views that project, **Then** no link appears and nothing errors.
4. **Given** a crawler requests the sitemap, **When** it is generated, **Then** it lists every live landing page, and no switched-off, deleted or draft one.
5. **Given** the landing page links to its projects and its projects link back, **When** a visitor follows either, **Then** each lands on the right page, so the pair are mutually reachable.

---

### Edge Cases

- **The category has no published projects.** The page is still valid and still live. The introduction, content sections, package and questions carry it, and the projects section is left out entirely rather than showing an empty frame or placeholder text. This is a normal content state, not an error — the same way an empty work gallery is not an error today.
- **The package is missing, unpublished or deleted after a page was switched on.** The page raises an explicit content error naming the landing page and the package. It does not fall back to blank or invented package details.
- **The package has no starting price.** The page raises a content error naming the package; a landing page promises a starting price and does not render without one.
- **Two landing pages point at the same package or the same category.** The Studio refuses to publish the second one (Story 3, scenario 8).
- **The category an editor typed matches no work project.** The Studio advises the editor, without blocking: a page with no projects is valid, but a typo such as "Portait" would silently produce one. Category matching ignores letter case and extra spacing, so "portrait", "Portrait" and "Portrait " match the same projects.
- **A project's category has no landing page at all** (for example a project filed under a category that was never given one). The project page shows no link and nothing errors.
- **A slug collides with an existing route** (`/work`, `/service`, `/about`, `/contact`, `/journal`, the Studio, the API) **or with another landing page.** The Studio refuses it. Landing pages sit at the top level of the site, so a collision would otherwise shadow a real page.
- **An editor changes a live page's slug.** The page moves to the new URL and the old one returns not-found. No redirect is created; the Studio warns that changing a published page's slug breaks existing links.
- **A visitor or crawler asks for `/pre-wedding-photographer-london-ontario`.** Not found. The Engagement page is deliberately the only page for both names (see Assumptions); no alias URL is created.
- **The alternate name is blank or only whitespace.** It is treated as not set.
- **The search title or description is long.** The Studio advises the editor when the title exceeds 60 characters or the description exceeds 160, without blocking — these are guidance for how search results truncate, not content rules.
- **A page has many questions or sections.** All are shown, in the editor's order, and every question is in the structured data; the page does not truncate or paginate them.
- **A section or answer is long enough by word count but is padding.** The minimums (FR-039) are a floor against an obviously thin page, not a measure of quality. Quality rests on the content brief and the owner's approval (FR-041), and the Studio does not try to judge it.
- **Words are counted generously and strictly at once.** Spacing, line breaks and stray punctuation (a lone dash or ampersand) do not count as words; a field containing only whitespace has zero words. A field exactly at its minimum passes; one word under fails.
- **Content reaches the dataset without passing through the Studio** (for example a bulk import of the launch pages). The Studio's publish-time blocking does not apply to it. The launch content is therefore checked against the same minimums, with the same counting rules, before it is delivered (see Assumptions).
- **The page text contradicts the package** (a price or an inclusion in a paragraph that differs from the package block). No automated check can detect this. It is caught by the content brief and the owner's approval before the page is switched on (FR-040, FR-041).
- **The studio's location in site settings changes.** Every landing page's heading follows it; no page repeats the city as separate copy that could drift.
- **A visitor has a reduced-motion preference.** Any entrance animation on a landing page does not run, and all content is fully visible.
- **Some data on a live page is malformed despite Studio validation** (for example after a content-model change). The page raises a content error identifying the document and field rather than rendering a partial page.
- **The home page, the work page filter and the primary navigation.** None change. A landing page is not added to the navigation, the work filter keeps running in the browser as it does today, and no home page copy is touched.

## Requirements _(mandatory)_

### Functional Requirements

**Content model & publishing**

- **FR-001**: The CMS Studio MUST provide a Service Landing Page content type with these fields: service package (required, chosen from the existing packages), project category (required), slug (required), alternate name (optional), introduction (required), frequently asked questions (required — at least one, each a required question and a required answer), search title (required), search description (required), and a published switch.
- **FR-002**: The published switch MUST default to off. A landing page is **live** only when it is published in the Studio AND its switch is on. A page that is not live MUST NOT appear at its URL, in the sitemap, in any structured data, or as a link from any other page.
- **FR-003**: The Studio MUST NOT allow two landing pages to point at the same service package, nor two to use the same project category (compared ignoring letter case and spacing).
- **FR-004**: The slug is editor-controlled and forms the page's URL as `/<slug>`. The Studio MUST offer a starting value built from the service name in the pattern `<service>-photographer-london-ontario`, MUST restrict slugs to lower-case letters, digits and hyphens, MUST keep slugs unique across landing pages, and MUST refuse a slug that matches an existing top-level route of the site.
- **FR-005**: The Studio MUST prevent publishing a landing page with any required field empty, and MUST indicate which field needs attention.
- **FR-006**: The Studio MUST advise, without blocking, when the search title exceeds 60 characters, when the search description exceeds 160, when the category matches no work project, and when a published page's slug is changed.
- **FR-007**: The Studio MUST let an editor record an alternate name on any landing page; it is optional, and a blank or whitespace-only value is treated as not set.
- **FR-008**: The CMS Studio MUST provide shared Service Landing Page settings holding the copy that frames every landing page — the section headings for the projects, the package and the questions, the label of the package's booking button, and the contact call-to-action's heading, text and link label. None of this copy may be written into the site's code, and each item is required.
- **FR-009**: Creating, editing, switching on, switching off or deleting a landing page MUST take effect on the live site through the same content-update mechanism as all existing content — within seconds of a publish notification, and at most one hour later if a notification is missed — with no deploy, **including a page at a slug that did not exist before**.

**Landing page**

- **FR-010**: Each live landing page MUST be served at `/<slug>`, for example `/engagement-photographer-london-ontario`.
- **FR-011**: The page MUST present a single top-level heading that names the service and the studio's city. The city MUST come from the studio location in site settings, not from separate copy on the page. When an alternate name is set, the heading MUST name it as well, so the Engagement page's heading reads for both "engagement" and "pre-wedding".
- **FR-012**: The page MUST show the editor's introduction directly beneath the heading, ahead of every other section.
- **FR-013**: The page MUST show the alternate name, when one is set, to visitors on the page itself — not only in structured data — so the structured data describes what the visitor can see.
- **FR-014**: The page MUST show every published work project whose category matches the page's category, matching ignoring letter case and spacing. Each project MUST show its image and title and link to the project's own page, in the same order the work gallery uses.
- **FR-015**: When no published project matches, the projects section MUST be left out entirely. The page MUST NOT render an empty frame, a "no projects" message of the site's own invention, or placeholder content, and MUST NOT raise an error.
- **FR-016**: The page MUST show the matching service package with its title, description, included features, starting price in the site's currency, image with alt text, and booking link, drawing on the same package content the services page uses so the two never disagree.
- **FR-017**: The page MUST show every question and answer the editor wrote, in the order written, in a form a keyboard and a screen reader can operate. If answers are collapsible, the open or closed state MUST be exposed to assistive technology, and the full text of every answer MUST remain available to search engines and assistive technology whether or not it is open.
- **FR-018**: The page MUST end with a call to action, worded from the shared settings (FR-008), that gives a visitor a single-activation route to the contact page. The package's own booking link (FR-016) is separate and does not replace it.
- **FR-019**: A request for a slug that matches no live landing page — unknown, switched off, unpublished, or deleted — MUST produce a not-found outcome, and that response MUST NOT be offered for indexing.
- **FR-020**: The page MUST render inside the site's standard page shell — header, footer, skip-to-content link, page transition and route-change focus handling — with no exceptions.

**Search metadata, structured data & sitemap**

- **FR-021**: Each live landing page MUST expose a distinct title, description, canonical URL and social preview. The title and description are the editor's search title and search description; the canonical URL is the page's own `/<slug>`; the preview image is the matching service package's image. No other page on the site may share the title, description or canonical URL, and no other landing page may share the preview image. The services page already previews with the lead package's image and is otherwise unchanged (FR-027), so the one landing page for that package shares that single image with it; nothing else is shared.
- **FR-022**: Each live landing page MUST embed structured data describing the service: its name, its alternate name when one is set, a description, the starting price and currency, the studio's city as the area served, and the studio as the provider — referencing the studio identity the page shell already declares, never restating it.
- **FR-023**: Each live landing page MUST embed structured data for its questions and answers, containing exactly the questions and answers shown on the page.
- **FR-024**: Each live landing page MUST embed a breadcrumb trail Home › Services › the page's name, consistent with the trail every other sub-page carries.
- **FR-025**: Structured data MUST describe only what the visitor can see on the page: the price, names, questions and answers it states match the page's visible content, and a page that is not live contributes none.
- **FR-026**: The sitemap MUST list every live landing page, each with its service package image and a last-modified time reflecting when the page was last changed, and MUST NOT list any page that is not live.

**Internal linking**

- **FR-027**: On the services page, each service package with a live landing page MUST link to it; a package without one MUST NOT. The services page's copy, layout and behaviour are otherwise unchanged.
- **FR-028**: On a project's own page, a project whose category matches a live landing page MUST link to that page. A project whose category matches none MUST show no link and MUST NOT error.
- **FR-029**: The text of an internal link to a landing page MUST describe its destination, using the landing page's own heading wording, so a link never reads only "click here" or "learn more".
- **FR-030**: Landing pages MUST NOT be added to the primary navigation, the work page filter MUST be unchanged, and no home page copy may change.

**Content errors, accessibility & performance**

- **FR-031**: When a live landing page, or the shared Service Landing Page settings, reaches the site missing a required field — including a missing, unpublished or priceless service package — the page depending on it MUST raise an explicit content error identifying the document and the field, consistent with every other content type on the site. It MUST NOT render a placeholder, substitute default copy, or silently omit the missing piece.
- **FR-032**: Every image on a landing page MUST render with its editor-provided alt text.
- **FR-033**: Any entrance animation on a landing page MUST be skipped under a reduced-motion preference, with all content fully visible.
- **FR-034**: Only images in or near the initial viewport MUST load immediately; the rest MUST defer until the visitor scrolls near them.
- **FR-035**: The page's heading outline MUST be valid: one top-level heading, with every section heading beneath it. Interactive elements MUST have correct semantics, labels and keyboard operation under the site's accessibility lint rules.
- **FR-036**: Landing pages MUST be built from the site's design tokens and shared component library — no new colour, type size or spacing literals, and no local copy of a component the library already provides.

**Test coverage**

- **FR-037**: Before this feature ships it MUST have automated coverage for: a live page rendering every section; a held-back page being absent from its URL, the sitemap, the services page, project pages and structured data; the Engagement page carrying both names in its heading, introduction, questions, metadata and structured data; content errors for each required field and for a missing package; slug and category uniqueness and route-collision refusal in the Studio; category matching ignoring case and spacing; the thin-category and empty-category states; and the structured data's agreement with the visible page. At least one real-browser journey MUST cover reaching a landing page from the services page and from a project, and reaching the contact page from it.

**Content quality** _(added 2026-10-07)_

- **FR-038**: A landing page has editorial content sections in addition to its introduction and its frequently asked questions. Each section is an editor-written heading plus body text, shown in the editor's order beneath the introduction. A page requires at least 3 sections, so its content is not limited to an introduction and some questions. The sections give each service room for what is specific to it — for example what a session involves, where in London it is shot, how to prepare, what happens after the shoot. The Studio does not prescribe which topics; the editor chooses them.
- **FR-039**: The Studio MUST block publishing, naming the field and how far short it falls, unless: the introduction has at least 50 words; at least 3 sections each have a body of at least 60 words; at least 5 frequently asked questions each have an answer of at least 30 words; and the page's editorial text — introduction, section headings and bodies, questions and answers together — totals at least 400 words. These four numbers are defaults, held in one place so they can be tuned (see Assumptions).
- **FR-040**: Landing page copy MUST NOT state a price, turnaround time, deposit, cancellation rule or inclusion that is not either held in the CMS (the package's own price and features) or supplied by the owner. The package block (FR-016) stays the single source for price and inclusions; prose and answers MUST NOT contradict it. Nothing about the studio may be invented.
- **FR-041**: A per-service content brief is part of the deliverable: a short checklist of the topics a client of that service wants answered, the London-specific detail to include, and the facts the owner must confirm. A page is not switched on until the owner has approved it against its brief.
- **FR-042**: The package block MUST NOT be the bulk of a landing page. The editor's own text (introduction, sections, questions and answers) MUST be the larger share of the page's words, so the page is not mostly a repeat of the services page.
- **FR-043**: The service name used in the heading is its own required field on the landing page (for example "Engagement"), separate from the service package's title, which is written for the services page and may not read as a search term. The words around it in the heading (for example "Photographer in <city>") are held as a single pattern in the shared Service Landing Page settings, so neither the service name nor the surrounding words is written into the site's code. The Studio MUST refuse a pattern that does not place both the service name and the city.

### Key Entities

- **Service Landing Page**: One page per service package, tied to exactly one service package and one project category. Holds a service name for the heading, a slug, an optional alternate name, an introduction, an ordered set of content sections, an ordered set of frequently asked questions, a search title, a search description, a published switch, and a last-changed time kept by the CMS. Visible on the public site only while live (FR-002).
- **Content Section**: An editor-written heading and body text belonging to one landing page, kept in the editor's order. The editor chooses the topic; at least three are required (FR-038).
- **Frequently Asked Question**: A question and its answer, written by the editor, belonging to one landing page and kept in the editor's order.
- **Alternate Name**: A second name under which clients search for the same service ("Pre-wedding" for Engagement). It is not a page of its own and has no URL of its own.
- **Service Landing Page Settings**: A single settings document holding the heading pattern, the section headings, the package booking button's label and the contact call-to-action copy shared by every landing page.
- **Content Brief**: For each service, the checklist an owner approves a page against: topics to answer, London-specific detail to include, and facts the owner must confirm (FR-041). A deliverable of this feature; it is not content on the public site.
- **Service Package** _(existing)_: The bookable offering — title, description, features, starting price, image, booking link — that a landing page presents. The services page and the landing page draw on the same package content.
- **Work Project** _(existing)_: A published project whose free-text category decides whether it appears on a landing page, and whether its own page links to one.
- **Business Identity** _(existing)_: The studio's structured-data identity the page shell already declares; landing page structured data refers to it as provider.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The studio owner can take a finished landing page from the Studio to live within 1 minute of switching it on, with zero code changes and zero deploys — sustained across every page added after launch, including pages at slugs that never existed before.
- **SC-002**: 100% of pages that are switched off, unpublished or deleted are unreachable at their URL, absent from the sitemap, absent from the services page and project pages, and absent from structured data, once the change has taken effect; 100% of live pages are present in each of those places.
- **SC-003**: Each of the four launch pages (Portrait, Engagement, Family, Graduation) can be live with its own distinct title, description, canonical URL and preview image — 0 of the four share a title, description or canonical URL with any other page on the site, or a preview image with another landing page. The one exception, by design, is the lead package's page, which shares its preview image with the services page.
- **SC-004**: The Engagement page uses both "engagement" and "pre-wedding" in 6 of 6 places: heading, introduction, at least one question and answer, title, description and structured data. Exactly 1 page exists for the two names.
- **SC-005**: A landing page whose category holds 2 projects, and one whose category holds 0, both render every remaining section completely with no broken layout, empty frame or placeholder — in 100% of cases.
- **SC-006**: 0 landing pages are orphans: every live page is linked from the services page, and from every project in its category.
- **SC-007**: From anywhere on a landing page, a visitor reaches the contact page in 1 activation.
- **SC-008**: 100% of landing pages pass structured-data validation for their service, question-and-answer and breadcrumb types with zero errors, and what they state matches the visible page.
- **SC-009**: 0 landing pages ever render placeholder or default content; every test case of a live page or the shared settings missing a required field produces an explicit content error.
- **SC-010**: A keyboard or screen-reader visitor can reach and read every section and operate every question, with every image announced by its alt text — 0 accessibility violations of the kind the site's existing checks detect.
- **SC-011**: Within three months of the pages going live, the site's search analytics show impressions for local queries of the form "<service> photographer London Ontario" for each live service, and for both "engagement" and "pre-wedding" on the Engagement page. (A business outcome to track after launch, not a release gate, since ranking depends on the search engine.)
- **SC-012**: 100% of live pages met the FR-039 minimums when they were published: introduction, three sections, five questions and the page total. The launch content for all four pages is verified against the same minimums, counted the same way, before it is delivered.
- **SC-013**: Each launch page is approved by the owner against its content brief before its published switch is turned on; 0 launch pages are switched on without that approval.

## Assumptions

- **"Both names resolve to the one Engagement page" is read as one page serving both searches, not as a redirect.** No `/pre-wedding-photographer-london-ontario` URL exists. If a redirect from such a URL is wanted later, it is a separate decision: redirect management is out of scope here, the same as for the journal, and an alias that nothing links to earns little. This is the reading most worth confirming.
- **The category is matched, not chosen from a fixed list.** Work project categories are free text today and the work gallery derives its filters from whatever values exist (spec 002). The landing page records a category as text and matches projects ignoring case and spacing, rather than constraining the work categories, which stays out of scope. The Studio's advisory warning (FR-006) is what catches a typo.
- **The preview image is the package's image, not a new field.** Each package already has its own image with alt text, so every landing page gets a distinct social preview without asking the editor for another upload, and the services page and landing page cannot show different pictures for the same service. A per-page override is out of scope. The services page already previews with the lead package's image and FR-027 leaves it otherwise unchanged, so the landing page for that package shares that one image with the services page; the alternative, changing the services page's preview, was rejected as an unrelated change to a page this feature promises not to alter.
- **Search title and search description are required, not optional overrides.** The journal derives them with an override; here they are the whole point of the page, and the Engagement page must use both names in them, so the editor writes them explicitly rather than inheriting a truncated introduction.
- **The structured-data breadcrumb is Home › Services › the page.** Landing pages are linked from the services page, so that is where they sit in the site's hierarchy, and it matches the trail the other sub-pages carry (spec 008, FR-005a).
- **FAQ structured data is included as asked, but rich-result display is not promised.** Search engines have limited the visible FAQ result to a small set of site types, so validation without errors and agreement with the visible page are the measurable bar (SC-008); whether a particular result is decorated is up to the search engine.
- **The studio is the only author.** No per-page author is recorded, and structured data names the studio as provider.
- **The project overlay is not required to carry the link.** A project opened as an overlay from the work gallery is a client-side presentation only; crawlers and direct visits always receive the standalone project page (spec 008). The link is required there, not in the overlay.
- **The studio's city comes from site settings.** The heading and the area served follow that one value. The URL pattern's `london-ontario` is part of the editor-controlled slug and is not derived from it, so changing the city later does not move any URL.
- **Launch content is written by Claude, and approved by the owner.** The launch content for all four pages is written by Claude (the AI assistant), not by the owner, using only facts already in the CMS and this spec; every other fact is marked for the owner to confirm or supply, and nothing is invented. The pages arrive switched off, and the owner approves each against its content brief (FR-041) before switching it on. Family and Graduation have only 2 projects each today, so their pages depend on this editorial content to stand alone.
- **Claude is responsible for the launch pages being distinct from one another.** Before delivery it checks the four pages against each other and against the services page for repeated sentences, repeated question answers, and repeated search titles and descriptions, and reports the result. The Studio does NOT enforce cross-page uniqueness, and later edits by the editor are not checked for it; this is an accepted trade-off, not an oversight.
- **The quality numbers are tunable defaults.** The minimums in FR-039 (50 words, 3 sections of 60, 5 answers of 30, 400 in total) and the 3-section and 5-question counts are starting values chosen to rule out an obviously thin page, not research-backed targets. They live in one place and can be tuned without touching the rules that use them. They measure length, not quality.
- **The Studio's blocking applies to the Studio only.** Content written into the dataset by another route, such as a bulk import, is not subject to it. That is why the launch content is checked against the same minimums before delivery, and why accuracy (FR-040) rests on the brief and the owner's approval rather than on any check the site could run.
- **A malformed live page fails loudly everywhere it is read.** Consistent with every other content type, a live page missing a required field raises a content error on its own URL, and the sitemap that lists it does not silently skip it. The consequence is that one broken page can fail the sitemap too; the Studio's required-field validation (FR-005) is what keeps that from happening in practice. This is the same trade the journal makes, and is recorded here so planning weighs it rather than discovers it.
- **Pages share content, not copy.** The package's description, features and price appear on both the services page and the landing page by design. What is unique to a landing page — the introduction and the questions — is where its distinct search value comes from.
- **Critical-flow coverage applies.** Landing page content-error handling is part of the site's "content error handling" critical flow and needs the same automated coverage as the existing content types before it ships.
- **Visual design follows the existing design system.** There is no dedicated design for these pages yet; they compose the site's tokens and shared components. If a design is produced before implementation, it takes precedence.
- **Image delivery stays within the current budget.** Landing pages use the site's existing image sizes and quality settings; no new ones are introduced.
- **Downstream spec updates.** When implemented, this feature changes behaviour documented in retrospective specs, which should be updated in the same change: `002-work-gallery` (the project page's new link), `004-services-page` (the per-package link), `007-cms-studio-content-sync` (the new content types) and `008-seo-metadata` (new public pages, sitemap entries and structured data types).
- **Out of scope** (from the brief): a standalone pre-wedding page, wedding-day pages (the CMS has no wedding projects or package), neighbourhood or other-city pages, changes to the work page filter, and any change to the home page copy or the primary navigation.
