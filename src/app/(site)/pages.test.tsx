import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";
import type { ServicePackage } from "@/types/service";

// The route-level Server Components, tested by calling and awaiting them
// rather than rendering. They are thin -- fetch, then hand data down -- so
// what is worth asserting is the part that is not thin: the metadata each one
// builds, and whether a CMS failure surfaces or gets swallowed.
//
// Every page imports PageShell, which fetches site settings of its own, so the
// fetcher module is mocked once for all of them.

const fetchers = {
  getSiteSettings: vi.fn(),
  getServicePage: vi.fn(),
  getServices: vi.fn(),
  getAboutPage: vi.fn(),
  getWorkPage: vi.fn(),
  getContactPage: vi.fn(),
  getHomePage: vi.fn(),
  getWorkProjects: vi.fn(),
  getWorkProjectBySlug: vi.fn(),
  getWorkProjectSlugs: vi.fn(),
  getFeaturedWorkProjects: vi.fn(),
};

vi.mock("@/sanity/fetchers", () => ({
  SANITY_CACHE_TAG: "sanity",
  ...Object.fromEntries(
    Object.entries(fetchers).map(([name, fn]) => [
      name,
      (...args: unknown[]) => fn(...args),
    ]),
  ),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const image = {
  src: "https://cdn.sanity.io/i/a.jpg",
  alt: "A photograph",
  width: 1600,
  height: 900,
};

const settings = {
  name: "Larah Photo",
  instagramUrl: "https://instagram.com/larah",
  email: "hi@larah.photo",
  phone: "+1 555 0100",
  location: "Ontario",
  priceCurrency: "CAD",
  footerStatement: "Shot on location.",
  navigationItems: [{ label: "Work", href: "/work" }],
};

function servicePackage(
  id: string,
  price: number,
  title: string,
): ServicePackage {
  return {
    id,
    index: "01",
    title,
    description: "",
    features: ["One"],
    price,
    image: image.src,
    imageAlt: image.alt,
    ctaHref: "/contact",
  } as ServicePackage;
}

function project(slug: string): Project {
  return {
    id: slug,
    slug,
    title: `Project ${slug}`,
    meta: "2026",
    category: "wedding",
    year: "2026",
    location: "Ontario",
    description: "",
    image: image.src,
    alt: image.alt,
    width: 1600,
    height: 900,
    images: [],
  };
}

function resetAll(
  overrides: Partial<Record<keyof typeof fetchers, unknown>> = {},
) {
  fetchers.getSiteSettings.mockReset().mockResolvedValue(settings);
  fetchers.getServicePage
    .mockReset()
    .mockResolvedValue({ titleWords: ["Services"] });
  fetchers.getServices.mockReset().mockResolvedValue([]);
  fetchers.getAboutPage.mockReset().mockResolvedValue({
    titleWords: ["About"],
    portraitOne: image,
    story: ["A."],
  });
  fetchers.getWorkPage.mockReset().mockResolvedValue({ titleWords: ["Work"] });
  fetchers.getContactPage
    .mockReset()
    .mockResolvedValue({ titleWords: ["Contact"] });
  fetchers.getWorkProjects.mockReset().mockResolvedValue([]);
  fetchers.getWorkProjectSlugs.mockReset().mockResolvedValue([]);
  fetchers.getFeaturedWorkProjects.mockReset().mockResolvedValue([]);
  notFound.mockClear();

  for (const [name, value] of Object.entries(overrides)) {
    fetchers[name as keyof typeof fetchers].mockResolvedValue(value);
  }
}

describe("service page metadata", () => {
  async function metadata() {
    const page = await import("./service/page");

    return page.generateMetadata();
  }

  it("names the packages and the entry price in the snippet", async () => {
    resetAll({
      getServices: [
        servicePackage("a", 900, "Portrait"),
        servicePackage("b", 2500, "Wedding"),
      ],
    });

    const result = await metadata();

    expect(result.description).toContain("2 options");
    expect(result.description).toContain("Portrait, Wedding");
    expect(result.description).toContain("starting at $900");
  });

  it("falls back to generic copy rather than shipping $Infinity", async () => {
    // Math.min() of nothing is Infinity, which would reach the search snippet
    // if every package were unpublished.
    resetAll({ getServices: [] });

    const result = await metadata();

    expect(result.description).not.toContain("Infinity");
    expect(result.description).toContain("Photography session packages");
  });

  it("omits the social image when there is no package to take one from", async () => {
    resetAll({ getServices: [] });

    const result = await metadata();

    expect(result.openGraph).not.toHaveProperty("images");
  });

  it("uses the first package's photograph as the social card", async () => {
    resetAll({ getServices: [servicePackage("a", 900, "Portrait")] });

    const result = await metadata();

    expect([result.openGraph?.images].flat()[0]).toMatchObject({
      width: 1200,
      height: 630,
    });
  });
});

// The page's own fetcher, not PageShell's: `page.default()` returns JSX with
// <PageShell> still unrendered, so the shell's fetch has not run yet and
// rejecting it would prove nothing about this page.
describe.each([
  ["home", () => import("./page"), "getHomePage"],
  ["about", () => import("./about/page"), "getAboutPage"],
  ["work", () => import("./work/page"), "getWorkPage"],
  ["contact", () => import("./contact/page"), "getContactPage"],
  ["service", () => import("./service/page"), "getServicePage"],
] as const)("%s page", (_name, load, ownFetcher) => {
  it("renders once its content resolves", async () => {
    resetAll({
      getHomePage: {
        heroTagline: "Photographs that stay.",
        heroPortraitImage: image,
        heroImage: image,
        heroCtaLabel: "See the work",
        heroCtaHref: "/work",
        manifestoWords: ["Light", "Time", "Place"],
        manifestoImageOne: image,
        manifestoImageTwo: image,
        selectedWorkEyebrow: "Selected",
        servicesEyebrow: "Services",
      },
    });
    const page = await load();

    await expect(page.default()).resolves.toBeTruthy();
  });

  it("lets a CMS failure surface rather than rendering an empty page", async () => {
    // Principle I: the app raises, it never degrades into a placeholder.
    resetAll();
    fetchers[ownFetcher].mockRejectedValue(
      new Error("Unable to load from Sanity."),
    );
    const page = await load();

    await expect(page.default()).rejects.toThrow("Unable to load from Sanity.");
  });
});

describe("intercepted work detail modal", () => {
  async function load() {
    return import("./@modal/(.)work/[slug]/page");
  }

  it("prerenders one param per project, so a card click does not refetch everything", async () => {
    resetAll({ getWorkProjects: [project("a"), project("b")] });
    const page = await load();

    await expect(page.generateStaticParams()).resolves.toEqual([
      { slug: "a" },
      { slug: "b" },
    ]);
  });

  it("renders the modal for a slug that exists", async () => {
    resetAll({ getWorkProjects: [project("harbour-light")] });
    const page = await load();

    await expect(
      page.default({ params: Promise.resolve({ slug: "harbour-light" }) }),
    ).resolves.toBeTruthy();
  });

  it("404s for a slug that does not", async () => {
    resetAll({ getWorkProjects: [project("harbour-light")] });
    const page = await load();

    await expect(
      page.default({ params: Promise.resolve({ slug: "nope" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});

describe("the other pages' metadata", () => {
  it("titles the home page absolutely, so the brand is not appended twice", async () => {
    resetAll({
      getHomePage: {
        heroTagline: "Photographs that stay.",
        heroPortraitImage: image,
        heroImage: image,
        heroCtaLabel: "See",
        heroCtaHref: "/work",
        manifestoWords: ["A", "B", "C"],
        manifestoImageOne: image,
        manifestoImageTwo: image,
        selectedWorkEyebrow: "Selected",
        servicesEyebrow: "Services",
      },
    });
    const page = await import("./page");

    const metadata = await page.generateMetadata();

    // The `%s | Larah Photo` template would otherwise stutter, since the
    // brand already leads this title.
    expect(metadata.title).toEqual({
      absolute: "Larah Photo — Photographer in Ontario",
    });
  });

  it("counts the galleries in the work page snippet", async () => {
    resetAll({ getWorkProjects: [project("a"), project("b")] });
    const page = await import("./work/page");

    const metadata = await page.generateMetadata();

    expect(metadata.description).toContain("2 galleries");
    // The city is what a local search matches on, so it belongs in the snippet.
    expect(metadata.description).toContain("Ontario");
  });

  it("omits the work social image when nothing is published", async () => {
    resetAll({ getWorkProjects: [] });
    const page = await import("./work/page");

    expect(await page.generateMetadata()).not.toHaveProperty(
      "openGraph.images",
    );
  });

  it("uses the photographer's own opening paragraph for the about snippet", async () => {
    // Not boilerplate: the snippet is what a searcher reads before clicking.
    resetAll({
      getAboutPage: {
        titleWords: ["About"],
        portraitOne: image,
        story: ["I photograph the hour before anyone is ready.", "Second."],
      },
    });
    const page = await import("./about/page");

    const metadata = await page.generateMetadata();

    expect(metadata.description).toBe(
      "I photograph the hour before anyone is ready.",
    );
  });

  it("puts the studio's real contact details in the contact snippet", async () => {
    resetAll();
    const page = await import("./contact/page");

    const metadata = await page.generateMetadata();

    expect(metadata.description).toContain("Ontario");
    expect(metadata.description).toContain("hi@larah.photo");
    expect(metadata.description).toContain("+1 555 0100");
  });
});
