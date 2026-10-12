import { describe, expect, it } from "vitest";
import { composeLandingHeading, headingWords } from "./landingHeading";

const pattern = "{service} Photographer in {city}";

describe("composeLandingHeading", () => {
  it("fills the service and the city into the pattern", () => {
    expect(
      composeLandingHeading({
        pattern,
        serviceName: "Portrait",
        city: "London, Ontario",
      }),
    ).toBe("Portrait Photographer in London, Ontario");
  });

  it("joins the alternate name, keeping the editor's own casing", () => {
    expect(
      composeLandingHeading({
        pattern,
        serviceName: "Engagement",
        alternateName: "Pre-wedding",
        city: "London, Ontario",
      }),
    ).toBe("Engagement & Pre-wedding Photographer in London, Ontario");
  });

  it.each(["", "   "])(
    "ignores a blank alternate name (%j)",
    (alternateName) => {
      expect(
        composeLandingHeading({
          pattern,
          serviceName: "Family",
          alternateName,
          city: "London, Ontario",
        }),
      ).toBe("Family Photographer in London, Ontario");
    },
  );

  it.each(["{service}", "{city}"])(
    "throws, naming the placeholder, when the pattern lacks %s",
    (placeholder) => {
      const broken = pattern.replace(placeholder, "");

      expect(() =>
        composeLandingHeading({
          pattern: broken,
          serviceName: "Portrait",
          city: "London",
        }),
      ).toThrow(placeholder);
    },
  );
});

describe("headingWords", () => {
  it("splits on single spaces and keeps & as its own word", () => {
    expect(
      headingWords("Engagement & Pre-wedding Photographer in London, Ontario"),
    ).toEqual([
      "Engagement",
      "&",
      "Pre-wedding",
      "Photographer",
      "in",
      "London,",
      "Ontario",
    ]);
  });
});
