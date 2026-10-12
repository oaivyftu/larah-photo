// Relative imports, not `@/`: the Studio validators call this, and the Sanity
// CLI bundler does not read the tsconfig path alias.
import {
  LANDING_CONFIRM_MARKER,
  LANDING_QUALITY,
} from "../constants/landingPage";
import { countParagraphsWords, countWords } from "./wordCount";

/**
 * The editor's own text, in the shape the Studio stores it. This is all a
 * quality rule may look at: the package and the search fields are not part of
 * it, so they cannot be counted by accident (spec 014 FR-042).
 */
export type LandingPageContent = {
  introduction: string[];
  sections: { heading: string; body: string[] }[];
  faqs: { question: string; answer: string }[];
};

type Path = (string | number)[];

export type QualityRule =
  "intro" | "sectionCount" | "sectionBody" | "faqCount" | "faqAnswer" | "total";

/** One thing the page is short of, and where in the document it belongs. */
export type QualityFinding = {
  rule: QualityRule;
  path: Path;
  message: string;
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** "has 38 words; it needs at least 50 (12 more)" — the count, the floor and
 *  the gap, which is what an editor needs to fix it. */
function shortfall(have: number, need: number) {
  return `has ${plural(have, "word")}; it needs at least ${need} (${need - have} more)`;
}

export function checkIntroduction(
  introduction: string[],
): QualityFinding | null {
  const have = countParagraphsWords(introduction);

  return have >= LANDING_QUALITY.introMinWords
    ? null
    : {
        rule: "intro",
        path: ["introduction"],
        message: `The introduction ${shortfall(have, LANDING_QUALITY.introMinWords)}.`,
      };
}

export function checkSectionCount(count: number): QualityFinding | null {
  return count >= LANDING_QUALITY.minSections
    ? null
    : {
        rule: "sectionCount",
        path: ["sections"],
        message: `The page has ${plural(count, "section")}; it needs at least ${LANDING_QUALITY.minSections}.`,
      };
}

export function checkSectionBody(
  heading: string,
  body: string[],
  index: number,
): QualityFinding | null {
  const have = countParagraphsWords(body);

  return have >= LANDING_QUALITY.sectionMinWords
    ? null
    : {
        rule: "sectionBody",
        path: ["sections", index, "body"],
        message: `The section “${heading}” ${shortfall(have, LANDING_QUALITY.sectionMinWords)}.`,
      };
}

export function checkFaqCount(count: number): QualityFinding | null {
  return count >= LANDING_QUALITY.minFaqs
    ? null
    : {
        rule: "faqCount",
        path: ["faqs"],
        message: `The page has ${plural(count, "question")}; it needs at least ${LANDING_QUALITY.minFaqs}.`,
      };
}

export function checkFaqAnswer(
  question: string,
  answer: string,
  index: number,
): QualityFinding | null {
  const have = countWords(answer);

  return have >= LANDING_QUALITY.faqAnswerMinWords
    ? null
    : {
        rule: "faqAnswer",
        path: ["faqs", index, "answer"],
        message: `The answer to “${question}” ${shortfall(have, LANDING_QUALITY.faqAnswerMinWords)}.`,
      };
}

/** Introduction, every section heading and body, every question and answer. */
export function countEditorialWords(content: LandingPageContent) {
  return (
    countParagraphsWords(content.introduction) +
    content.sections.reduce(
      (sum, section) =>
        sum + countWords(section.heading) + countParagraphsWords(section.body),
      0,
    ) +
    content.faqs.reduce(
      (sum, faq) => sum + countWords(faq.question) + countWords(faq.answer),
      0,
    )
  );
}

/** Points at the introduction, which is where an editor adds words first. */
export function checkTotal(content: LandingPageContent): QualityFinding | null {
  const have = countEditorialWords(content);
  const need = LANDING_QUALITY.totalMinWords;

  return have >= need
    ? null
    : {
        rule: "total",
        path: ["introduction"],
        message: `The page has ${plural(have, "word")} of its own text; it needs at least ${need} (${need - have} more). Add to the introduction, a section or an answer.`,
      };
}

/**
 * Everything a page is short of, against the numbers in `LANDING_QUALITY`.
 * Pure, so the Studio validators and the launch-content test run exactly the
 * same rule (spec 014 research.md §4b). These minimums measure length, not
 * quality: a page can clear every one and still be poor.
 */
export function assessLandingPageQuality(
  content: LandingPageContent,
): QualityFinding[] {
  return [
    checkIntroduction(content.introduction),
    checkSectionCount(content.sections.length),
    ...content.sections.map((section, index) =>
      checkSectionBody(section.heading, section.body, index),
    ),
    checkFaqCount(content.faqs.length),
    ...content.faqs.map((faq, index) =>
      checkFaqAnswer(faq.question, faq.answer, index),
    ),
    checkTotal(content),
  ].filter((finding): finding is QualityFinding => finding !== null);
}

/** The text fields a placeholder could be left in, in the schema's order. */
type MarkerSearchable = {
  serviceName?: unknown;
  alternateName?: unknown;
  category?: unknown;
  introduction?: unknown;
  sections?: unknown;
  faqs?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
};

const MARKER_FIELDS = [
  "serviceName",
  "alternateName",
  "category",
  "introduction",
  "sections",
  "faqs",
  "seoTitle",
  "seoDescription",
] as const satisfies readonly (keyof MarkerSearchable)[];

function containsMarker(value: unknown): boolean {
  if (typeof value === "string") {
    return value.includes(LANDING_CONFIRM_MARKER);
  }

  if (Array.isArray(value)) {
    return value.some(containsMarker);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(containsMarker);
  }

  return false;
}

/**
 * The names of the fields still holding a `[[CONFIRM …]]` placeholder — a fact
 * only the studio can supply. Each field is named once, in the schema's order.
 */
export function findConfirmMarkers(document: MarkerSearchable): string[] {
  return MARKER_FIELDS.filter((field) => containsMarker(document[field]));
}
