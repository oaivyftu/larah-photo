# Service landing pages: launch content

The first four service landing pages and their shared settings, written for
spec 014 (`specs/014-service-landing-pages/`). This folder is **imported once**.
After that the Studio is the source of truth, and nothing here is edited.

| File              | Sanity document                 | State on import               |
| ----------------- | ------------------------------- | ----------------------------- |
| `settings.json`   | `serviceLandingSettings`        | the wording every page shares |
| `portrait.json`   | `serviceLandingPage.portrait`   | held back, not approved       |
| `engagement.json` | `serviceLandingPage.engagement` | held back, not approved       |
| `family.json`     | `serviceLandingPage.family`     | held back, not approved       |
| `graduation.json` | `serviceLandingPage.graduation` | held back, not approved       |

`settings.json` is published first (task T024): without it a live page raises a
content error, and so does the services page and every project page once any
page is live.

## What a `[[CONFIRM: …]]` is

A gap. The pages state nothing about the studio that is not in the CMS or the
spec, so every other fact (session length, delivery time, places, weather and
deposit terms, usage rights) is written as `[[CONFIRM: what to supply]]` inside
the sentence that needs it. **A page that still holds one cannot be switched on**
(the Studio refuses), and a live page that holds one raises a content error
rather than showing it. Places are candidates, not claims: the owner keeps the
ones the studio really uses and deletes the rest. The checklist she approves
against is `specs/014-service-landing-pages/contracts/briefs/`.

## Import

Needs a Sanity login that can write to the dataset (`npx sanity login`). Nothing
in the repository stores a token.

The importer reads one JSON document per line, so this joins the files into that
stream. `--missing` skips any id that already exists, so re-running it **never
overwrites** an edit made in the Studio; it only creates what is absent.

```bash
node -e 'for (const f of process.argv.slice(1)) console.log(JSON.stringify(require(require("path").resolve(f))))' content/service-landing-pages/*.json | npx sanity dataset import - production --missing
```

To publish the settings alone first, pass only that file:

```bash
node -e 'for (const f of process.argv.slice(1)) console.log(JSON.stringify(require(require("path").resolve(f))))' content/service-landing-pages/settings.json | npx sanity dataset import - production --missing
```

If the installed CLI will not read standard input, write the stream to a
temporary `.ndjson` file and pass that path instead; the files here do not change.

After the import, open the Studio: four pages, all **Held back**, and each
address answers `404` until the owner switches it on.

## Checks

`npm test` reads these files (`src/utils/landingLaunchContent.test.ts`). Because
an import skips Studio validation, that test is the only thing between a thin
page and the live site: every page must meet the quality minimums, arrive held
back and unapproved, point at a package, and the Engagement page must use both
"engagement" and "pre-wedding" in its heading, introduction, a question and
answer, search title, search description and alternate name.

The four pages were also checked against each other and against the services
page's package copy (exact repeats, shared eight-word runs, near-identical
answers, titles and descriptions). That check was a drafting step, not shipped
tooling; its result is in the pull request.
