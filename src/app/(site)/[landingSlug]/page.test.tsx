import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANDING_QUALITY } from "@/constants/landingPage";
import { RESERVED_ROOT_SEGMENTS } from "@/constants/reservedRoutes";
import type { LandingPage, LandingPageSettings } from "@/types/landing";
import type { Project } from "@/types/project";
import type { SiteSettings } from "@/types/site";
import { countWords } from "@/utils/wordCount";

// The landing route, called and awaited the way `journal/[slug]/page.test.tsx`
// and `work/[slug]/page.test.tsx` do. `PageShell` is an async Server Component
// with its own Sanity read and its own test file; Testing Library cannot
// render one nested inside another, so it is replaced with a passthrough whose
// only contract with the page is the variant it asks for.
//
// `notFound` throws, as the real one does. A mock that returned would let a
// page carry on rendering after "not found" and hide the bug.

const getLandingPageBySlug =
  vi.fn<(slug: string) => Promise<LandingPage | null>>();
const getLandingPageSlugs = vi.fn<() => Promise<string[]>>();
const getLandingPageSettings = vi.fn<() => Promise<LandingPageSettings>>();
const getSiteSettings = vi.fn<() => Promise<SiteSettings>>();
const getWorkProjects = vi.fn<() => Promise<Project[]>>();
const shellVariant = vi.fn<(variant: string) => void>();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/sanity/fetchers", () => ({
  getLandingPageBySlug: (slug: string) => getLandingPageBySlug(slug),
  getLandingPageSlugs: () => getLandingPageSlugs(),
  getLandingPageSettings: () => getLandingPageSettings(),
  getSiteSettings: () => getSiteSettings(),
  getWorkProjects: () => getWorkProjects(),
}));

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

vi.mock("@/components/layout/PageShell/PageShell", () => ({
  PageShell: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant: string;
  }) => {
    shellVariant(variant);
    return <main>{children}</main>;
  },
}));

const page = await import("./page");

/** `count` distinct words, so word counts are exact and never accidental. */
function words(count: number, prefix = "word") {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(
    " ",
  );
}

const slug = "engagement-photographer-london-ontario";

/** A page built to exactly `LANDING_QUALITY`'s minimums, and no more. */
const landingPage: LandingPage = {
  slug,
  serviceName: "Engagement",
  category: "Engagement",
  packageId: "engagement",
  packageImage: {
    src: "https://cdn.sanity.io/images/p/d/package.jpg",
    alt: "A couple by the river",
    width: 1600,
    height: 1067,
  },
  updatedAt: "2026-10-01T12:00:00Z",
  introduction: [words(LANDING_QUALITY.introMinWords, "intro")],
  sections: Array.from({ length: LANDING_QUALITY.minSections }, (_, index) => ({
    heading: `Section ${index + 1}`,
    paragraphs: [words(LANDING_QUALITY.sectionMinWords, `sec${index}x`)],
  })),
  faqs: Array.from({ length: LANDING_QUALITY.minFaqs }, (_, index) => ({
    question: `Question ${index + 1}?`,
    answer: words(LANDING_QUALITY.faqAnswerMinWords, `ans${index}x`),
  })),
  seoTitle: "Engagement photographer in London",
  seoDescription: "Engagement photography in London, Ontario.",
  package: {
    id: "engagement",
    index: "02",
    title: "Engagement Session",
    description: "A relaxed session for two.",
    features: ["Ninety minutes", "Online gallery", "Printed keepsake"],
    price: 450,
    image: "https://cdn.sanity.io/images/p/d/package.jpg",
    imageAlt: "A couple by the river",
    ctaHref: "/contact",
  },
};

const settings: LandingPageSettings = {
  headingPattern: "{service} Photographer in {city}",
  projectsHeading: "Recent work",
  packageHeading: "What's included",
  packageBookLabel: "Reserve this session",
  faqHeading: "Frequently asked questions",
  cta: {
    heading: "Ready to talk it through?",
    body: "Send a message with the date you have in mind.",
    contactLabel: "Get in touch",
  },
};

const siteSettings = { location: "London, Ontario" } as SiteSettings;

