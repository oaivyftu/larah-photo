import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { schemaTypes } from "./index";
import { serviceLandingPage } from "./serviceLandingPage";
import { serviceLandingSettings } from "./serviceLandingSettings";

// The schemas' shape, asserted on their exported definitions, in the manner of
// journalPost.test.ts. Sanity's validation runtime is not exercised here; what
// this holds in place is the set of fields the Studio offers, their defaults,
// and the one reference that must be strong (spec 014 data-model.md).

type Loose = Record<string, unknown> & {
  name?: string;
  type?: string;
  to?: { type: string }[];
  of?: Loose[];
  fields?: Loose[];
  initialValue?: unknown;
  weak?: boolean;
};

function fieldsOf(definition: { fields: unknown }) {
  return definition.fields as Loose[];
}

function named(fields: Loose[], name: string) {
  const found = fields.find((candidate) => candidate.name === name);

  if (!found) {
    throw new Error(`no "${name}" field`);
  }

  return found;
}

const page = fieldsOf(serviceLandingPage);
const settings = fieldsOf(serviceLandingSettings);

describe("serviceLandingPage", () => {
  it("declares every field the content model lists", () => {
    expect(page.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        "published",
        "approvedAgainstBrief",
        "package",
        "serviceName",
        "alternateName",
        "category",
        "slug",
        "introduction",
        "sections",
        "faqs",
        "seoTitle",
        "seoDescription",
      ]),
    );
  });

  it.each(["published", "approvedAgainstBrief"])(
    "holds %s back by default",
    (name) => {
      expect(named(page, name).type).toBe("boolean");
      expect(named(page, name).initialValue).toBe(false);
    },
  );

  it("points at a service package with a strong reference", () => {
    // Strong, so Sanity itself refuses to publish a page whose package is
    // unpublished and refuses to delete a package a page still uses.
    const reference = named(page, "package");

    expect(reference.type).toBe("reference");
    expect(reference.to).toEqual([{ type: "servicePackage" }]);
    expect(reference.weak).toBeUndefined();
  });

  it("keeps the introduction as paragraphs of plain text", () => {
    const introduction = named(page, "introduction");

    expect(introduction.type).toBe("array");
    expect(introduction.of!.map((member) => member["type"])).toEqual([
      "string",
    ]);
  });

  it("makes each section a heading and a body of paragraphs", () => {
    const [section] = named(page, "sections").of!;

    expect(fieldsOf(section as { fields: unknown }).map((f) => f.name)).toEqual(
      ["heading", "body"],
    );
    expect(named(fieldsOf(section as { fields: unknown }), "body").type).toBe(
      "array",
    );
  });

  it("makes each question a question and an answer", () => {
    const [faq] = named(page, "faqs").of!;

    expect(fieldsOf(faq as { fields: unknown }).map((f) => f.name)).toEqual([
      "question",
      "answer",
    ]);
  });
});

describe("serviceLandingSettings", () => {
  it("declares every shared wording field", () => {
    expect(settings.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        "headingPattern",
        "projectsHeading",
        "packageHeading",
        "packageBookLabel",
        "faqHeading",
        "ctaHeading",
        "ctaBody",
        "ctaContactLabel",
      ]),
    );
  });
});

describe("registration", () => {
  it("offers both types in the Studio", () => {
    const names = schemaTypes.map((type) => type.name);

    expect(names).toContain("serviceLandingPage");
    expect(names).toContain("serviceLandingSettings");
  });
});

describe("modules the Studio loads", () => {
  // The Sanity CLI bundler does not read the tsconfig alias, so one `@/` import
  // in any of these breaks the Studio while the app and the tests stay green.
  const studioLoaded = [
    "src/constants/landingPage.ts",
    "src/constants/reservedRoutes.ts",
    "src/utils/wordCount.ts",
    "src/utils/landingPageQuality.ts",
    "src/utils/landingSlug.ts",
    "src/utils/formatWorkCategory.ts",
    "src/sanity/schemaTypes/landingValidation.ts",
    "src/sanity/schemaTypes/serviceLandingPage.ts",
    "src/sanity/schemaTypes/serviceLandingSettings.ts",
  ];

  it.each(studioLoaded)("%s imports relatively, never through @/", (file) => {
    const source = readFileSync(
      path.resolve(__dirname, "../../..", file),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["']@\//);
  });
});
