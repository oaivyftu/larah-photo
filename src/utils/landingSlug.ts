// Relative imports, not `@/`: the Studio validators call this, and the Sanity
// CLI bundler does not read the tsconfig alias.
import {
  LANDING_SLUG_PATTERN,
  LANDING_SLUG_SUFFIX,
} from "../constants/landingPage";
import { isReservedRootSegment } from "../constants/reservedRoutes";

export function isLandingSlug(value: string): boolean {
  return LANDING_SLUG_PATTERN.test(value);
}

/** Why a slug cannot be used, in words for the editor; `null` when it can. */
export function landingSlugProblem(slug: string): string | null {
  if (!isLandingSlug(slug)) {
    return "Use lower-case letters, digits and hyphens only.";
  }

  if (isReservedRootSegment(slug)) {
    return `“${slug}” is an existing page of the site. Choose another slug.`;
  }

  return null;
}

/** The Studio's starting value: `<service>-photographer-london-ontario`. A
 *  suggestion only; the editor can change it. */
export function suggestLandingSlug(serviceName: string): string {
  return `${serviceName} ${LANDING_SLUG_SUFFIX}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
