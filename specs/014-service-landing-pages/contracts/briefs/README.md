# Content Briefs

**Feature**: 014-service-landing-pages | **Spec**: FR-040, FR-041, SC-013

One brief per launch service: [Portrait](./portrait.md),
[Engagement](./engagement.md), [Family](./family.md),
[Graduation](./graduation.md). A brief is the checklist the owner approves a page
against before she switches it on. It is not content on the site.

## How a page gets from draft to live

1. The pages are written by Claude and imported switched **off** and **not
   approved** (research §10). Everything the page says about the studio comes
   from the CMS or from this repository's spec; everything else is a gap.
2. Each gap is marked in the text as `[[CONFIRM: what the owner must supply]]`.
   The brief for that service lists every one the draft carries.
3. In the Studio the owner opens the page and, for each marker, writes the real
   detail in its place. A page that still contains a marker **cannot be switched
   on** (the Studio refuses), and a live page that contains one **raises a content
   error** rather than showing it.
4. She reads the page against the brief's checklist. When every line is true of
   her studio she ticks **Approved against the brief**. The switch will not turn
   on without it.
5. She turns **Published** on and publishes. Nothing else is needed; no deploy.

## The rules every brief shares

- **Nothing is invented.** Do not state a price, session length, number of
  photographs, delivery time, deposit, cancellation or rain policy, travel fee,
  usage right, or a place the studio works at, unless it is in the CMS or the
  owner has supplied it. The package block on the page already carries the real
  price and inclusions; the text must not contradict it.
- **Places are candidates, not claims.** Each brief lists public places in
  London, Ontario a writer might mention. They are real places; whether the
  studio shoots there is the owner's to confirm. A candidate she does not use is
  deleted from the copy, not left in.
- **No page repeats another.** The four pages are checked against each other and
  against the services page before they are delivered (research §10); the check's
  result is in the pull request. After launch, nothing checks this — an editor
  who copies a paragraph between pages weakens both.
- **The text is the page's own.** The package block and the projects carry the
  price and the photographs. The introduction, the sections and the answers say
  what a client of _this_ service cannot learn from the services page.
- **Length is a floor, not a goal.** The Studio refuses a page under 50 words of
  introduction, three 60-word sections, five 30-word answers and 400 words in
  total. A page that is only just over is probably still thin; the brief's topic
  list is what makes it useful.

## What the owner is _not_ being asked to do

Write the pages. They are drafted. The owner supplies facts, deletes what is not
true of her studio, and decides whether the page is ready.
