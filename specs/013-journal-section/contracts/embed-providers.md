# Contract: Embed Providers

**Feature**: 013-journal-section | **Date**: 2026-09-15

Embeds are the only content on a journal page served by someone other than this
site. This file is the allow-list, and the allow-list is the security control —
there is no sandbox behind it (research.md §4). Changing anything here changes
what third parties can run on the site, so it changes with review, not in
passing.

---

## The three allowed providers

| Provider    | Accepted input (what an editor can paste)                                                             | Normalised `src`                              |
| ----------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Google Maps | `https://www.google.com/maps/embed?pb=…` (Share → Embed a map)                                        | unchanged                                     |
| YouTube     | `https://www.youtube.com/watch?v=<id>`, `https://youtu.be/<id>`, `https://www.youtube.com/embed/<id>` | `https://www.youtube-nocookie.com/embed/<id>` |
| Vimeo       | `https://vimeo.com/<id>`, `https://player.vimeo.com/video/<id>`                                       | `https://player.vimeo.com/video/<id>?dnt=1`   |

`<id>`: YouTube `[A-Za-z0-9_-]{11}`, Vimeo `[0-9]+`. Query strings on the input
are discarded except Maps' `pb`, which _is_ the map. `http://` input is accepted
and upgraded to `https://`; anything else about the URL that does not match is a
rejection, not a repair.

**Anything not in this table is refused** — at publish time by the schema, with
a message naming the three providers, and again in the fetcher if it somehow
reaches the site (FR-002b, Principle I).

## Why these exact URLs

- **Maps share-embed, not the Maps Embed API.** `/maps/embed/v1/` needs an API
  key: a secret to provision and rotate, and one the editor cannot obtain
  herself. The share URL needs none.
- **`youtube-nocookie.com` and `dnt=1`, always.** The site has no cookie-consent
  banner and this feature does not add one, so only the providers' no-tracking
  modes are permitted. Normalising rather than trusting the pasted URL is what
  makes that hold: an editor pasting a plain `youtube.com/watch` link still gets
  the private variant.

## Rendering

```text
<figure data-journal-embed="<provider>">      aspect-ratio box, tokens only
  <iframe
    src="<normalised>"
    title="<editor's description>"            required, FR-002c
    loading="lazy"                            FR-002c: not until scrolled near
    referrerpolicy="strict-origin-when-cross-origin"
    allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
    allowfullscreen>
</figure>
```

Rules the renderer must hold to:

1. **No autoplay**, in the URL or the `allow` list (FR-002c).
2. **Space is reserved** by the wrapper's `aspect-ratio`, so a slow embed shifts
   nothing (FR-002c).
3. **A failed, blocked or empty frame is not an error.** The article renders
   around it; nothing throws, nothing collapses (FR-002d). This is the one place
   where "missing content" is _not_ a content error — the content is present and
   valid, the third party simply did not answer.
4. **No `sandbox`.** With `allow-scripts allow-same-origin` — which these
   providers require — it isolates nothing. Saying so here stops it being added
   later as a reflex.

## Adding a provider

Three edits and a test, in this order: the pattern table above, the
normaliser in `src/utils/journalEmbed.ts`, the schema's validation message, then
a unit test per new pattern including one rejection case. A provider without a
no-tracking mode needs a decision about the consent banner first — that is a
site-wide question, not an embed question.