function project(id: string, category: string): Project {
  return {
    id,
    slug: id,
    title: `Project ${id}`,
    meta: "2026",
    category,
    year: "2026",
    location: "London",
    description: "",
    image: `https://cdn.sanity.io/i/${id}.jpg`,
    alt: `Photograph ${id}`,
    width: 1600,
    height: 900,
    images: [],
  };
}

function params(landingSlug: string) {
  return { params: Promise.resolve({ landingSlug }) };
}

beforeEach(() => {
  for (const mock of [
    getLandingPageBySlug,
    getLandingPageSlugs,
    getLandingPageSettings,
    getSiteSettings,
    getWorkProjects,
    shellVariant,
  ]) {
    mock.mockReset();
  }
  notFound.mockClear();
  getLandingPageSettings.mockResolvedValue(settings);
  getSiteSettings.mockResolvedValue(siteSettings);
  getWorkProjects.mockResolvedValue([]);
});

afterEach(cleanup);

async function renderLanding(
  overrides: Partial<LandingPage> = {},
  projects: Project[] = [],
) {
  getLandingPageBySlug.mockResolvedValue({ ...landingPage, ...overrides });
  getWorkProjects.mockResolvedValue(projects);

  return render(await page.default(params(slug)));
}

function jsonLd(type: string) {
  return [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => JSON.parse(node.innerHTML) as Record<string, unknown>)
    .find((graph) => graph["@type"] === type);
}

function text(element: Element | null) {
  return element?.textContent ?? "";
}

