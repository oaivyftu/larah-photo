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
| `npm test`             | Vitest unit + mock tests, one pass                    |
| `npm run test:watch`   | the same suite, watching                              |
| `npm run typecheck`    | `tsc --noEmit` against `tsconfig.typecheck.json`      |
| `npm run lint`         | ESLint, including the full `jsx-a11y` recommended set |
| `npm run format`       | rewrites the tree with Prettier                       |
| `npm run format:check` | reports formatting without rewriting                  |

**On `git commit`** — Prettier and ESLint `--fix` run over the staged files, then
the project type-checks and the test suite runs. Formatting is applied for you
and re-staged into the commit rather than bounced back, so a commit never fails
just because of layout. Lint warnings _do_ fail: the gate runs with
`--max-warnings=0`.

**On `git push`** — the same checks again over the whole project, plus
`next build`. The build step is what catches breakage that only surfaces at
prerender time, which type-checking and unit tests cannot see.

Each step prints its own name, so a failure tells you which one to fix.

Browser end-to-end tests are deliberately not in either hook: they need a booted
app, and a broken build already fails the push without starting a browser. The
async Server Components under `src/app/` are the coverage gap that leaves — see
`specs/009-testing-quality-gates/research.md`.

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
