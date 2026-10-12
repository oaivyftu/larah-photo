/**
 * Top-level URL segments that belong to something other than a landing page.
 *
 * A static route always wins over `[landingSlug]`, so a landing page claiming
 * one of these would be saved, published and then never rendered. The Studio
 * refuses these as slugs and the page 404s them without a CMS read.
 * `reservedRoutes.test.ts` keeps this equal to the real top-level routes, so a
 * new route cannot silently become a slug an editor can claim (research.md §1).
 *
 * No imports, on purpose: the Studio bundle loads this file and cannot read
 * the `@/` alias.
 */
export const RESERVED_ROOT_SEGMENTS = [
  "work",
  "service",
  "about",
  "contact",
  "journal",
  "studio",
  "api",
] as const;

export function isReservedRootSegment(value: string): boolean {
  return (RESERVED_ROOT_SEGMENTS as readonly string[]).includes(value);
}
