import { describe, expect, it } from "vitest";
import {
  LANDING_CONFIRM_MARKER,
  LANDING_QUALITY,
} from "@/constants/landingPage";
import {
  assessLandingPageQuality,
  findConfirmMarkers,
  type LandingPageContent,
} from "./landingPageQuality";
import { countWords } from "./wordCount";

/** `count` distinct words, so a count is exact and never accidental. */
function words(count: number, prefix = "w") {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(
    " ",
  );
}

/** A page that clears every part and the total, by `extra` words of headroom. */
function compliant(extra = 40): LandingPageContent {
  return {
    introduction: [words(LANDING_QUALITY.introMinWords + extra, "intro")],
    sections: Array.from({ length: LANDING_QUALITY.minSections }, (_, i) => ({
      heading: `Section ${i + 1}`,
      body: [words(LANDING_QUALITY.sectionMinWords, `s${i}x`)],
    })),
    faqs: Array.from({ length: LANDING_QUALITY.minFaqs }, (_, i) => ({
      question: `Question ${i + 1}?`,
      answer: words(LANDING_QUALITY.faqAnswerMinWords, `a${i}x`),
    })),
  };
}

function totalWordsOf(content: LandingPageContent) {
  return (
    content.introduction.reduce((sum, p) => sum + countWords(p), 0) +
    content.sections.reduce(
      (sum, s) =>
        sum +
        countWords(s.heading) +
        s.body.reduce((n, p) => n + countWords(p), 0),
      0,
    ) +
    content.faqs.reduce(
      (sum, f) => sum + countWords(f.question) + countWords(f.answer),
      0,
    )
  );
}

