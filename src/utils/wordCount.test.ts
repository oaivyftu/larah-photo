import { describe, expect, it } from "vitest";
import { countParagraphsWords, countWords } from "./wordCount";

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("ignores leading, trailing, repeated and newline whitespace", () => {
    expect(countWords("  one   two\n\nthree \t")).toBe(3);
  });

  it("counts nothing for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n ")).toBe(0);
  });

  it.each(["—", "&", "•", "..."])(
    "does not count %j, a token with no letter or digit",
    (token) => {
      expect(countWords(`one ${token} two`)).toBe(2);
    },
  );

  it("counts a hyphenated word once", () => {
    expect(countWords("a pre-wedding session")).toBe(3);
  });

  it("counts accented and non-Latin words", () => {
    expect(countWords("café")).toBe(1);
    expect(countWords("写真 撮影")).toBe(2);
  });

  it("counts a number", () => {
    expect(countWords("book 2 weeks ahead")).toBe(4);
  });
});

describe("countParagraphsWords", () => {
  it("sums the words across paragraphs", () => {
    expect(countParagraphsWords(["a b", "c"])).toBe(3);
  });

  it("is zero for no paragraphs", () => {
    expect(countParagraphsWords([])).toBe(0);
  });
});
