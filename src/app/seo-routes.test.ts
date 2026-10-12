import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JournalPostSummary } from "@/types/journal";
import type { LandingPageSummary } from "@/types/landing";
import type { Project } from "@/types/project";

// robots.ts, sitemap.ts and manifest.ts are the three files nobody looks at
// until a deploy has been indexing the wrong thing for a fortnight. They are
// also pure data, so they are cheap to hold to their intent.
//
// The one that matters most is the indexing switch: `isIndexable` is read at
// module scope from the environment, so each test re-imports after setting it.

const getWorkProjects = vi.fn<() => Promise<Project[]>>();
const getJournalPosts = vi.fn<() => Promise<JournalPostSummary[]>>();
const getLandingPages = vi.fn<() => Promise<LandingPageSummary[]>>();

vi.mock("@/sanity/fetchers", () => ({
  getWorkProjects: () => getWorkProjects(),
  getJournalPosts: () => getJournalPosts(),
  getLandingPages: () => getLandingPages(),
}));

function landingPage(
  slug: string,
  updatedAt = "2026-10-01T12:00:00.000Z",
): LandingPageSummary {
  return {
    slug,
    serviceName: slug,
    category: slug,
    packageId: slug,
    packageImage: {
      src: `https://cdn.sanity.io/${slug}-package.jpg`,
      alt: slug,
      width: 1,
      height: 1,
    },
    updatedAt,
  };
}

function journalPost(
  slug: string,
  bodyImages: string[] = [],
): JournalPostSummary {
  return {
    slug,
    title: slug,
    excerpt: "",
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-10T12:00:00.000Z",
    category: "Location Guide",
    location: "London, Ontario",
    coverImage: {
      src: `https://cdn.sanity.io/${slug}-cover.jpg`,
      alt: slug,
      width: 1,
      height: 1,
    },
    bodyImages: bodyImages.map((src) => ({
      src,
      alt: slug,
      width: 1,
      height: 1,
    })),
  };
}

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
  getJournalPosts.mockReset();
  getJournalPosts.mockResolvedValue([]);
  getLandingPages.mockReset();
  getLandingPages.mockResolvedValue([]);
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
  it("lists the six public routes plus every project", async () => {
    getWorkProjects.mockResolvedValue([project("harbour-light")]);
    const { default: sitemap } = await import("./sitemap");

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual([
      "https://larah.photo/",
      "https://larah.photo/work",
      "https://larah.photo/service",
      "https://larah.photo/about",
      "https://larah.photo/contact",
      "https://larah.photo/journal",
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

    await expect(sitemap()).resolves.toHaveLength(6);
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

describe("sitemap: journal posts", () => {
  beforeEach(() => {
    getWorkProjects.mockResolvedValue([]);
  });

  it("lists every live post at its own URL", async () => {
    getJournalPosts.mockResolvedValue([journalPost("springbank-guide")]);
    const { default: sitemap } = await import("./sitemap");

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://larah.photo/journal/springbank-guide");
  });

  it("carries the cover and body photographs as image entries", async () => {
    getJournalPosts.mockResolvedValue([
      journalPost("springbank-guide", ["https://cdn.sanity.io/river.jpg"]),
    ]);
    const { default: sitemap } = await import("./sitemap");

    const entry = (await sitemap()).find((item) =>
      item.url.endsWith("/journal/springbank-guide"),
    );

    expect(entry?.images).toEqual([
      "https://cdn.sanity.io/springbank-guide-cover.jpg",
      "https://cdn.sanity.io/river.jpg",
    ]);
  });

  it("dates each post by its own last edit, not by the build", async () => {
    // An edited article's freshness is worth telling a crawler about, and
    // Sanity already tracks it (research.md §6).
    getJournalPosts.mockResolvedValue([journalPost("springbank-guide")]);
    const { default: sitemap } = await import("./sitemap");

    const entry = (await sitemap()).find((item) =>
      item.url.endsWith("/journal/springbank-guide"),
    );

    expect(entry?.lastModified).toEqual(new Date("2026-09-10T12:00:00.000Z"));
  });

  it("lists the journal itself even when no post is live", async () => {
    // An empty journal is a valid state, not a missing page (spec 013 Edge
    // Cases), so its index stays discoverable.
    getJournalPosts.mockResolvedValue([]);
    const { default: sitemap } = await import("./sitemap");

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://larah.photo/journal");
  });

  it("lists nothing the query did not return, so scheduled posts stay out", async () => {
    // The schedule is enforced in the query; the sitemap must not add
    // anything of its own on top.
    getJournalPosts.mockResolvedValue([]);
    const { default: sitemap } = await import("./sitemap");

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((url) => url.includes("/journal/"))).toBe(false);
  });
});

describe("sitemap: service landing pages", () => {
  beforeEach(() => {
    getWorkProjects.mockResolvedValue([]);
  });

  it("lists every live page at its own root address", async () => {
    getLandingPages.mockResolvedValue([
      landingPage("portrait-photographer-london-ontario"),
      landingPage("family-photographer-london-ontario"),
    ]);
    const { default: sitemap } = await import("./sitemap");

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain(
      "https://larah.photo/portrait-photographer-london-ontario",
    );
    expect(urls).toContain(
      "https://larah.photo/family-photographer-london-ontario",
    );
  });

  it("carries the package photograph as an image entry", async () => {
    getLandingPages.mockResolvedValue([landingPage("portrait")]);
    const { default: sitemap } = await import("./sitemap");

    const entry = (await sitemap()).find((item) =>
      item.url.endsWith("/portrait"),
    );

    expect(entry?.images).toEqual([
      "https://cdn.sanity.io/portrait-package.jpg",
    ]);
  });

  it("dates each page by its own last edit, not by the build", async () => {
    getLandingPages.mockResolvedValue([
      landingPage("portrait", "2026-10-03T09:30:00.000Z"),
    ]);
    const { default: sitemap } = await import("./sitemap");

    const entry = (await sitemap()).find((item) =>
      item.url.endsWith("/portrait"),
    );

    expect(entry?.lastModified).toEqual(new Date("2026-10-03T09:30:00.000Z"));
  });

  it("does not list a page the query withheld, so held back means absent", async () => {
    // Switched-off pages never leave the query, so the sitemap cannot list
    // them; it adds nothing of its own on top.
    getLandingPages.mockResolvedValue([landingPage("live")]);
    const { default: sitemap } = await import("./sitemap");

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).not.toContain("https://larah.photo/held-back");
  });

  it("leaves the other groups exactly as they were", async () => {
    getWorkProjects.mockResolvedValue([project("harbour-light")]);
    getJournalPosts.mockResolvedValue([journalPost("springbank-guide")]);
    getLandingPages.mockResolvedValue([]);
    const { default: sitemap } = await import("./sitemap");

    expect((await sitemap()).map((entry) => entry.url)).toEqual([
      "https://larah.photo/",
      "https://larah.photo/work",
      "https://larah.photo/service",
      "https://larah.photo/about",
      "https://larah.photo/contact",
      "https://larah.photo/journal",
      "https://larah.photo/work/harbour-light",
      "https://larah.photo/journal/springbank-guide",
    ]);
  });

  it("lets a malformed page fail the sitemap rather than being skipped", async () => {
    // A half-silent failure is worse than a loud one: the page would still
    // 500 on its own URL, and the services page links to it (research §7).
    getLandingPages.mockRejectedValue(
      new Error("Sanity field serviceLandingPage[0]._updatedAt is required."),
    );
    const { default: sitemap } = await import("./sitemap");

    await expect(sitemap()).rejects.toThrow("serviceLandingPage[0]");
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
