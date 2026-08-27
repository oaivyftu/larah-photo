import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";

// robots.ts, sitemap.ts and manifest.ts are the three files nobody looks at
// until a deploy has been indexing the wrong thing for a fortnight. They are
// also pure data, so they are cheap to hold to their intent.
//
// The one that matters most is the indexing switch: `isIndexable` is read at
// module scope from the environment, so each test re-imports after setting it.

const getWorkProjects = vi.fn<() => Promise<Project[]>>();

vi.mock("@/sanity/fetchers", () => ({
  getWorkProjects: () => getWorkProjects(),
}));

function project(slug: string, images: string[] = []): Project {
  return {
    id: slug,
    slug,
    title: slug,
    meta: "2026",
    category: "wedding",
    year: "2026",
    location: "Ontario",
    description: "",
    image: `https://cdn.sanity.io/${slug}-card.jpg`,
    alt: slug,
    width: 800,
    height: 600,
    images: images.map((src) => ({ src, alt: slug, width: 1, height: 1 })),
  };
}

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  getWorkProjects.mockReset();
  process.env["NEXT_PUBLIC_SITE_URL"] = "https://larah.photo";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("robots", () => {
  it("blocks everything while the site is not marked indexable", async () => {
    // The default. A preview deploy must not be crawlable.
    delete process.env["NEXT_PUBLIC_SITE_INDEXABLE"];
    const { default: robots } = await import("./robots");

    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it.each(["false", "TRUE", "1", "yes", ""])(
    "treats %o as not indexable, since only the exact string true opts in",
    async (value) => {
      process.env["NEXT_PUBLIC_SITE_INDEXABLE"] = value;
      const { default: robots } = await import("./robots");

      expect(robots().rules).toMatchObject({ disallow: "/" });
    },
  );

  it("opens the site and points at the sitemap once indexing is on", async () => {
    process.env["NEXT_PUBLIC_SITE_INDEXABLE"] = "true";
    const { default: robots } = await import("./robots");
    const result = robots();

    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe("https://larah.photo/sitemap.xml");
  });

  it("keeps the studio and the api out of the index", async () => {
    // /studio is a login screen that would otherwise rank for the brand name.
    process.env["NEXT_PUBLIC_SITE_INDEXABLE"] = "true";
    const { default: robots } = await import("./robots");

    expect(robots().rules).toMatchObject({ disallow: ["/studio", "/api/"] });
  });
});

describe("sitemap", () => {
  it("lists the five public routes plus every project", async () => {
    getWorkProjects.mockResolvedValue([project("harbour-light")]);
    const { default: sitemap } = await import("./sitemap");

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual([
      "https://larah.photo/",
      "https://larah.photo/work",
      "https://larah.photo/service",
      "https://larah.photo/about",
      "https://larah.photo/contact",
      "https://larah.photo/work/harbour-light",
    ]);
  });

  it("carries a project's photographs as image entries", async () => {
    // On a portfolio the photographs are the content worth surfacing, and they
    // are otherwise only reachable behind client-side gallery interaction.
    getWorkProjects.mockResolvedValue([
      project("harbour-light", ["https://cdn.sanity.io/one.jpg"]),
    ]);
    const { default: sitemap } = await import("./sitemap");

    const entry = (await sitemap()).at(-1);

    expect(entry?.images).toEqual([
      "https://cdn.sanity.io/harbour-light-card.jpg",
      "https://cdn.sanity.io/one.jpg",
    ]);
  });

  it("still lists the static routes when no project is published", async () => {
    getWorkProjects.mockResolvedValue([]);
    const { default: sitemap } = await import("./sitemap");

    await expect(sitemap()).resolves.toHaveLength(5);
  });

  it("gives every entry a lastModified", async () => {
    getWorkProjects.mockResolvedValue([project("a")]);
    const { default: sitemap } = await import("./sitemap");

    for (const entry of await sitemap()) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it("lets a CMS failure fail the build rather than shipping a partial sitemap", async () => {
    // A sitemap that silently drops every project tells Google the pages are
    // gone. Better to not deploy.
    getWorkProjects.mockRejectedValue(
      new Error("Unable to load work projects"),
    );
    const { default: sitemap } = await import("./sitemap");

    await expect(sitemap()).rejects.toThrow("Unable to load work projects");
  });
});

describe("manifest", () => {
  it("describes the installed app with the site's own name and copy", async () => {
    const { default: manifest } = await import("./manifest");
    const result = manifest();

    expect(result.name).toBe("Larah Photo");
    expect(result.short_name).toBe("Larah Photo");
    expect(result.description).toContain("photography studio");
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
  });

  it("opens on the site's own colours rather than flashing white", async () => {
    const { default: manifest } = await import("./manifest");
    const result = manifest();

    expect(result.background_color).toBe("#ffffff");
    expect(result.theme_color).toBe("#111111");
  });

  it("ships both icon sizes and a maskable variant", async () => {
    const { default: manifest } = await import("./manifest");
    const icons = manifest().icons ?? [];

    expect(icons.map((icon) => icon.sizes)).toEqual([
      "192x192",
      "512x512",
      "512x512",
    ]);
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
  });
});
