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
| Typography and motion tokens     | `specs/011-typography-motion-tokens/` |

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

**The rule is zero literals.** No colour, type size or spacing value may be
written out in a `*.module.scss` — not once, not with a comment explaining it.
Run `npm run audit:design-system` to check; it must exit 0. Feature 010 brought
the tree to that state, so anything the audit reports is new drift.

The design system has **two naming tiers**, both in `src/styles/`:

| Tier     | For                             | Named                              | Example                 |
| -------- | ------------------------------- | ---------------------------------- | ----------------------- |
| Scale    | values that genuinely recur     | by step                            | `--space-lg`            |
| Semantic | values belonging to one element | `--<surface>-<element>-<property>` | `--about-intro-pad-top` |

Pick a tier by asking whether a second call site would want that value _for the
same reason_. If yes, scale. If sharing the number would be coincidence,
semantic — two tokens holding the same value is correct when they encode two
decisions, so tuning one does not silently move the other.

Never name a token after its own value. `--space-fluid-37` passes the audit and
defeats the point of it.

In any `*.module.scss`:

- Use the tokens: `var(--color-…)`, `var(--font-size-…)`, `var(--space-…)`,
  plus the `--overlay-*`, `--surface-dark*`, `--on-surface-dark-*`,
  `--font-size-fluid-*`, `--space-fluid-*`, `--line-height-*`, `--tracking-*`,
  `--font-weight-*`, `--duration-*`, `--ease-*`, `--page-*`, `--container-*`,
  `--header-*`, `--frame-*` and `--divider-*` families, and the per-surface
  semantic tokens. A raw hex, a bare `font-size: 14px`, a bare
  `line-height: 1.2` and a bare `220ms` are all violations.
- **Pair a size with its leading.** Where an element defines both, the two
  names differ only in the property — `--gallery-title-size` and
  `--gallery-title-leading` — so a reader changing one sees the other. An
  element reading a scale-tier leading such as `--line-height-control` does
  **not** get a private alias; that would hide the fact it is sharing a
  decision.
- A component-local `--custom-property` holding a raw value is a **private
  token** and is also a violation. Where a value must change at a breakpoint,
  keep the local but point it at a token:
  `--float-nav-height: var(--gallery-float-height);`.
- Use the mixins from `_mixins.scss` rather than writing queries by hand:
  `media-max($breakpoint-tablet)` / `media-min(…)` for widths, and
  `hover-fine`, `touch`, `reduced-motion`, `visually-hidden` for the rest.
  Reach for `visually-hidden` before writing a screen-reader-only block by
  hand — the project already grew one byte-identical copy of it.
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
