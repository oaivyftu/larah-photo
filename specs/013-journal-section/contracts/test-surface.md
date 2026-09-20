# Contract: Journal Test Surface

**Feature**: 013-journal-section | **Date**: 2026-09-15

Extends [012's test-surface contract](../../012-browser-e2e-tests/contracts/test-surface.md),
which still governs: roles and accessible names first, `data-*` identity
attributes second, never a CSS-module class name, never text copy, never
`nth-child`.

---

## Identity hooks this feature adds

| Attribute              | On                                  | Means                       |
| ---------------------- | ----------------------------------- | --------------------------- |
| `data-journal-list`    | the listing's post container        | "this is the list of posts" |
| `data-journal-card`    | each listing entry                  | "this is one post's card"   |
| `data-journal-empty`   | the empty-state region              | "no posts are live"         |
| `data-journal-article` | the post page's article element     | "this is the post body"     |
| `data-journal-cta`     | the end-of-post call to action      | "this is the onward path"   |
| `data-journal-embed`   | each embed figure (value: provider) | "this is an embed, from X"  |

No state mirrors: nothing here encodes scheduled-ness, an index, or a count.
Whether a post is live is observable from whether it is on the page.

## The dataset precondition

Journal journeys need a live post, and the dataset will have none on day one.
`.husky/pre-push` runs the suite, so a hard failure on an empty journal blocks
pushes for a content reason — the exact failure mode 012 wrote
`e2e/support/content.ts` to avoid.

So the journeys discover their fixture, in `e2e/support/content.ts`:

```text
openJournalIndex(page)
  → returns { cards, empty }  — whichever is present

firstJournalPost(page)
  → the first card's href, or null when the journal is empty
```

- With at least one live post: the journeys run.
- With none: the empty-state journey asserts `data-journal-empty` is visible,
  and the post-specific journeys `test.skip` with a message saying to publish a
  post in Sanity. A skip is honest here; a failure would not be.

No journey hardcodes a slug, a title, a date or a count.

## Journeys (`e2e/journal.spec.ts`)

Run under `underBothMotionPreferences`, like every other spec:

| Journey                           | Asserts                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| listing → post                    | a card's link opens that post; the article is visible                  |
| the onward path                   | from the post, the call-to-action reaches `/contact` in one activation |
| the section is marked current     | `aria-current="page"` on the Journal nav item, on listing and on post  |
| the empty journal (dataset-gated) | the empty state renders, and nothing throws                            |

The page transition and focus handling are already covered by
`e2e/navigation.spec.ts` and are not re-tested here — journal pages use the same
shell, and duplicating those assertions would buy a slower suite and no signal.
