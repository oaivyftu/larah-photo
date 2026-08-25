<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation
notices.

<!-- END:nextjs-agent-rules -->

# Before you write code

The binding rules live in `.specify/memory/constitution.md`. This file is the
short operational version — where the constitution says _what_, this says _do
this first_.

## 1. Read the spec before touching the feature

Every area of this app has a spec in `specs/`. Find the one covering what you
are about to change and read it:

| Area                             | Spec                                  |
| -------------------------------- | ------------------------------------- |
| Home page                        | `specs/001-home-page/`                |
| Work gallery / project detail    | `specs/002-work-gallery/`             |
| About page                       | `specs/003-about-page/`               |
| Services page                    | `specs/004-services-page/`            |
| Contact page                     | `specs/005-contact-page/`             |
| Header, footer, nav, page shell  | `specs/006-site-navigation-shell/`    |
| Sanity Studio / content sync     | `specs/007-cms-studio-content-sync/`  |
| SEO, metadata, structured data   | `specs/008-seo-metadata/`             |
| Tests and Git hooks              | `specs/009-testing-quality-gates/`    |
| Design system, shared components | `specs/010-design-system-compliance/` |

`specs/001`–`008` are **retrospective**: they describe what already shipped.
They have no `plan.md` or `tasks.md` and should not get one — see
`specs/README.md`. Read them to learn how the feature is meant to behave, and
update the spec when you deliberately change that behaviour.

## 2. Check whether it already exists

Before writing a component, a style block, or a helper, search for it. The
answer is very often yes.

```bash
ls src/components/ui/          # shared component library — check here first
grep -rn "thing-you-need" src/ # then the whole tree
```

- `src/components/ui/` is the design system's component half: `Button`,
  `Input`/`Select`/`Textarea`, `Icon`, `PageHeading`, `GlassPointer`,
  `ShareButton`. Import from there. Do not reimplement one of these inside a
  feature folder.
- Feature folders (`work/`, `layout/`, `navigation/`, `media/`) **compose**
  those primitives.
- Needed in two or more places? It belongs in `src/components/ui/` (or
  `src/styles/` if it is just a value), and every call site imports the shared
  version. A second copy is how this codebase previously grew a broken form
  component that duplicated primitives already sitting unused.
- The library may hold primitives nothing currently renders. That is not dead
  code — do not delete them for being unused.

## 3. Obey the design system

`src/styles/` is the token layer, and it is authoritative:

| File                | Governs                                         |
| ------------------- | ----------------------------------------------- |
| `_tokens.scss`      | colour, font size, line height, spacing, layout |
| `_typography.scss`  | type styles                                     |
| `_breakpoints.scss` | the breakpoint scale and the `$breakpoints` map |
| `_mixins.scss`      | shared style mixins, including media queries    |

In any `*.module.scss`:

- Use the tokens: `var(--color-…)`, `var(--font-size-…)`, `var(--space-…)`,
  plus the `--line-height-*`, `--page-*`, `--container-*`, `--header-*`,
  `--frame-*` and `--divider-*` families. A raw hex or a bare
  `font-size: 14px` is a violation.
- Use the mixins from `_mixins.scss` rather than writing queries by hand:
  `media-max($breakpoint-tablet)` / `media-min(…)` for widths, and
  `hover-fine`, `touch`, `reduced-motion`, `visually-hidden` for the rest.
  An inline `@media (max-width: 767px)` is a violation.
- No token for the value you need? Add it to `src/styles/` first, then
  reference it. Do not inline it "just this once".

`src/constants/breakpoints.ts` is a **declared mirror** of `_breakpoints.scss`
for JavaScript consumers, because SCSS variables cannot be imported into JS.
Change one side, change the other.

## 4. Content comes from Sanity, always

No production copy or imagery is hardcoded in components. When required Sanity
data is missing, the app raises an error — it never renders a placeholder. See
`src/sanity/fetchers.ts` and its tests.

## 5. Before you call it done

```bash
npm run lint       # jsx-a11y included; warnings fail
npm run typecheck  # uses tsconfig.typecheck.json, not the base config
npm test           # Vitest unit + mock tests
npm run build      # catches prerender-time breakage the others cannot see
```

The Git hooks run these on commit and push, so a broken change cannot be
committed by accident. Formatting is applied for you — never hand-fix layout.

New or changed behaviour in a critical flow (work gallery navigation, Sanity
content error handling) needs a test. Async Server Components under
`src/app/` cannot be unit-tested; that gap is known and documented.