describe("assessLandingPageQuality", () => {
  it("returns nothing for a page that meets every minimum", () => {
    const content = compliant();

    expect(totalWordsOf(content)).toBeGreaterThanOrEqual(
      LANDING_QUALITY.totalMinWords,
    );
    expect(assessLandingPageQuality(content)).toEqual([]);
  });

  describe("the introduction", () => {
    it("passes at exactly the minimum", () => {
      const content = compliant();
      content.introduction = [words(LANDING_QUALITY.introMinWords)];

      expect(
        assessLandingPageQuality(content).filter((f) => f.rule === "intro"),
      ).toEqual([]);
    });

    it("fails one word under, saying the count and the shortfall", () => {
      const content = compliant();
      const short = LANDING_QUALITY.introMinWords - 1;
      content.introduction = [words(short)];

      expect(
        assessLandingPageQuality(content).find((f) => f.rule === "intro"),
      ).toEqual({
        rule: "intro",
        path: ["introduction"],
        message: `The introduction has ${short} words; it needs at least ${LANDING_QUALITY.introMinWords} (1 more).`,
      });
    });

    it("adds up paragraphs", () => {
      const content = compliant();
      content.introduction = [
        words(30, "a"),
        words(LANDING_QUALITY.introMinWords - 30, "b"),
      ];

      expect(
        assessLandingPageQuality(content).filter((f) => f.rule === "intro"),
      ).toEqual([]);
    });
  });

  describe("the sections", () => {
    it("passes at the minimum count and fails one under", () => {
      const content = compliant();
      expect(
        assessLandingPageQuality(content).filter(
          (f) => f.rule === "sectionCount",
        ),
      ).toEqual([]);

      content.sections = content.sections.slice(
        0,
        LANDING_QUALITY.minSections - 1,
      );
      const [finding] = assessLandingPageQuality(content).filter(
        (f) => f.rule === "sectionCount",
      );

      expect(finding).toEqual({
        rule: "sectionCount",
        path: ["sections"],
        message: `The page has ${LANDING_QUALITY.minSections - 1} sections; it needs at least ${LANDING_QUALITY.minSections}.`,
      });
    });

    it("passes a body at exactly the minimum and fails one under, naming the section", () => {
      const content = compliant();
      content.sections[1] = {
        heading: "Where we shoot",
        body: [words(LANDING_QUALITY.sectionMinWords)],
      };
      expect(
        assessLandingPageQuality(content).filter(
          (f) => f.rule === "sectionBody",
        ),
      ).toEqual([]);

      const short = LANDING_QUALITY.sectionMinWords - 1;
      content.sections[1] = { heading: "Where we shoot", body: [words(short)] };
      const [finding] = assessLandingPageQuality(content).filter(
        (f) => f.rule === "sectionBody",
      );

      expect(finding).toEqual({
        rule: "sectionBody",
        path: ["sections", 1, "body"],
        message: `The section “Where we shoot” has ${short} words; it needs at least ${LANDING_QUALITY.sectionMinWords} (1 more).`,
      });
    });
  });

  describe("the questions", () => {
    it("passes at the minimum count and fails one under", () => {
      const content = compliant();
      expect(
        assessLandingPageQuality(content).filter((f) => f.rule === "faqCount"),
      ).toEqual([]);

      content.faqs = content.faqs.slice(0, LANDING_QUALITY.minFaqs - 1);
      const [finding] = assessLandingPageQuality(content).filter(
        (f) => f.rule === "faqCount",
      );

      expect(finding).toEqual({
        rule: "faqCount",
        path: ["faqs"],
        message: `The page has ${LANDING_QUALITY.minFaqs - 1} questions; it needs at least ${LANDING_QUALITY.minFaqs}.`,
      });
    });

    it("passes an answer at exactly the minimum and fails one under, naming the question", () => {
      const content = compliant();
      const short = LANDING_QUALITY.faqAnswerMinWords - 1;
      content.faqs[2] = { question: "How long?", answer: words(short) };

      const [finding] = assessLandingPageQuality(content).filter(
        (f) => f.rule === "faqAnswer",
      );

      expect(finding).toEqual({
        rule: "faqAnswer",
        path: ["faqs", 2, "answer"],
        message: `The answer to “How long?” has ${short} words; it needs at least ${LANDING_QUALITY.faqAnswerMinWords} (1 more).`,
      });

      content.faqs[2] = {
        question: "How long?",
        answer: words(LANDING_QUALITY.faqAnswerMinWords),
      };
      expect(
        assessLandingPageQuality(content).filter((f) => f.rule === "faqAnswer"),
      ).toEqual([]);
    });
  });

  describe("what counts as a word", () => {
    it.each(["   \n ", "—", "& • ..."])(
      "counts %j as no words at all",
      (filler) => {
        const content = compliant();
        content.introduction = [filler];

        expect(
          assessLandingPageQuality(content).find((f) => f.rule === "intro")!
            .message,
        ).toContain("has 0 words");
      },
    );

    it("does not let padding stand in for words in a section", () => {
      const content = compliant();
      content.sections[0] = {
        heading: "Padded",
        body: [`${words(LANDING_QUALITY.sectionMinWords - 1)} — & •`],
      };

      expect(
        assessLandingPageQuality(content).filter(
          (f) => f.rule === "sectionBody",
        ),
      ).toHaveLength(1);
    });
  });

  describe("the total", () => {
    /** Every part at exactly its minimum, so only the total is in question. */
    function atEveryPartMinimum(): LandingPageContent {
      return compliant(0);
    }

    it("fails only the total when each part passes but they add up to too little", () => {
      const content = atEveryPartMinimum();

      expect(totalWordsOf(content)).toBeLessThan(LANDING_QUALITY.totalMinWords);
      const findings = assessLandingPageQuality(content);

      expect(findings.map((f) => f.rule)).toEqual(["total"]);
    });

    it("points at the introduction, with the count and the shortfall", () => {
      const content = atEveryPartMinimum();
      const have = totalWordsOf(content);
      const missing = LANDING_QUALITY.totalMinWords - have;

      expect(assessLandingPageQuality(content)[0]).toEqual({
        rule: "total",
        path: ["introduction"],
        message: `The page has ${have} words of its own text; it needs at least ${LANDING_QUALITY.totalMinWords} (${missing} more). Add to the introduction, a section or an answer.`,
      });
    });

    it("passes at exactly the minimum and fails one under", () => {
      const content = atEveryPartMinimum();
      const missing = LANDING_QUALITY.totalMinWords - totalWordsOf(content);

      content.introduction = [
        words(LANDING_QUALITY.introMinWords + missing - 1, "intro"),
      ];
      expect(assessLandingPageQuality(content).map((f) => f.rule)).toEqual([
        "total",
      ]);

      content.introduction = [
        words(LANDING_QUALITY.introMinWords + missing, "intro"),
      ];
      expect(assessLandingPageQuality(content)).toEqual([]);
    });

    it("counts section headings and questions as well as bodies and answers", () => {
      const content = atEveryPartMinimum();
      const before = totalWordsOf(content);

      content.sections[0] = {
        heading: "A heading of exactly five words",
        body: content.sections[0]!.body,
      };

      expect(totalWordsOf(content)).toBeGreaterThan(before);
    });

    it("counts only the editor's own text: the package and search fields are not in it", () => {
      // The content shape has no package or search fields, so they cannot be
      // counted by accident.
      const content = {
        ...atEveryPartMinimum(),
        seoTitle: words(500),
        seoDescription: words(500),
        package: { description: words(500) },
      } as LandingPageContent;

      expect(assessLandingPageQuality(content).map((f) => f.rule)).toEqual([
        "total",
      ]);
    });
  });

  it("gives every shortfall the path of the field it concerns", () => {
    const content = compliant(0);
    content.introduction = [""];
    content.sections = [];
    content.faqs = [];

    for (const finding of assessLandingPageQuality(content)) {
      expect(finding.path.length, finding.message).toBeGreaterThan(0);
    }
  });
});

describe("findConfirmMarkers", () => {
  const marker = `${LANDING_CONFIRM_MARKER}: delivery time]]`;

  it("finds nothing in a clean document", () => {
    expect(findConfirmMarkers({ ...compliant(), seoTitle: "Fine" })).toEqual(
      [],
    );
  });

  it.each([
    ["serviceName", { serviceName: `Engagement ${marker}` }],
    ["alternateName", { alternateName: marker }],
    ["category", { category: marker }],
    ["introduction", { introduction: [`Ready in ${marker}.`] }],
    [
      "sections",
      { sections: [{ heading: "H", body: [`Delivered ${marker}.`] }] },
    ],
    [
      "sections",
      { sections: [{ heading: `Heading ${marker}`, body: ["Text."] }] },
    ],
    ["faqs", { faqs: [{ question: "When?", answer: `In ${marker}.` }] }],
    ["faqs", { faqs: [{ question: `When ${marker}?`, answer: "Soon." }] }],
    ["seoTitle", { seoTitle: marker }],
    ["seoDescription", { seoDescription: `Text ${marker}` }],
  ])("finds a marker in %s", (field, override) => {
    expect(findConfirmMarkers(override)).toEqual([field]);
  });

  it("names each field once, in document order", () => {
    expect(
      findConfirmMarkers({
        seoTitle: marker,
        introduction: [marker, marker],
        category: marker,
      }),
    ).toEqual(["category", "introduction", "seoTitle"]);
  });
});