describe("landing page", () => {
  it("renders a root with exactly one h1, named for the service and the city", async () => {
    const { container } = await renderLanding();

    expect(container.querySelector("[data-landing-page]")).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Engagement Photographer in London, Ontario",
    );
  });

  it("lays the page out in order: introduction, sections, projects, package, questions, call to action", async () => {
    const { container } = await renderLanding({}, [
      project("one", "engagement"),
    ]);

    const landmarks = [
      container.querySelector("[data-page-heading]"),
      container.querySelector("[data-landing-intro]"),
      container.querySelector("[data-landing-section]"),
      screen.getByRole("region", { name: settings.projectsHeading }),
      container.querySelector("[data-landing-package]"),
      container.querySelector("[data-landing-faq]"),
      container.querySelector("[data-landing-cta]"),
    ];

    expect(landmarks.every(Boolean)).toBe(true);

    for (let index = 1; index < landmarks.length; index += 1) {
      expect(
        landmarks[index - 1]!.compareDocumentPosition(landmarks[index]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        `landmark ${index} should follow landmark ${index - 1}`,
      ).toBeTruthy();
    }
  });

  it("asks the shell to mark the services section as current", async () => {
    await renderLanding();

    expect(shellVariant).toHaveBeenCalledWith("landing");
  });

  it("books through the settings wording and the package's own link", async () => {
    await renderLanding();

    expect(
      screen.getByRole("link", { name: settings.packageBookLabel }),
    ).toHaveAttribute("href", "/contact");
  });

  it("reaches the contact page from the call to action", async () => {
    const { container } = await renderLanding();

    expect(
      container.querySelector('[data-landing-cta] a[href="/contact"]'),
    ).toHaveTextContent(settings.cta.contactLabel);
  });

  it("shows every matching project", async () => {
    const { container } = await renderLanding({}, [
      project("one", "engagement"),
      project("two", "engagement"),
      project("other", "portrait"),
    ]);

    expect(container.querySelectorAll("[data-work-card]")).toHaveLength(2);
  });

  it("leaves the projects out, and the rest of the page intact, when none match", async () => {
    // A thin or empty category is a valid state (FR-015, SC-005).
    const { container } = await renderLanding({}, [
      project("other", "portrait"),
    ]);

    expect(container.querySelectorAll("[data-work-card]")).toHaveLength(0);
    expect(
      screen.queryByRole("region", { name: settings.projectsHeading }),
    ).toBeNull();
    for (const hook of [
      "[data-landing-intro]",
      "[data-landing-section]",
      "[data-landing-package]",
      "[data-landing-faq]",
      "[data-landing-cta]",
    ]) {
      expect(container.querySelector(hook), hook).not.toBeNull();
    }
  });

  it("matches a project whose category differs only in case or spacing", async () => {
    const { container } = await renderLanding(
      { category: "Family  Sessions" },
      [project("one", "family-sessions"), project("two", "Family Sessions ")],
    );

    expect(container.querySelectorAll("[data-work-card]")).toHaveLength(2);
  });

  it("makes the editor's words the larger share of the page", async () => {
    // FR-042, at a fixture built to exactly the minimums: the package block
    // must not be able to out-talk the editor and turn this into a copy of
    // the services page.
    const { container } = await renderLanding();

    const editorial = [
      "[data-landing-intro]",
      "[data-landing-section]",
      "[data-landing-faq]",
    ]
      .flatMap((selector) => [...container.querySelectorAll(selector)])
      .map(text)
      .join(" ");
    const packageBlock = text(
      container.querySelector("[data-landing-package]"),
    );

    expect(countWords(editorial)).toBeGreaterThan(countWords(packageBlock));
  });

  it("lets a content error surface rather than hiding it as a 404", async () => {
    getLandingPageBySlug.mockRejectedValue(
      new Error('Sanity field "serviceLandingPage("x").seoTitle" is required.'),
    );

    await expect(page.default(params("x"))).rejects.toThrow("is required");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("raises when the settings are missing, as the call to action needs them", async () => {
    getLandingPageBySlug.mockResolvedValue(landingPage);
    getLandingPageSettings.mockRejectedValue(
      new Error('Sanity document "serviceLandingSettings" is required.'),
    );

    await expect(page.default(params(slug))).rejects.toThrow(
      "serviceLandingSettings",
    );
  });
});

describe("landing page: addresses that are not landing pages", () => {
  it.each(["wp-login.php", "Foo", "a_b", ".env", "sitemap.xml"])(
    "404s the malformed segment %j without reading the CMS",
    async (segment) => {
      await expect(page.default(params(segment))).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );

      expect(notFound).toHaveBeenCalled();
      for (const fetcher of [
        getLandingPageBySlug,
        getLandingPageSettings,
        getSiteSettings,
        getWorkProjects,
      ]) {
        expect(fetcher).not.toHaveBeenCalled();
      }
    },
  );

  it.each(RESERVED_ROOT_SEGMENTS)(
    "404s the reserved segment %j without reading the CMS",
    async (segment) => {
      await expect(page.default(params(segment))).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );

      expect(getLandingPageBySlug).not.toHaveBeenCalled();
    },
  );

  it("404s a well-shaped slug no live page owns, and never reads the settings", async () => {
    getLandingPageBySlug.mockResolvedValue(null);

    await expect(page.default(params("pricing"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    expect(getLandingPageBySlug).toHaveBeenCalledWith("pricing");
    expect(getLandingPageSettings).not.toHaveBeenCalled();
    expect(getWorkProjects).not.toHaveBeenCalled();
  });
});

describe("landing page: structured data", () => {
  it("describes itself as a Service, a FAQPage and a Home › Services › page trail", async () => {
    await renderLanding();

    expect(jsonLd("Service")).toMatchObject({
      name: "Engagement",
      areaServed: "London, Ontario",
    });
    expect(jsonLd("FAQPage")).toMatchObject({
      mainEntity: expect.arrayContaining([
        expect.objectContaining({ name: landingPage.faqs[0]!.question }),
      ]),
    });
    expect(jsonLd("BreadcrumbList")).toMatchObject({
      itemListElement: [
        { position: 1, name: "Home" },
        { position: 2, name: "Services" },
        {
          position: 3,
          name: "Engagement Photographer in London, Ontario",
        },
      ],
    });
  });

  it("states each answer in the data exactly as the page shows it", async () => {
    const { container } = await renderLanding();

    const shown = [...container.querySelectorAll("[data-landing-faq] p")].map(
      (node) => node.textContent,
    );
    const declared = (
      jsonLd("FAQPage")!["mainEntity"] as {
        acceptedAnswer: { text: string };
      }[]
    ).map((question) => question.acceptedAnswer.text);

    expect(declared).toEqual(shown);
  });
});

describe("landing page metadata", () => {
  it("uses the editor's search title and description, canonical at its own address", async () => {
    getLandingPageBySlug.mockResolvedValue(landingPage);

    const metadata = await page.generateMetadata(params(slug));

    expect(metadata.title).toBe(landingPage.seoTitle);
    expect(metadata.description).toBe(landingPage.seoDescription);
    expect(metadata.alternates?.canonical).toBe(`/${slug}`);
  });

  it("previews with the package image as the social card", async () => {
    getLandingPageBySlug.mockResolvedValue(landingPage);

    const metadata = await page.generateMetadata(params(slug));
    const [ogImage] = [metadata.openGraph?.images].flat();

    expect(ogImage).toMatchObject({
      alt: landingPage.package.imageAlt,
      width: 1200,
    });
  });

  it("marks a page that is not live noindex rather than titling a 404 plausibly", async () => {
    getLandingPageBySlug.mockResolvedValue(null);

    await expect(page.generateMetadata(params("pricing"))).resolves.toEqual({
      title: "Page not found",
      robots: { index: false },
    });
  });

  it("does the same for a malformed segment, without reading the CMS", async () => {
    await expect(
      page.generateMetadata(params("wp-login.php")),
    ).resolves.toEqual({ title: "Page not found", robots: { index: false } });
    expect(getLandingPageBySlug).not.toHaveBeenCalled();
  });
});

describe("generateStaticParams", () => {
  it("prerenders the live slugs", async () => {
    getLandingPageSlugs.mockResolvedValue([slug]);

    await expect(page.generateStaticParams()).resolves.toEqual([
      { landingSlug: slug },
    ]);
  });

  it("prerenders nothing rather than failing when no page is live", async () => {
    getLandingPageSlugs.mockResolvedValue([]);

    await expect(page.generateStaticParams()).resolves.toEqual([]);
  });
});

describe("landing page: the alternate name", () => {
  const withAlternate = {
    alternateName: "Pre-wedding",
    seoTitle: "Engagement & pre-wedding photographer in London, Ontario",
  };

  it("shows both names in the heading, as separate words with the full string as its name", async () => {
    const { container } = await renderLanding(withAlternate);
    const h1 = screen.getByRole("heading", { level: 1 });

    expect(h1).toHaveAccessibleName(
      "Engagement & Pre-wedding Photographer in London, Ontario",
    );
    expect(h1).toHaveAttribute(
      "aria-label",
      "Engagement & Pre-wedding Photographer in London, Ontario",
    );
    const spans = [...container.querySelectorAll("h1 > span")].map(
      (span) => span.textContent,
    );
    expect(spans).toContain("&");
    expect(spans).toContain("Pre-wedding");
  });

  it("has no ampersand in the heading when there is no alternate name", async () => {
    await renderLanding();

    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toContain(
      "&",
    );
  });

  it("treats a whitespace-only alternate name as unset", async () => {
    await renderLanding({ alternateName: "   " });

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Engagement Photographer in London, Ontario",
    );
    expect(jsonLd("Service")).not.toHaveProperty("alternateName");
  });

  it("declares the name it shows, because both read one field", async () => {
    await renderLanding(withAlternate);

    expect(jsonLd("Service")).toMatchObject({ alternateName: "Pre-wedding" });
    cleanup();

    // Removing it changes the heading and the structured data together.
    await renderLanding({ alternateName: undefined });

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Engagement Photographer in London, Ontario",
    );
    expect(jsonLd("Service")).not.toHaveProperty("alternateName");
  });

  it("names the page by the composed heading in its breadcrumb", async () => {
    await renderLanding(withAlternate);

    expect(jsonLd("BreadcrumbList")).toMatchObject({
      itemListElement: [
        { name: "Home" },
        { name: "Services" },
        { name: "Engagement & Pre-wedding Photographer in London, Ontario" },
      ],
    });
  });

  it("carries the editor's search title, which names both", async () => {
    getLandingPageBySlug.mockResolvedValue({
      ...landingPage,
      ...withAlternate,
    });

    const metadata = await page.generateMetadata(params(slug));

    expect(metadata.title).toBe(withAlternate.seoTitle);
  });

  it("creates no second page for the alternate name", async () => {
    // The Engagement page is the only page for both names; nothing aliases
    // the pre-wedding address (spec 014 Assumptions).
    getLandingPageBySlug.mockResolvedValue(null);

    await expect(
      page.default(params("pre-wedding-photographer-london-ontario")),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
