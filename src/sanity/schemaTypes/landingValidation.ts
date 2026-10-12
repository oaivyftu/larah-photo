import type { ValidationContext } from "sanity";
// Relative rather than `@/`: this file is loaded by the Sanity CLI bundler,
// which does not read the tsconfig path alias.
import { HEADING_PLACEHOLDERS } from "../../constants/landingPage";
import { sanityApiVersion } from "../env";
import { categoriesMatch } from "../../utils/formatWorkCategory";
import { landingSlugProblem } from "../../utils/landingSlug";
import {
  checkFaqAnswer,
  checkFaqCount,
  checkIntroduction,
  checkSectionBody,
  checkSectionCount,
  checkTotal,
  findConfirmMarkers,
  type LandingPageContent,
} from "../../utils/landingPageQuality";

/**
 * The rules from contracts/content-model.md, as functions Sanity calls. Each is
 * thin: the logic lives in the pure functions it delegates to, which Vitest
 * covers without a Studio. The *level* — blocks or only advises — is set by the
 * schema, with `.error()` or `.warning()`, as `journalPost` does.
 *
 * Uniqueness checks look only at other landing pages; none reads another
 * page's wording (spec 014 Assumptions).
 */

type Validation = true | string;

function client(context: ValidationContext) {
  return context.getClient({ apiVersion: sanityApiVersion });
}

/** This document's draft and published ids, both excluded from every
 *  uniqueness query so a page never collides with itself. */
function ownIds(context: ValidationContext) {
  const id = context.document?._id ?? "";
  const published = id.replace(/^drafts\./, "");

  return { published, ids: [published, `drafts.${published}`] };
}

export async function packageIsUnique(
  value: { _ref?: string } | undefined,
  context: ValidationContext,
): Promise<Validation> {
  if (!value?._ref) {
    return true;
  }

  const other = await client(context).fetch<{ serviceName?: string } | null>(
    `*[_type == "serviceLandingPage" && package._ref == $ref && !(_id in $ids)][0]{serviceName}`,
    { ref: value._ref, ids: ownIds(context).ids },
  );

  return other
    ? `The page “${other.serviceName ?? "Untitled"}” already uses this package. Open that page instead.`
    : true;
}

export async function categoryIsUnique(
  value: string | undefined,
  context: ValidationContext,
): Promise<Validation> {
  if (!value?.trim()) {
    return true;
  }

  const others = await client(context).fetch<
    { serviceName?: string; category?: string }[]
  >(
    `*[_type == "serviceLandingPage" && !(_id in $ids) && defined(category)]{serviceName, category}`,
    { ids: ownIds(context).ids },
  );
  const clash = others.find(
    (other) => other.category && categoriesMatch(other.category, value),
  );

  return clash
    ? `The page “${clash.serviceName ?? "Untitled"}” already shows this category.`
    : true;
}

export function slugIsValid(
  value: { current?: string } | undefined,
): Validation {
  return value?.current ? (landingSlugProblem(value.current) ?? true) : true;
}

/** A warning: the old address stops working the moment this publishes. */
export async function slugChangeWarning(
  value: { current?: string } | undefined,
  context: ValidationContext,
): Promise<Validation> {
  if (!value?.current) {
    return true;
  }

  const published = await client(context).fetch<string | null>(
    `*[_id == $id][0].slug.current`,
    { id: ownIds(context).published },
  );

  return published && published !== value.current
    ? `This page is published at /${published}. Changing the slug breaks every existing link to it.`
    : true;
}

/** A warning: a page with no projects still publishes, but is probably a typo. */
export async function categoryMatchesProject(
  value: string | undefined,
  context: ValidationContext,
): Promise<Validation> {
  if (!value?.trim()) {
    return true;
  }

  const categories = await client(context).fetch<(string | null)[]>(
    `array::unique(*[_type == "workProject" && defined(category)].category)`,
  );

  return categories.some(
    (category) => category && categoriesMatch(category, value),
  )
    ? true
    : `No work project uses “${value}”. The page will publish with no projects. Check the spelling.`;
}

/**
 * The switch. Open markers are reported first: approval is the owner's last
 * step, so telling her to tick it while a `[[CONFIRM …]]` remains would invite
 * her to approve a page that cannot go live.
 */
export function publishedNeedsApprovalAndNoMarkers(
  value: boolean | undefined,
  context: ValidationContext,
): Validation {
  if (!value) {
    return true;
  }

  const document = (context.document ?? {}) as Record<string, unknown>;
  const markers = findConfirmMarkers(document);

  if (markers.length) {
    return `Replace every [[CONFIRM …]] with the real detail before switching this page on. Found in: ${markers.join(", ")}.`;
  }

  return document["approvedAgainstBrief"] === true
    ? true
    : "Tick “Approved against the brief” before switching this page on.";
}

export function headingPatternIsValid(value: string | undefined): Validation {
  if (!value) {
    return true;
  }

  const missing = Object.values(HEADING_PLACEHOLDERS).filter(
    (placeholder) => !value.includes(placeholder),
  );

  return missing.length
    ? `The pattern must contain ${missing.join(" and ")}.`
    : true;
}

export function introductionMeetsMinimum(
  value: string[] | undefined,
): Validation {
  return checkIntroduction(value ?? [])?.message ?? true;
}

export function sectionCountIsEnough(value: unknown[] | undefined): Validation {
  return checkSectionCount(value?.length ?? 0)?.message ?? true;
}

/** Runs on a section's `body`; the section's heading is its `parent`. */
export function sectionBodyMeetsMinimum(
  value: string[] | undefined,
  context: ValidationContext,
): Validation {
  const heading = (context.parent as { heading?: string } | undefined)?.heading;

  return (
    checkSectionBody(heading?.trim() || "Untitled", value ?? [], 0)?.message ??
    true
  );
}

export function faqCountIsEnough(value: unknown[] | undefined): Validation {
  return checkFaqCount(value?.length ?? 0)?.message ?? true;
}

/** Runs on a question's `answer`; the question is its `parent`. */
export function answerMeetsMinimum(
  value: string | undefined,
  context: ValidationContext,
): Validation {
  const question = (context.parent as { question?: string } | undefined)
    ?.question;

  return (
    checkFaqAnswer(question?.trim() || "Untitled", value ?? "", 0)?.message ??
    true
  );
}

/**
 * Document-level, because the total spans fields no single field rule can see.
 * Reported at the introduction so the message lands where an editor adds words,
 * rather than floating at the top of the document.
 */
export function documentMeetsTotal(
  document: Partial<LandingPageContent> | undefined,
): true | { message: string; path: (string | number)[] } {
  const finding = checkTotal({
    introduction: document?.introduction ?? [],
    sections: document?.sections ?? [],
    faqs: document?.faqs ?? [],
  });

  return finding ? { message: finding.message, path: finding.path } : true;
}
