import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isReservedRootSegment } from "@/constants/reservedRoutes";
import { composeLandingHeading } from "./landingHeading";
import { isLandingSlug } from "./landingSlug";
import {
  assessLandingPageQuality,
  type LandingPageContent,
} from "./landingPageQuality";

// The launch content (spec 014 FR-040, FR-041) reaches the dataset by
// `sanity dataset import`, which skips Studio validation entirely. This file is
// therefore the only check standing between a thin imported page and the live
// site, and it runs in `npm test` on every push (research.md §4b). It reads the
// files; it mocks nothing.

const CONTENT_DIR = path.resolve(
  __dirname,
  "../../content/service-landing-pages",
);

type LandingDocument = LandingPageContent & {
  _id: string;
  _type: string;
  published?: boolean;
  approvedAgainstBrief?: boolean;
  package?: { _ref?: string };
  serviceName: string;
  alternateName?: string;
  category: string;
  slug: { current: string };
  seoTitle: string;
  seoDescription: string;
};

type SettingsDocument = { _id: string; headingPattern: string };

function read<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(CONTENT_DIR, file), "utf8")) as T;
}

const files = readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".json"));
const pageFiles = files.filter((file) => file !== "settings.json").sort();
const pages = pageFiles.map((file) => ({
  file,
  service: file.replace(/\.json$/, ""),
  doc: read<LandingDocument>(file),
}));
const settings = read<SettingsDocument>("settings.json");

/** `{city}` is the site setting's location; the file holds only the pattern. */
const CITY = "London, Ontario";

describe("the launch content files", () => {
  it("reads the four launch pages and the settings", () => {
    // Guards the reader: nothing below may pass over an empty folder.
    expect(pageFiles).toEqual([
      "engagement.json",
      "family.json",
      "graduation.json",
      "portrait.json",
    ]);
  });

  it("holds the shared settings, with a heading pattern holding both placeholders", () => {
    expect(settings._id).toBe("serviceLandingSettings");
    expect(settings.headingPattern).toContain("{service}");
    expect(settings.headingPattern).toContain("{city}");
  });
});

describe.each(pages)("$file", ({ service, doc }) => {
  it("is a landing page document with a deterministic id", () => {
    expect(doc._type).toBe("serviceLandingPage");
    expect(doc._id).toBe(`serviceLandingPage.${service}`);
  });

  it("meets every quality minimum the Studio would have enforced", () => {
    expect(
      assessLandingPageQuality(doc).map((finding) => finding.message),
    ).toEqual([]);
  });

  it("arrives held back and unapproved, for the owner to switch on", () => {
    expect(doc.published).toBe(false);
    expect(doc.approvedAgainstBrief).toBe(false);
  });

  it("points at a service package", () => {
    expect(
      doc.package?._ref,
      "a page with no package cannot render",
    ).toBeTruthy();
  });

  it("has a slug a visitor can reach", () => {
    expect(isLandingSlug(doc.slug.current)).toBe(true);
    expect(isReservedRootSegment(doc.slug.current)).toBe(false);
  });
});

describe("across the launch pages", () => {
  it("gives every page its own slug, package and category", () => {
    for (const pick of [
      (doc: LandingDocument) => doc.slug.current,
      (doc: LandingDocument) => doc.package?._ref,
      (doc: LandingDocument) => doc.category.trim().toLowerCase(),
    ]) {
      const values = pages.map(({ doc }) => pick(doc));

      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("gives every page its own search title and description", () => {
    for (const pick of [
      (doc: LandingDocument) => doc.seoTitle,
      (doc: LandingDocument) => doc.seoDescription,
    ]) {
      const values = pages.map(({ doc }) => pick(doc).trim().toLowerCase());

      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("keeps each search title and description within what search results show", () => {
    // Advisory in the Studio, so a launch page should not trip it either.
    for (const { doc } of pages) {
      expect(doc.seoTitle.length, doc.seoTitle).toBeLessThanOrEqual(60);
      expect(doc.seoDescription.length, doc.seoDescription).toBeLessThanOrEqual(
        160,
      );
    }
  });
});

describe("the Engagement page names itself both ways (SC-004)", () => {
  const engagement = pages.find(({ service }) => service === "engagement")!.doc;
  const both = (text: string) =>
    /engagement/i.test(text) && /pre-wedding/i.test(text);

  const heading = composeLandingHeading({
    pattern: settings.headingPattern,
    serviceName: engagement.serviceName,
    alternateName: engagement.alternateName,
    city: CITY,
  });

  it.each([
    ["the heading", heading],
    ["the introduction", engagement.introduction.join(" ")],
    ["the search title", engagement.seoTitle],
    ["the search description", engagement.seoDescription],
  ])("uses both names in %s", (_place, text) => {
    expect(both(text)).toBe(true);
  });

  it("uses both names in at least one question and its answer", () => {
    expect(
      engagement.faqs.some((faq) => both(`${faq.question} ${faq.answer}`)),
    ).toBe(true);
  });

  it("declares the alternate name the structured data is built from", () => {
    expect(engagement.alternateName).toBe("Pre-wedding");
  });
});
