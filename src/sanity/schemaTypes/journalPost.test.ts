import { afterEach, describe, expect, it, vi } from "vitest";
import { JOURNAL_CATEGORIES } from "@/constants/journalCategories";
import { journalPost } from "./journalPost";

// The schema's shape, asserted on its exported definition. Sanity's own
// validation runtime is not exercised here — what this holds in place is the
// set of choices the Studio offers an editor, which is where spec 013's
// guarantees start: no h1 in a body, a fixed category list, a visible
// scheduled state.

type Loose = Record<string, unknown> & {
  name?: string;
  of?: Loose[];
  styles?: { value: string }[];
  lists?: { value: string }[];
  marks?: { decorators?: { value: string }[] };
  options?: { list?: { value: string }[] };
};

const fields = journalPost.fields as unknown as Loose[];

function field(name: string) {
  const found = fields.find((candidate) => candidate.name === name);

  if (!found) {
    throw new Error(`journalPost has no "${name}" field`);
  }

  return found;
}

const block = field("body").of!.find((member) => member["type"] === "block")!;

afterEach(() => {
  vi.useRealTimers();
});

describe("the post body", () => {
  it("offers headings beneath the title and a pull quote, never an h1", () => {
    expect(block.styles!.map((style) => style.value)).toEqual([
      "normal",
      "h2",
      "h3",
      "h4",
      "blockquote",
    ]);
  });

  it("offers bulleted and numbered lists", () => {
    expect(block.lists!.map((list) => list.value)).toEqual([
      "bullet",
      "number",
    ]);
  });

  it("offers bold and italic", () => {
    expect(block.marks!.decorators!.map((mark) => mark.value)).toEqual([
      "strong",
      "em",
    ]);
  });

  it("accepts images and embeds alongside text", () => {
    expect(
      field("body").of!.map((member) => member.name ?? member["type"]),
    ).toEqual(["block", "bodyImage", "embed"]);
  });
});

describe("the category", () => {
  it("offers exactly the fixed list", () => {
    expect(field("category").options!.list!.map((item) => item.value)).toEqual([
      ...JOURNAL_CATEGORIES,
    ]);
  });
});

describe("the document preview", () => {
  // Looked up per test, so a missing preview fails these cases rather than
  // stopping the whole file from loading.
  function prepare(value: Record<string, unknown>) {
    const fn = journalPost.preview?.prepare as
      ((value: Record<string, unknown>) => { subtitle?: string }) | undefined;

    if (!fn) {
      throw new Error("journalPost has no preview.prepare");
    }

    return fn(value);
  }

  function subtitleOn(publishedAt: string) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-15T16:00:00Z"));

    return prepare({ title: "A post", publishedAt }).subtitle;
  }

  it("flags a post whose date is still ahead as scheduled", () => {
    expect(subtitleOn("2026-09-20")).toBe("Scheduled · September 20, 2026");
  });

  it("shows only the date once it has arrived", () => {
    // Not "Live": the preview cannot see whether the document is published,
    // and Sanity's own draft/published badge already says that. Claiming
    // "Live" for an unpublished draft would be false.
    expect(subtitleOn("2026-09-15")).toBe("September 15, 2026");
    expect(subtitleOn("2026-09-01")).toBe("September 1, 2026");
  });

  it("says so when there is no date yet", () => {
    expect(prepare({ title: "A post" }).subtitle).toBe("No date set");
  });
});
