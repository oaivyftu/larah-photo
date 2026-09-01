This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## CMS / Backend

This project uses Sanity as the CMS because it gives editors a hosted admin UI,
image uploads, asset management, and a simple Content Lake API without running a
custom database server.

Managed content:

- Site settings: Instagram URL, email, phone, location, footer statement
- Home page: hero text/images, manifesto copy/images, section headings, closing image
- Work projects: slug, category, metadata, card image, hero image, gallery images
- Service packages: package title, description, features, price, CTA
- About page: title, portraits, notes, story paragraphs
- Contact page: title and supporting copy

Create or connect a Sanity project:

```bash
npx sanity@latest init
```

Use `/studio` as the Studio route when prompted. Then copy `.env.example` to
`.env.local` and fill in:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-07-01
```

Run the site and open the Studio:

```bash
npm run dev
```

- Website: [http://localhost:3000](http://localhost:3000)
- CMS admin: [http://localhost:3000/studio](http://localhost:3000/studio)

Sanity is the required content source for page copy, navigation, site settings,
services, and work projects. The website reports a configuration or content
error when required Sanity data is unavailable.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Quality gates

`npm install` also installs the Git hooks — there is no separate setup step.

| Command                | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm test`             | Vitest unit + integration tests, one pass             |
| `npm run test:watch`   | the same suite, watching                              |
| `npm run test:e2e`     | Playwright browser journeys — see below, runs on push |
| `npm run typecheck`    | `tsc --noEmit` against `tsconfig.typecheck.json`      |
| `npm run lint`         | ESLint, including the full `jsx-a11y` recommended set |
| `npm run format`       | rewrites the tree with Prettier                       |
| `npm run format:check` | reports formatting without rewriting                  |

**On `git commit`** — Prettier and ESLint `--fix` run over the staged files, then
the project type-checks and the design-system audit runs. Formatting is applied
for you and re-staged into the commit rather than bounced back, so a commit never
fails just because of layout. Lint warnings _do_ fail: the gate runs with
`--max-warnings=0`.

**On `git push`** — the same checks again over the whole project, plus `npm test`,
`next build`, and the Playwright browser suite. All three run here and only
here: they're the slowest checks of the set, and once per push is enough to
keep a failing test, a broken build, or a broken journey off a shared branch.
The build step catches breakage that only surfaces at prerender time, which
type-checking and unit tests cannot see; the browser suite catches breakage
that only surfaces in an actual browser, which the build cannot see either.

Each step prints its own name, so a failure tells you which one to fix.

## Browser end-to-end tests

```bash
npm run test:e2e
```

Nine visitor journeys through a real browser, each run under both motion
preferences: paging a project's photographs by control and by keyboard,
dismissing a full-screen photograph without losing the project preview behind
it, following a link and landing the keyboard in the new page's content. They
exercise the real GSAP and Flickity, which is the point — in a headless DOM
those libraries do nothing, so a test there can pass while the gallery is
broken.

**This runs automatically on `git push`, not on `git commit`.** It needs a
booted app and about a minute; this project has no CI, so that cost is paid
entirely by whoever is pushing — accepted because the suite has caught real
regressions a green build and a green unit pass both missed. Run it yourself
too, any time, while you're changing the gallery, the page transition, the
pointer follower or a route's entry animation — catching it before you push is
still better than catching it at push. The full statement of where it runs and
why, with the reasoning for keeping it out of `pre-commit`, is
[`specs/012-browser-e2e-tests/contracts/run-location.md`](specs/012-browser-e2e-tests/contracts/run-location.md).

Both hooks type-check and lint `e2e/` regardless, so a spec file that does not
compile cannot be committed even though only `pre-push` executes it.

`npm install` fetches Chromium once, roughly 150 MB. Skip it with
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install` if you will not run the suite.
A production install (`npm ci --omit=dev`) skips it on its own — the step checks
whether Playwright is actually installed before reaching for it, because npm runs
lifecycle scripts even when it has not installed the dev dependency they need.
The journeys need content, so `.env.local` must be filled in — without it the
suite refuses to start and names the missing variable.

Two flags worth knowing:

```bash
E2E_FRESH_BUILD=1 npm run test:e2e
```

forces a production build instead of reusing whatever is on port 3000. Use it
whenever the run has to reflect a change you just made — a reused server serves
the old code and the suite will happily pass.

```bash
PORT=3100 npm run test:e2e
```

moves the site off 3000, which matters if you have a dev server up for another
checkout of this repo.

**Bypassing** with `--no-verify` is legitimate when the gate is failing for a
reason unrelated to your change — a mid-refactor WIP commit on a private branch,
or debugging the hooks themselves. It is not a way to land a red build on a
shared branch; the checks it skips are the ones the next person inherits.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
