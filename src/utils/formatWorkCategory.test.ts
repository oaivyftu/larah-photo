import { describe, expect, it } from "vitest";
import {
  formatWorkCategory,
  normalizeWorkCategory,
} from "./formatWorkCategory";

describe("normalizeWorkCategory", () => {
  it("lowercases and hyphenates a multi-word category", () => {
    expect(normalizeWorkCategory("Fine Art")).toBe("fine-art");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeWorkCategory("  Wedding  ")).toBe("wedding");
  });

  it("collapses runs of whitespace into a single hyphen", () => {
    expect(normalizeWorkCategory("black   and\twhite")).toBe("black-and-white");
  });

  it("leaves an already-normalised value unchanged", () => {
    expect(normalizeWorkCategory("fine-art")).toBe("fine-art");
  });
});

describe("formatWorkCategory", () => {
  it("title-cases each hyphen-separated word", () => {
    expect(formatWorkCategory("fine-art")).toBe("Fine Art");
  });

  it("round-trips a display value back to itself", () => {
    expect(formatWorkCategory("Fine Art")).toBe("Fine Art");
  });

  it("handles a single word", () => {
    expect(formatWorkCategory("PORTRAIT")).toBe("Portrait");
  });

  it("title-cases every word of a three-word category", () => {
    expect(formatWorkCategory("black and white")).toBe("Black And White");
  });
});
