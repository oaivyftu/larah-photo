import { describe, expect, it } from "vitest";
import { resolveSanityImage, toOpenGraphImage } from "./image";
import type { SanityImageValue } from "./image";

const complete: SanityImageValue = {
  asset: {
    url: "https://cdn.sanity.io/images/p/dataset/abc-1600x900.jpg",
    metadata: {
      lqip: "data:image/jpeg;base64,xx",
      dimensions: { width: 1600, height: 900 },
    },
  },
  alt: "A bride on a clifftop",
};

describe("resolveSanityImage", () => {
  it("returns the asset's url, alt and dimensions", () => {
    expect(resolveSanityImage(complete, "hero")).toEqual({
      src: complete.asset?.url,
      alt: "A bride on a clifftop",
      width: 1600,
      height: 900,
      blurDataURL: "data:image/jpeg;base64,xx",
    });
  });

  it("trims surrounding whitespace from alt text", () => {
    const padded = { ...complete, alt: "   A bride on a clifftop \n " };

    expect(resolveSanityImage(padded, "hero").alt).toBe(
      "A bride on a clifftop",
    );
  });

  it("passes through a missing lqip rather than inventing one", () => {
    const noLqip = {
      ...complete,
      asset: {
        ...complete.asset,
        metadata: { dimensions: { width: 1, height: 1 } },
      },
    };

    expect(resolveSanityImage(noLqip, "hero").blurDataURL).toBeUndefined();
  });

  // Principle I: missing CMS data raises, it never renders a placeholder. Each
  // case is listed separately because each is a different thing an editor can
  // leave out, and the error has to name the field either way.
  it.each([
    ["no image at all", null],
    ["no image at all (undefined)", undefined],
    ["no asset", { alt: "x" }],
    [
      "no url",
      {
        asset: { metadata: { dimensions: { width: 1, height: 1 } } },
        alt: "x",
      },
    ],
    ["no alt", { ...complete, alt: undefined }],
    ["blank alt", { ...complete, alt: "   " }],
    ["no dimensions", { asset: { url: "https://x/y.jpg" }, alt: "x" }],
    [
      "zero width",
      {
        asset: {
          url: "https://x/y.jpg",
          metadata: { dimensions: { width: 0, height: 9 } },
        },
        alt: "x",
      },
    ],
    [
      "zero height",
      {
        asset: {
          url: "https://x/y.jpg",
          metadata: { dimensions: { width: 9, height: 0 } },
        },
        alt: "x",
      },
    ],
  ])("throws when the image has %s", (_case, value) => {
    expect(() =>
      resolveSanityImage(value as SanityImageValue, "portraitOne"),
    ).toThrow(
      'Sanity image "portraitOne" requires an asset, alt text, and dimensions.',
    );
  });
});

describe("toOpenGraphImage", () => {
  it("crops to the 1.91:1 social card size", () => {
    const og = toOpenGraphImage({
      src: "https://cdn.sanity.io/i/a.jpg",
      alt: "Card",
    });

    expect(og.width).toBe(1200);
    expect(og.height).toBe(630);
    expect(og.alt).toBe("Card");

    const url = new URL(og.url);
    expect(url.searchParams.get("w")).toBe("1200");
    expect(url.searchParams.get("h")).toBe("630");
    expect(url.searchParams.get("fit")).toBe("crop");
    expect(url.searchParams.get("auto")).toBe("format");
  });

  it("replaces existing sizing params rather than appending duplicates", () => {
    const og = toOpenGraphImage({
      src: "https://cdn.sanity.io/i/a.jpg?w=100&h=100&fit=max",
      alt: "Card",
    });
    const url = new URL(og.url);

    expect(url.searchParams.getAll("w")).toEqual(["1200"]);
    expect(url.searchParams.getAll("h")).toEqual(["630"]);
    expect(url.searchParams.get("fit")).toBe("crop");
  });

  it("keeps unrelated query params the CDN was already given", () => {
    const og = toOpenGraphImage({
      src: "https://cdn.sanity.io/i/a.jpg?q=80",
      alt: "Card",
    });

    expect(new URL(og.url).searchParams.get("q")).toBe("80");
  });
});
