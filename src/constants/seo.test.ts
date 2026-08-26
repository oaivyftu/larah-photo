import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Everything here is read at module scope from the environment, so each test
// sets the variables it cares about and re-imports.
//
// The guard is the reason this file has tests at all: turning indexing on
// while NEXT_PUBLIC_SITE_URL is still localhost would publish an entire site
// of URLs no crawler can follow, and indexing is the point of no return. It
// throws at module load, which means it fails the build rather than the
// request -- and a check that important should be shown to fail.

const originalEnv = { ...process.env };

async function loadSeo(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  return import("./seo");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("the indexing guard", () => {
  it.each([
    "http://localhost:3000",
    "https://localhost",
    "http://127.0.0.1:3000",
  ])(
    "refuses to load when indexing is on and the site url is still %s",
    async (url) => {
      await expect(
        loadSeo({
          NEXT_PUBLIC_SITE_INDEXABLE: "true",
          NEXT_PUBLIC_SITE_URL: url,
        }),
      ).rejects.toThrow(/NEXT_PUBLIC_SITE_URL to the public origin/);
    },
  );

  it("allows localhost while indexing is off, which is every dev run", async () => {
    const seo = await loadSeo({
      NEXT_PUBLIC_SITE_INDEXABLE: undefined,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    });

    expect(seo.isIndexable).toBe(false);
    expect(seo.siteUrl).toBe("http://localhost:3000");
  });

  it("allows a real origin with indexing on", async () => {
    const seo = await loadSeo({
      NEXT_PUBLIC_SITE_INDEXABLE: "true",
      NEXT_PUBLIC_SITE_URL: "https://larah.photo",
    });

    expect(seo.isIndexable).toBe(true);
  });

  it("is not fooled by a host that merely contains localhost", async () => {
    // `localhost.attacker.com` is a real origin; the guard anchors at the
    // start of the string, so this must load.
    const seo = await loadSeo({
      NEXT_PUBLIC_SITE_INDEXABLE: "true",
      NEXT_PUBLIC_SITE_URL: "https://not-localhost.larah.photo",
    });

    expect(seo.isIndexable).toBe(true);
  });
});

describe("siteUrl", () => {
  it("defaults to localhost when nothing is configured", async () => {
    const seo = await loadSeo({
      NEXT_PUBLIC_SITE_INDEXABLE: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
    });

    expect(seo.siteUrl).toBe("http://localhost:3000");
  });

  it.each([
    ["https://larah.photo/", "https://larah.photo"],
    ["https://larah.photo///", "https://larah.photo"],
    ["https://larah.photo", "https://larah.photo"],
  ])(
    "normalises %s so `${siteUrl}/path` never doubles up",
    async (given, expected) => {
      const seo = await loadSeo({
        NEXT_PUBLIC_SITE_INDEXABLE: undefined,
        NEXT_PUBLIC_SITE_URL: given,
      });

      expect(seo.siteUrl).toBe(expected);
    },
  );
});

describe("absoluteUrl", () => {
  it("builds an absolute url from a site-relative path", async () => {
    const { absoluteUrl } = await loadSeo({
      NEXT_PUBLIC_SITE_URL: "https://larah.photo",
    });

    expect(absoluteUrl("/work")).toBe("https://larah.photo/work");
  });

  it("defaults to the root", async () => {
    const { absoluteUrl } = await loadSeo({
      NEXT_PUBLIC_SITE_URL: "https://larah.photo",
    });

    expect(absoluteUrl()).toBe("https://larah.photo/");
  });

  it("keeps a nested path intact", async () => {
    const { absoluteUrl } = await loadSeo({
      NEXT_PUBLIC_SITE_URL: "https://larah.photo",
    });

    expect(absoluteUrl("/work/harbour-light")).toBe(
      "https://larah.photo/work/harbour-light",
    );
  });
});

describe("pageMetadata", () => {
  async function build(
    input: Parameters<Awaited<ReturnType<typeof loadSeo>>["pageMetadata"]>[0],
  ) {
    const { pageMetadata } = await loadSeo({
      NEXT_PUBLIC_SITE_URL: "https://larah.photo",
    });

    return pageMetadata(input);
  }

  const base = {
    title: "Work",
    description: "Selected projects.",
    path: "/work",
  };

  it("sets a canonical per route, which metadataBase cannot infer", async () => {
    const metadata = await build(base);

    expect(metadata.alternates?.canonical).toBe("/work");
    expect(metadata.openGraph?.url).toBe("/work");
  });

  it("lets the root template append the brand by default", async () => {
    const metadata = await build(base);

    expect(metadata.title).toBe("Work");
  });

  it("opts out of the template when the title already leads with the brand", async () => {
    // Only the home page wants this; otherwise the brand is appended twice.
    const metadata = await build({ ...base, absoluteTitle: true });

    expect(metadata.title).toEqual({ absolute: "Work" });
  });

  it("omits images rather than emitting an empty array when none are given", async () => {
    const metadata = await build(base);

    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("puts a supplied image on both cards", async () => {
    const images = [
      { url: "https://cdn.sanity.io/a.jpg", width: 1200, height: 630 },
    ];
    const metadata = await build({ ...base, images });

    expect(metadata.openGraph).toMatchObject({ images });
    expect(metadata.twitter).toMatchObject({ images });
  });

  it("asks for the large twitter card, which a portfolio wants", async () => {
    const metadata = await build(base);

    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});
