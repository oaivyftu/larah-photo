import { describe, expect, it, vi } from "vitest";
import {
  LANDING_CONFIRM_MARKER,
  LANDING_QUALITY,
} from "@/constants/landingPage";
import { RESERVED_ROOT_SEGMENTS } from "@/constants/reservedRoutes";
import {
  answerMeetsMinimum,
  categoryIsUnique,
  categoryMatchesProject,
  documentMeetsTotal,
  faqCountIsEnough,
  headingPatternIsValid,
  introductionMeetsMinimum,
  packageIsUnique,
  publishedNeedsApprovalAndNoMarkers,
  sectionBodyMeetsMinimum,
  sectionCountIsEnough,
  slugChangeWarning,
  slugIsValid,
} from "./landingValidation";

// The validator factories take Sanity's validation context and call the pure
// functions the other test files already cover. These tests give them a fake
// context: a `getClient` whose `fetch` is a stub, and a `document`. Sanity's
// own validation runtime is not exercised, as for journalPost.

const DRAFT = "drafts.serviceLandingPage.engagement";
const PUBLISHED = "serviceLandingPage.engagement";

function words(count: number, prefix = "w") {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`).join(" ");
}

function context(
  options: {
    fetch?: unknown;
    document?: Record<string, unknown>;
    parent?: Record<string, unknown>;
  } = {},
) {
  const fetch = vi.fn().mockResolvedValue(options.fetch ?? null);

  return {
    fetch,
    context: {
      document: { _id: DRAFT, ...options.document },
      parent: options.parent,
      getClient: () => ({ fetch }),
    } as never,
  };
}

describe("packageIsUnique", () => {
  it("errors, naming the other page, when another page uses the package", async () => {
    const { context: ctx } = context({ fetch: { serviceName: "Portrait" } });

    await expect(packageIsUnique({ _ref: "package-1" }, ctx)).resolves.toBe(
      "The page “Portrait” already uses this package. Open that page instead.",
    );
  });

  it("passes when no other page uses it", async () => {
    const { context: ctx } = context({ fetch: null });

    await expect(packageIsUnique({ _ref: "package-1" }, ctx)).resolves.toBe(
      true,
    );
  });

  it("excludes this page in both its draft and published ids", async () => {
    const { context: ctx, fetch } = context({ fetch: null });

    await packageIsUnique({ _ref: "package-1" }, ctx);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ref: "package-1",
        ids: expect.arrayContaining([DRAFT, PUBLISHED]),
      }),
    );
  });

  it("leaves an unset package to the required rule", async () => {
    const { context: ctx, fetch } = context();

    await expect(packageIsUnique(undefined, ctx)).resolves.toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("categoryIsUnique", () => {
  it("collides on a category that differs only in case or spacing", async () => {
    const { context: ctx } = context({
      fetch: [{ serviceName: "Portrait", category: "portrait" }],
    });

    await expect(categoryIsUnique("Portrait ", ctx)).resolves.toBe(
      "The page “Portrait” already shows this category.",
    );
  });

  it("passes a category no other page shows", async () => {
    const { context: ctx } = context({
      fetch: [{ serviceName: "Portrait", category: "portrait" }],
    });

    await expect(categoryIsUnique("Family", ctx)).resolves.toBe(true);
  });

  it("excludes this page in both its draft and published ids", async () => {
    const { context: ctx, fetch } = context({ fetch: [] });

    await categoryIsUnique("Family", ctx);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ids: expect.arrayContaining([DRAFT, PUBLISHED]),
      }),
    );
  });
});

describe("slugIsValid", () => {
  it("passes a good slug", () => {
    expect(
      slugIsValid({ current: "engagement-photographer-london-ontario" }),
    ).toBe(true);
  });

  it("explains a malformed slug", () => {
    expect(slugIsValid({ current: "Not A Slug" })).toBe(
      "Use lower-case letters, digits and hyphens only.",
    );
  });

  it.each(RESERVED_ROOT_SEGMENTS)("refuses the reserved address %j", (slug) => {
    expect(slugIsValid({ current: slug })).toBe(
      `“${slug}” is an existing page of the site. Choose another slug.`,
    );
  });

  it("leaves an empty slug to the required rule", () => {
    expect(slugIsValid(undefined)).toBe(true);
  });
});

describe("slugChangeWarning", () => {
  it("warns, naming the old address, when a published page changes slug", async () => {
    const { context: ctx } = context({ fetch: "old-slug" });

    await expect(slugChangeWarning({ current: "new-slug" }, ctx)).resolves.toBe(
      "This page is published at /old-slug. Changing the slug breaks every existing link to it.",
    );
  });

  it("passes on a first publish, when no published document exists", async () => {
    const { context: ctx } = context({ fetch: null });

    await expect(slugChangeWarning({ current: "new-slug" }, ctx)).resolves.toBe(
      true,
    );
  });

  it("passes when the slug is unchanged", async () => {
    const { context: ctx } = context({ fetch: "same-slug" });

    await expect(
      slugChangeWarning({ current: "same-slug" }, ctx),
    ).resolves.toBe(true);
  });
});

describe("categoryMatchesProject", () => {
  it("advises, naming the category, when no project uses it", async () => {
    const { context: ctx } = context({ fetch: ["portrait", "family"] });

    await expect(categoryMatchesProject("Graduation", ctx)).resolves.toBe(
      "No work project uses “Graduation”. The page will publish with no projects. Check the spelling.",
    );
  });

  it("passes a category a project uses, ignoring case and spacing", async () => {
    const { context: ctx } = context({ fetch: ["Portrait"] });

    await expect(categoryMatchesProject(" portrait", ctx)).resolves.toBe(true);
  });
});

describe("publishedNeedsApprovalAndNoMarkers", () => {
  it("passes when the page is not being switched on, whatever else is true", () => {
    const { context: ctx } = context({
      document: {
        approvedAgainstBrief: false,
        seoTitle: `${LANDING_CONFIRM_MARKER}: x]]`,
      },
    });

    expect(publishedNeedsApprovalAndNoMarkers(false, ctx)).toBe(true);
    expect(publishedNeedsApprovalAndNoMarkers(undefined, ctx)).toBe(true);
  });

  it("refuses the switch without approval", () => {
    const { context: ctx } = context({
      document: { approvedAgainstBrief: false },
    });

    expect(publishedNeedsApprovalAndNoMarkers(true, ctx)).toBe(
      "Tick “Approved against the brief” before switching this page on.",
    );
  });

  it("refuses the switch while a marker remains, naming each field", () => {
    const { context: ctx } = context({
      document: {
        approvedAgainstBrief: true,
        seoTitle: `${LANDING_CONFIRM_MARKER}: title]]`,
        introduction: [`Ready in ${LANDING_CONFIRM_MARKER}: time]].`],
      },
    });

    expect(publishedNeedsApprovalAndNoMarkers(true, ctx)).toBe(
      "Replace every [[CONFIRM …]] with the real detail before switching this page on. Found in: introduction, seoTitle.",
    );
  });

  it("allows the switch once approved and clean", () => {
    const { context: ctx } = context({
      document: { approvedAgainstBrief: true, seoTitle: "Fine" },
    });

    expect(publishedNeedsApprovalAndNoMarkers(true, ctx)).toBe(true);
  });
});

describe("headingPatternIsValid", () => {
  it("passes a pattern holding both placeholders", () => {
    expect(headingPatternIsValid("{service} Photographer in {city}")).toBe(
      true,
    );
  });

  it.each([
    ["{service}", "Photographer in {city}"],
    ["{city}", "{service} Photographer"],
  ])("refuses a pattern without %s", (placeholder, pattern) => {
    expect(headingPatternIsValid(pattern)).toContain(placeholder);
  });

  it("leaves an empty pattern to the required rule", () => {
    expect(headingPatternIsValid(undefined)).toBe(true);
  });
});

describe("the word-count validators", () => {
  it("introduction: states the count and the shortfall", () => {
    const short = LANDING_QUALITY.introMinWords - 1;

    expect(introductionMeetsMinimum([words(short)])).toBe(
      `The introduction has ${short} words; it needs at least ${LANDING_QUALITY.introMinWords} (1 more).`,
    );
    expect(
      introductionMeetsMinimum([words(LANDING_QUALITY.introMinWords)]),
    ).toBe(true);
  });

  it("sections: needs the minimum count", () => {
    const section = {
      heading: "H",
      body: [words(LANDING_QUALITY.sectionMinWords)],
    };

    expect(sectionCountIsEnough([section, section])).toBe(
      `The page has 2 sections; it needs at least ${LANDING_QUALITY.minSections}.`,
    );
    expect(
      sectionCountIsEnough(Array(LANDING_QUALITY.minSections).fill(section)),
    ).toBe(true);
  });

  it("a section body: names its heading", () => {
    const short = LANDING_QUALITY.sectionMinWords - 1;
    const { context: ctx } = context({ parent: { heading: "Where we shoot" } });

    expect(sectionBodyMeetsMinimum([words(short)], ctx)).toBe(
      `The section “Where we shoot” has ${short} words; it needs at least ${LANDING_QUALITY.sectionMinWords} (1 more).`,
    );
    expect(
      sectionBodyMeetsMinimum([words(LANDING_QUALITY.sectionMinWords)], ctx),
    ).toBe(true);
  });

  it("questions: needs the minimum count", () => {
    expect(faqCountIsEnough([{ question: "Q?", answer: "A." }])).toBe(
      `The page has 1 question; it needs at least ${LANDING_QUALITY.minFaqs}.`,
    );
  });

  it("an answer: names its question", () => {
    const short = LANDING_QUALITY.faqAnswerMinWords - 1;
    const { context: ctx } = context({ parent: { question: "How long?" } });

    expect(answerMeetsMinimum(words(short), ctx)).toBe(
      `The answer to “How long?” has ${short} words; it needs at least ${LANDING_QUALITY.faqAnswerMinWords} (1 more).`,
    );
    expect(
      answerMeetsMinimum(words(LANDING_QUALITY.faqAnswerMinWords), ctx),
    ).toBe(true);
  });

  it("the total: reports at the introduction", () => {
    const result = documentMeetsTotal({
      introduction: [words(LANDING_QUALITY.introMinWords)],
      sections: [],
      faqs: [],
    });

    expect(result).toMatchObject({ path: ["introduction"] });
    expect((result as { message: string }).message).toContain(
      "words of its own text",
    );
  });

  it("the total: passes once the page is long enough", () => {
    expect(
      documentMeetsTotal({
        introduction: [words(LANDING_QUALITY.totalMinWords)],
        sections: [],
        faqs: [],
      }),
    ).toBe(true);
  });
});
