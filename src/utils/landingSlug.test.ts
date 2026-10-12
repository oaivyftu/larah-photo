import { describe, expect, it } from "vitest";
import { RESERVED_ROOT_SEGMENTS } from "@/constants/reservedRoutes";
import {
  isLandingSlug,
  landingSlugProblem,
  suggestLandingSlug,
} from "./landingSlug";

describe("isLandingSlug", () => {
  it.each(["engagement-photographer-london-ontario", "a1"])(
    "accepts %j",
    (slug) => {
      expect(isLandingSlug(slug)).toBe(true);
    },
  );

  it.each([
    "Engagement",
    "a_b",
    "a b",
    "-a",
    "a-",
    "a--b",
    "sitemap.xml",
    "wp-login.php",
    "",
  ])("rejects %j", (slug) => {
    expect(isLandingSlug(slug)).toBe(false);
  });
});

describe("landingSlugProblem", () => {
  it("returns null for a good slug", () => {
    expect(landingSlugProblem("engagement-photographer-london-ontario")).toBe(
      null,
    );
  });

  it("explains a malformed slug", () => {
    expect(landingSlugProblem("Not A Slug")).toMatch(
      /lower-case letters, digits and hyphens/,
    );
  });

  it.each(RESERVED_ROOT_SEGMENTS)(
    "says %j is an existing page of the site",
    (segment) => {
      expect(landingSlugProblem(segment)).toMatch(
        /is an existing page of the site/,
      );
    },
  );
});

describe("suggestLandingSlug", () => {
  it("appends the city suffix to the service name", () => {
    expect(suggestLandingSlug("Engagement")).toBe(
      "engagement-photographer-london-ontario",
    );
  });

  it("slugifies punctuation with no doubled or trailing hyphen", () => {
    const slug = suggestLandingSlug("Pre Wedding & Co.");

    expect(slug).toBe("pre-wedding-co-photographer-london-ontario");
    expect(slug).not.toMatch(/--|-$/);
  });
});
