import { HEADING_PLACEHOLDERS } from "@/constants/landingPage";

/**
 * Joins the service name and its alternate name: "Engagement & Pre-wedding".
 * This is punctuation between two editor-supplied names, not copy, so it lives
 * in code rather than the CMS (spec 014 research.md §8). Change it here if the
 * owner would rather read "and".
 */
const ALTERNATE_NAME_JOINER = " & ";

type HeadingInput = {
  pattern: string;
  serviceName: string;
  alternateName?: string;
  city: string;
};

/**
 * The page's one name: its `h1`, the text of every link to it, its breadcrumb.
 * Built from the settings pattern, the editor's own service name (casing kept)
 * and the studio's location, so it cannot drift from any of them.
 */
export function composeLandingHeading({
  pattern,
  serviceName,
  alternateName,
  city,
}: HeadingInput): string {
  for (const placeholder of Object.values(HEADING_PLACEHOLDERS)) {
    if (!pattern.includes(placeholder)) {
      throw new Error(
        `The landing heading pattern "${pattern}" must contain ${placeholder}.`,
      );
    }
  }

  const alternate = alternateName?.trim();
  const service = alternate
    ? `${serviceName}${ALTERNATE_NAME_JOINER}${alternate}`
    : serviceName;

  // A replacer function, so a `$` in a name is never read as a replacement
  // pattern.
  return pattern
    .replace(HEADING_PLACEHOLDERS.service, () => service)
    .replace(HEADING_PLACEHOLDERS.city, () => city);
}

/** The heading split into the words `PageHeading` animates; `&` is its own word. */
export function headingWords(heading: string): string[] {
  return heading.split(" ").filter(Boolean);
}
