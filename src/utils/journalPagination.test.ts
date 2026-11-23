import { describe, expect, it } from "vitest";
import {
  journalPagePath,
  pageCount,
  paginate,
  parsePageNumber,
} from "./journalPagination";

describe("pageCount", () => {
  it("rounds up, so a partly filled last page still counts", () => {
    expect(pageCount(1, 12)).toBe(1);
    expect(pageCount(12, 12)).toBe(1);
    expect(pageCount(13, 12)).toBe(2);
    expect(pageCount(72, 12)).toBe(6);
  });

  it("is one page for an empty journal, so the empty state has somewhere to live", () => {
    expect(pageCount(0, 12)).toBe(1);
  });

  it("uses twelve per page unless told otherwise", () => {
    expect(pageCount(25)).toBe(3);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 30 }, (_, index) => index + 1);

  it("slices the requested page, in order", () => {
    expect(paginate(items, 1, 12)).toEqual(items.slice(0, 12));
    expect(paginate(items, 2, 12)).toEqual(items.slice(12, 24));
  });

  it("returns the short remainder on the last page", () => {
    expect(paginate(items, 3, 12)).toEqual([25, 26, 27, 28, 29, 30]);
  });

  it("returns nothing past the end rather than throwing", () => {
    expect(paginate(items, 4, 12)).toEqual([]);
  });

  it("shows every item exactly once across all pages", () => {
    const pages = [1, 2, 3].flatMap((page) => paginate(items, page, 12));

    expect(pages).toEqual(items);
  });
});

describe("parsePageNumber", () => {
  it("accepts plain positive integers", () => {
    expect(parsePageNumber("1")).toBe(1);
    expect(parsePageNumber("2")).toBe(2);
    expect(parsePageNumber("40")).toBe(40);
  });

  it.each(["0", "-1", "02", "1.5", "2.0", "abc", "", " 2", "2 ", "1e3", "٣"])(
    "rejects %j, which would be a second address or no page at all",
    (segment) => {
      expect(parsePageNumber(segment)).toBeNull();
    },
  );

  it("rejects a number too large to be exact", () => {
    expect(parsePageNumber("99999999999999999999")).toBeNull();
  });
});

describe("journalPagePath", () => {
  it("keeps page 1 at the journal's own address", () => {
    expect(journalPagePath(1)).toBe("/journal");
  });

  it("puts later pages under /journal/page/", () => {
    expect(journalPagePath(2)).toBe("/journal/page/2");
    expect(journalPagePath(10)).toBe("/journal/page/10");
  });
});
