import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

// The whole point of this file: every CMS read in the app funnels through
// `sanityClient.fetch`, so mocking that one module boundary is enough to
// exercise the fetchers with no network involved (research.md §3).
vi.mock("./client", () => ({
  sanityClient: { fetch: vi.fn() },
}));

// Without this the module reads real env vars, and an unset
// NEXT_PUBLIC_SANITY_PROJECT_ID would short-circuit every fetcher with
// "Sanity is required to load ..." before the mocked client is ever reached.
vi.mock("./env", () => ({
  sanityProjectId: "test-project",
  sanityDataset: "test",
  sanityApiVersion: "2026-07-01",
  isSanityConfigured: true,
}));

const { sanityClient } = await import("./client");

// The real `client.fetch` is generic and heavily overloaded, so its inferred
// return type (`RawQuerylessQueryResponse`) rejects the plain fixture objects
// these tests resolve with. The stub only ever needs to hand back an arbitrary
// shape, so it is narrowed to a bare Mock rather than loosened with `any`
// (constitution Technology Constraints).
const fetchMock = sanityClient.fetch as unknown as Mock;

// `fetchSanityCached` is wrapped in React's `cache()`, so a query already
// resolved in this module instance would be served from memory rather than
// re-entering the mock. Resetting modules per test gives each one a clean
// memo table and a clean mock.
beforeEach(() => {
  fetchMock.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadFetchers() {
  return import("./fetchers");
}

const siteSettingsDoc = {
  name: "Larah Photo",
  instagramUrl: "https://instagram.com/larah",
  email: "hi@larah.photo",
  phone: "+1 555 0100",
  location: "Ontario",
  footerStatement: "Shot on location.",
  navigationItems: [{ label: "Work", href: "/work" }],
};

describe("success path", () => {
  it("maps and filters slugs returned by the CMS", async () => {
    fetchMock.mockResolvedValue(["harbour-light", null, "  ", "dune-study"]);
    const { getWorkProjectSlugs } = await loadFetchers();

    await expect(getWorkProjectSlugs()).resolves.toEqual([
      "harbour-light",
      "dune-study",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("defaults priceCurrency to CAD when the field is absent", async () => {
    fetchMock.mockResolvedValue(siteSettingsDoc);
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).resolves.toMatchObject({
      name: "Larah Photo",
      priceCurrency: "CAD",
    });
  });

  it("passes googleBusinessUrl through when the CMS has one", async () => {
    // Regression: the field was added to the schema, type and GROQ query but
    // never mapped onto the object this function returns, so it silently
    // reached buildBusinessSchema()'s sameAs as undefined despite editors
    // filling it in.
    fetchMock.mockResolvedValue({
      ...siteSettingsDoc,
      googleBusinessUrl: "https://maps.google.com/?cid=1",
    });
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).resolves.toMatchObject({
      googleBusinessUrl: "https://maps.google.com/?cid=1",
    });
  });

  it("leaves googleBusinessUrl undefined for documents that predate it", async () => {
    fetchMock.mockResolvedValue(siteSettingsDoc);
    const { getSiteSettings } = await loadFetchers();

    const settings = await getSiteSettings();

    expect(settings.googleBusinessUrl).toBeUndefined();
  });

  it("returns null for an unknown slug instead of throwing", async () => {
    fetchMock.mockResolvedValue(null);
    const { getWorkProjectBySlug } = await loadFetchers();

    await expect(getWorkProjectBySlug("nope")).resolves.toBeNull();
  });
});

// Constitution Principle I: missing content surfaces as an error, it never
// degrades into a silent fallback or placeholder.
describe("content validation failures surface, never fall back", () => {
  it("throws when a required field is missing", async () => {
    fetchMock.mockResolvedValue({ ...siteSettingsDoc, email: undefined });
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity field "siteSettings.email" is required.',
    );
  });

  it("throws when a required field is present but blank", async () => {
    fetchMock.mockResolvedValue({ ...siteSettingsDoc, name: "   " });
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity field "siteSettings.name" cannot be empty.',
    );
  });

  it("throws when the whole document is missing", async () => {
    fetchMock.mockResolvedValue(null);
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity document "siteSettings" is required.',
    );
  });

  it("throws when a required list is empty", async () => {
    fetchMock.mockResolvedValue({ ...siteSettingsDoc, navigationItems: [] });
    const { getSiteSettings } = await loadFetchers();

    await expect(getSiteSettings()).rejects.toThrow(
      'Sanity field "siteSettings.navigationItems" must contain at least one item.',
    );
  });
});

describe("transport failures are wrapped, not swallowed", () => {
  it("labels which read failed and preserves the original error as cause", async () => {
    const underlying = new Error("ECONNRESET");
    fetchMock.mockRejectedValue(underlying);
    const { getWorkProjects } = await loadFetchers();

    await expect(getWorkProjects()).rejects.toThrow(
      "Unable to load work projects from Sanity.",
    );

    fetchMock.mockRejectedValue(underlying);
    vi.resetModules();
    const { getWorkProjects: retry } = await loadFetchers();
    await expect(retry()).rejects.toMatchObject({ cause: underlying });
  });
});

describe("no real network is reached", () => {
  it("never calls global fetch, only the mocked client", async () => {
    const globalFetch = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValue(["harbour-light"]);
    const { getWorkProjectSlugs } = await loadFetchers();

    await getWorkProjectSlugs();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(globalFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// The rest of Principle V's second critical flow: Sanity content error
// handling. The guards above are proven on `getSiteSettings`; these prove the
// same rule holds for every other read, because "the app raises rather than
// rendering a placeholder" is only true if it is true everywhere. A single
// fetcher that quietly returns a half-built object is the whole principle
// gone.

/** A Sanity image with everything `resolveSanityImage` requires. */
const image = {
  asset: {
    url: "https://cdn.sanity.io/i/a.jpg",
    metadata: { lqip: "data:x", dimensions: { width: 800, height: 600 } },
  },
  alt: "A photograph",
};

const serviceDoc = {
  _id: "service-1",
  index: "01",
  title: "Wedding",
  description: "A full day.",
  features: ["Coverage", "Album"],
  price: 2500,
  image,
  ctaHref: "/contact",
};

const projectDoc = {
  _id: "project-1",
  slug: "harbour-light",
  title: "Harbour Light",
  meta: "2026",
  category: "wedding",
  year: "2026",
  location: "Ontario",
  description: "A coastal wedding.",
  // The card thumbnail is a separate field from the gallery images, and both
  // go through resolveSanityImage.
  cardImage: image,
  images: [image],
};

describe.each([
  ["getAboutPage", "the about page", "aboutPage"],
  ["getWorkPage", "the work page", "workPage"],
  ["getContactPage", "the contact page", "contactPage"],
  ["getServicePage", "the service page", "servicePage"],
  ["getHomePage", "the home page", "homePage"],
] as const)("%s", (name, label, documentName) => {
  it("raises when the document does not exist rather than rendering empty", async () => {
    fetchMock.mockResolvedValue(null);
    const fetchers = await loadFetchers();

    await expect(fetchers[name]()).rejects.toThrow(
      `Sanity document "${documentName}" is required.`,
    );
  });

  it("names the read that failed when the transport breaks", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    const fetchers = await loadFetchers();

    await expect(fetchers[name]()).rejects.toThrow(
      `Unable to load ${label} from Sanity.`,
    );
  });

  it("raises when titleWords is missing", async () => {
    // Every one of these pages renders its title through PageHeading, which
    // would otherwise render an empty <h1>.
    fetchMock.mockResolvedValue({});
    const fetchers = await loadFetchers();

    await expect(fetchers[name]()).rejects.toThrow(/is required|must contain/);
  });
});

describe("getAboutPage", () => {
  it("returns the page when every field is present", async () => {
    fetchMock.mockResolvedValue({
      titleWords: ["About", "Larah"],
      portraitOne: image,
      story: ["A paragraph."],
    });
    const { getAboutPage } = await loadFetchers();

    await expect(getAboutPage()).resolves.toMatchObject({
      titleWords: ["About", "Larah"],
      story: ["A paragraph."],
      portraitOne: { src: image.asset.url, alt: "A photograph" },
    });
  });

  it("raises when the portrait has no alt text", async () => {
    fetchMock.mockResolvedValue({
      titleWords: ["About"],
      portraitOne: { asset: image.asset },
      story: ["A paragraph."],
    });
    const { getAboutPage } = await loadFetchers();

    await expect(getAboutPage()).rejects.toThrow(
      'Sanity image "aboutPage.portraitOne" requires an asset, alt text, and dimensions.',
    );
  });

  it("raises when the story is an array of blanks", async () => {
    fetchMock.mockResolvedValue({
      titleWords: ["About"],
      portraitOne: image,
      story: ["  ", ""],
    });
    const { getAboutPage } = await loadFetchers();

    await expect(getAboutPage()).rejects.toThrow(
      'Sanity field "aboutPage.story" must contain non-empty values.',
    );
  });
});

describe("getHomePage", () => {
  const homeDoc = {
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
  };

  it("returns the page when every field is present", async () => {
    fetchMock.mockResolvedValue(homeDoc);
    const { getHomePage } = await loadFetchers();

    await expect(getHomePage()).resolves.toMatchObject({
      heroTagline: "Photographs that stay.",
      manifestoWords: ["Light", "Time", "Place"],
    });
  });

  it.each([
    [2, ["Light", "Time"]],
    [4, ["A", "B", "C", "D"]],
  ])(
    "raises on %i manifesto words, because the layout is built for three",
    async (_count, manifestoWords) => {
      fetchMock.mockResolvedValue({ ...homeDoc, manifestoWords });
      const { getHomePage } = await loadFetchers();

      await expect(getHomePage()).rejects.toThrow(
        'Sanity field "homePage.manifestoWords" must contain exactly three items.',
      );
    },
  );
});

describe("getServices", () => {
  it("maps a complete service package", async () => {
    fetchMock.mockResolvedValue([serviceDoc]);
    const { getServices } = await loadFetchers();

    await expect(getServices()).resolves.toEqual([
      {
        id: "service-1",
        index: "01",
        title: "Wedding",
        description: "A full day.",
        features: ["Coverage", "Album"],
        price: 2500,
        image: image.asset.url,
        imageBlurDataURL: "data:x",
        imageAlt: "A photograph",
        ctaHref: "/contact",
      },
    ]);
  });

  it("prefers an explicit id over the document id", async () => {
    fetchMock.mockResolvedValue([{ ...serviceDoc, id: "chosen" }]);
    const { getServices } = await loadFetchers();

    await expect(getServices()).resolves.toMatchObject([{ id: "chosen" }]);
  });

  it("returns an empty list when there are no packages", async () => {
    // Not an error: a studio with no packages published yet is a valid state.
    fetchMock.mockResolvedValue([]);
    const { getServices } = await loadFetchers();

    await expect(getServices()).resolves.toEqual([]);
  });

  it.each([
    ["index", "servicePackage[0].index"],
    ["title", "servicePackage[0].title"],
    ["description", "servicePackage[0].description"],
    ["ctaHref", "servicePackage[0].ctaHref"],
  ])(
    "names %s when it is missing, with its position",
    async (field, expected) => {
      fetchMock.mockResolvedValue([{ ...serviceDoc, [field]: undefined }]);
      const { getServices } = await loadFetchers();

      await expect(getServices()).rejects.toThrow(
        `Sanity field "${expected}" is required.`,
      );
    },
  );

  it("points at the offending package when it is not the first", async () => {
    fetchMock.mockResolvedValue([serviceDoc, { ...serviceDoc, title: "  " }]);
    const { getServices } = await loadFetchers();

    await expect(getServices()).rejects.toThrow(
      'Sanity field "servicePackage[1].title" cannot be empty.',
    );
  });

  it("allows a price of zero rather than reading it as absent", async () => {
    // requireValue, not requireString: 0 is a real price for a free consult
    // and must not trip the falsy check.
    fetchMock.mockResolvedValue([{ ...serviceDoc, price: 0 }]);
    const { getServices } = await loadFetchers();

    await expect(getServices()).resolves.toMatchObject([{ price: 0 }]);
  });
});

describe("getWorkProjects", () => {
  it("maps a complete project", async () => {
    fetchMock.mockResolvedValue([projectDoc]);
    const { getWorkProjects } = await loadFetchers();

    await expect(getWorkProjects()).resolves.toMatchObject([
      { slug: "harbour-light", title: "Harbour Light", category: "wedding" },
    ]);
  });

  it("returns an empty list when nothing is published", async () => {
    fetchMock.mockResolvedValue([]);
    const { getWorkProjects } = await loadFetchers();

    await expect(getWorkProjects()).resolves.toEqual([]);
  });

  it("names the offending project by position", async () => {
    fetchMock.mockResolvedValue([projectDoc, { ...projectDoc, title: null }]);
    const { getWorkProjects } = await loadFetchers();

    await expect(getWorkProjects()).rejects.toThrow(/workProject\[1\]/);
  });
});

describe("getWorkProjectBySlug", () => {
  it("maps the project when the slug resolves", async () => {
    fetchMock.mockResolvedValue(projectDoc);
    const { getWorkProjectBySlug } = await loadFetchers();

    await expect(getWorkProjectBySlug("harbour-light")).resolves.toMatchObject({
      slug: "harbour-light",
    });
  });

  it("names the slug in the error when the read fails", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    const { getWorkProjectBySlug } = await loadFetchers();

    await expect(getWorkProjectBySlug("harbour-light")).rejects.toThrow(
      'Unable to load the "harbour-light" work project from Sanity.',
    );
  });

  it("raises when the document resolves but is malformed", async () => {
    // Distinct from an unknown slug, which returns null: this document exists
    // and is broken, so it must not be reported as "not found".
    fetchMock.mockResolvedValue({ ...projectDoc, title: null });
    const { getWorkProjectBySlug } = await loadFetchers();

    await expect(getWorkProjectBySlug("harbour-light")).rejects.toThrow(
      /workProject\("harbour-light"\)/,
    );
  });
});

describe("getWorkProjectSlugs", () => {
  it("returns an empty list rather than raising when there are none", async () => {
    fetchMock.mockResolvedValue([]);
    const { getWorkProjectSlugs } = await loadFetchers();

    await expect(getWorkProjectSlugs()).resolves.toEqual([]);
  });
});

describe("getFeaturedWorkProjects", () => {
  function featured(
    id: string,
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return { ...projectDoc, _id: id, slug: id, title: id, ...overrides };
  }

  it("takes only the projects an editor marked featured", async () => {
    // The homepage collage is curated, not "the most recent few".
    fetchMock.mockResolvedValue([
      featured("a", { featured: true }),
      featured("b", { featured: false }),
      featured("c"),
    ]);
    const { getFeaturedWorkProjects } = await loadFetchers();

    await expect(getFeaturedWorkProjects()).resolves.toMatchObject([
      { slug: "a" },
    ]);
  });

  it("orders them by the curated position, not by document order", async () => {
    fetchMock.mockResolvedValue([
      featured("c", { featured: true, featuredOrder: 3 }),
      featured("a", { featured: true, featuredOrder: 1 }),
      featured("b", { featured: true, featuredOrder: 2 }),
    ]);
    const { getFeaturedWorkProjects } = await loadFetchers();

    const projects = await getFeaturedWorkProjects();
    expect(projects.map((project) => project.slug)).toEqual(["a", "b", "c"]);
  });

  it("puts an unordered project first rather than dropping it", async () => {
    fetchMock.mockResolvedValue([
      featured("b", { featured: true, featuredOrder: 2 }),
      featured("a", { featured: true }),
    ]);
    const { getFeaturedWorkProjects } = await loadFetchers();

    const projects = await getFeaturedWorkProjects();
    expect(projects.map((project) => project.slug)).toEqual(["a", "b"]);
  });

  it("returns an empty collage rather than falling back to everything", async () => {
    // A homepage with nothing curated shows nothing; silently showing all
    // projects would misrepresent an unfinished edit as a choice.
    fetchMock.mockResolvedValue([featured("a"), featured("b")]);
    const { getFeaturedWorkProjects } = await loadFetchers();

    await expect(getFeaturedWorkProjects()).resolves.toEqual([]);
  });
});

describe("slug and span shapes the CMS can return", () => {
  it("accepts a slug object as well as a bare string", async () => {
    // Sanity's slug type is `{ current }`; older documents hold a plain string.
    fetchMock.mockResolvedValue([
      { ...projectDoc, slug: { current: "from-object" } },
    ]);
    const { getWorkProjects } = await loadFetchers();

    await expect(getWorkProjects()).resolves.toMatchObject([
      { slug: "from-object" },
    ]);
  });

  it.each([
    ["full", "full"],
    ["6", 6],
    ["1", 1],
    ["12", 12],
  ])("reads a homepage span of %o as %o", async (given, expected) => {
    fetchMock.mockResolvedValue([{ ...projectDoc, homepageSpan: given }]);
    const { getWorkProjects } = await loadFetchers();

    const [project] = await getWorkProjects();
    expect(project?.placement?.homepageSpan).toBe(expected);
  });

  it.each(["0", "13", "wide", ""])(
    "ignores an out-of-range or unparseable span of %o",
    async (given) => {
      fetchMock.mockResolvedValue([{ ...projectDoc, homepageSpan: given }]);
      const { getWorkProjects } = await loadFetchers();

      const [project] = await getWorkProjects();
      expect(project?.placement?.homepageSpan).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// Journal (spec 013). The same discipline as every other content type: a
// published post missing required data raises and names the field, it never
// renders a placeholder or quietly drops out of the list (FR-025).
// ---------------------------------------------------------------------------

const journalImage = (alt: string) => ({
  alt,
  asset: {
    url: `https://cdn.sanity.io/images/p/d/${alt.replace(/\W/g, "")}.jpg`,
    metadata: { dimensions: { width: 1600, height: 1067 } },
  },
});

// Body members are typed loosely on purpose: the tests below replace single
// members with deliberately broken ones, which a precisely inferred union
// would refuse to compile.
type JournalBodyFixture = Record<string, unknown>;

const journalPostDoc = () => ({
  _updatedAt: "2026-09-10T12:00:00Z",
  slug: { current: "springbank-engagement-guide" },
  title: "Engagement photos at Springbank Park",
  excerpt: "Where to stand, when to go, and what the light does.",
  publishedAt: "2026-09-01",
  category: "Location Guide",
  location: "Springbank Park, London, Ontario",
  coverImage: journalImage("Couple on the footbridge"),
  bodyImages: [journalImage("The river at golden hour")],
  body: <JournalBodyFixture[]>[
    {
      _type: "block",
      _key: "b1",
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s1", text: "Go early.", marks: [] }],
    },
    {
      _type: "bodyImage",
      _key: "i1",
      caption: "The east bank, 7pm in June.",
      ...journalImage("The river at golden hour"),
    },
    {
      _type: "embed",
      _key: "e1",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "A walk along the river path",
    },
  ],
});

const journalPageDoc = {
  titleWords: ["The", "Journal"],
  emptyStateMessage: "New stories are on their way.",
  ctaHeading: "Planning something here?",
  ctaBody: "Tell me about it.",
  ctaContactLabel: "Get in touch",
  ctaWorkLabel: "See the work",
};

describe("getJournalPage", () => {
  it("maps the settings document", async () => {
    fetchMock.mockResolvedValue(journalPageDoc);
    const { getJournalPage } = await loadFetchers();

    await expect(getJournalPage()).resolves.toEqual({
      titleWords: ["The", "Journal"],
      emptyStateMessage: "New stories are on their way.",
      cta: {
        heading: "Planning something here?",
        body: "Tell me about it.",
        contactLabel: "Get in touch",
        workLabel: "See the work",
      },
    });
  });

  it("raises when the document does not exist", async () => {
    fetchMock.mockResolvedValue(null);
    const { getJournalPage } = await loadFetchers();

    await expect(getJournalPage()).rejects.toThrow(
      'Sanity document "journalPage" is required.',
    );
  });

  it.each([
    "emptyStateMessage",
    "ctaHeading",
    "ctaBody",
    "ctaContactLabel",
    "ctaWorkLabel",
  ])("raises, naming the field, when %s is blank", async (field) => {
    fetchMock.mockResolvedValue({ ...journalPageDoc, [field]: "   " });
    const { getJournalPage } = await loadFetchers();

    await expect(getJournalPage()).rejects.toThrow(`journalPage.${field}`);
  });

  it("raises when titleWords is missing", async () => {
    fetchMock.mockResolvedValue({ ...journalPageDoc, titleWords: undefined });
    const { getJournalPage } = await loadFetchers();

    await expect(getJournalPage()).rejects.toThrow("journalPage.titleWords");
  });
});

describe("getJournalPosts", () => {
  it("maps a complete post, resolving images and normalising embeds", async () => {
    fetchMock.mockResolvedValue([journalPostDoc()]);
    const { getJournalPosts } = await loadFetchers();

    const [post] = await getJournalPosts();

    expect(post).toMatchObject({
      slug: "springbank-engagement-guide",
      title: "Engagement photos at Springbank Park",
      publishedAt: "2026-09-01",
      category: "Location Guide",
      location: "Springbank Park, London, Ontario",
      updatedAt: "2026-09-10T12:00:00Z",
      coverImage: { alt: "Couple on the footbridge", width: 1600 },
      bodyImages: [{ alt: "The river at golden hour" }],
    });
  });

  it("returns an empty list rather than raising when nothing is live", async () => {
    // Zero live posts is a valid state (spec Edge Cases), exactly as an empty
    // set of work projects is.
    fetchMock.mockResolvedValue([]);
    const { getJournalPosts } = await loadFetchers();

    await expect(getJournalPosts()).resolves.toEqual([]);
  });

  it.each(["title", "excerpt", "location"])(
    "raises, naming the post by position, when %s is blank",
    async (field) => {
      fetchMock.mockResolvedValue([
        journalPostDoc(),
        { ...journalPostDoc(), [field]: " " },
      ]);
      const { getJournalPosts } = await loadFetchers();

      await expect(getJournalPosts()).rejects.toThrow(
        `journalPost[1].${field}`,
      );
    },
  );

  it("raises when the slug is missing", async () => {
    fetchMock.mockResolvedValue([{ ...journalPostDoc(), slug: undefined }]);
    const { getJournalPosts } = await loadFetchers();

    await expect(getJournalPosts()).rejects.toThrow("journalPost[0].slug");
  });

  it("raises on a category outside the fixed list", async () => {
    // FR-003: the list is fixed so "Weddings" cannot quietly become a second
    // category. A value that got past the Studio is a content error.
    fetchMock.mockResolvedValue([
      { ...journalPostDoc(), category: "Weddings" },
    ]);
    const { getJournalPosts } = await loadFetchers();

    await expect(getJournalPosts()).rejects.toThrow("journalPost[0].category");
  });

  it("raises on a published date that is not a calendar date", async () => {
    fetchMock.mockResolvedValue([
      { ...journalPostDoc(), publishedAt: "2026-09-01T10:00:00Z" },
    ]);
    const { getJournalPosts } = await loadFetchers();

    await expect(getJournalPosts()).rejects.toThrow(
      "journalPost[0].publishedAt",
    );
  });

  it("raises when the cover has no alt text", async () => {
    fetchMock.mockResolvedValue([
      { ...journalPostDoc(), coverImage: journalImage("") },
    ]);
    const { getJournalPosts } = await loadFetchers();

    await expect(getJournalPosts()).rejects.toThrow(
      "journalPost[0].coverImage",
    );
  });
});

describe("getJournalPostBySlug", () => {
  it("returns null for an unknown or scheduled slug instead of throwing", async () => {
    // The live-post predicate lives in the query, so a scheduled post comes
    // back from Sanity exactly as an unknown one does: as nothing.
    fetchMock.mockResolvedValue(null);
    const { getJournalPostBySlug } = await loadFetchers();

    await expect(getJournalPostBySlug("not-yet")).resolves.toBeNull();
  });

  it("maps the body: blocks pass through, images resolve, embeds normalise", async () => {
    fetchMock.mockResolvedValue(journalPostDoc());
    const { getJournalPostBySlug } = await loadFetchers();

    const post = await getJournalPostBySlug("springbank-engagement-guide");

    expect(post?.body).toEqual([
      expect.objectContaining({ _type: "block", _key: "b1" }),
      {
        _type: "bodyImage",
        _key: "i1",
        caption: "The east bank, 7pm in June.",
        image: expect.objectContaining({ alt: "The river at golden hour" }),
      },
      {
        _type: "embed",
        _key: "e1",
        provider: "youtube",
        src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        title: "A walk along the river path",
      },
    ]);
  });

  it("leaves a caption out when the editor did not write one", async () => {
    const doc = journalPostDoc();
    doc.body[1] = { ...doc.body[1], caption: undefined };
    fetchMock.mockResolvedValue(doc);
    const { getJournalPostBySlug } = await loadFetchers();

    const post = await getJournalPostBySlug("springbank-engagement-guide");

    expect(post?.body[1]).not.toHaveProperty("caption");
  });

  it("raises on a body image without alt text, naming its position", async () => {
    const doc = journalPostDoc();
    doc.body[1] = { ...doc.body[1], alt: "" };
    fetchMock.mockResolvedValue(doc);
    const { getJournalPostBySlug } = await loadFetchers();

    await expect(
      getJournalPostBySlug("springbank-engagement-guide"),
    ).rejects.toThrow('journalPost("springbank-engagement-guide").body[1]');
  });

  it("raises on an embed from a provider outside the allow-list", async () => {
    // FR-002b: refused at publish time in the Studio, and refused again here
    // in case one ever reaches the site — an unknown third party's frame is
    // never rendered.
    const doc = journalPostDoc();
    doc.body[2] = {
      ...doc.body[2],
      url: "https://www.dailymotion.com/video/x7tgad0",
    };
    fetchMock.mockResolvedValue(doc);
    const { getJournalPostBySlug } = await loadFetchers();

    await expect(
      getJournalPostBySlug("springbank-engagement-guide"),
    ).rejects.toThrow('journalPost("springbank-engagement-guide").body[2].url');
  });

  it("raises on an embed with no description", async () => {
    const doc = journalPostDoc();
    doc.body[2] = { ...doc.body[2], title: " " };
    fetchMock.mockResolvedValue(doc);
    const { getJournalPostBySlug } = await loadFetchers();

    await expect(
      getJournalPostBySlug("springbank-engagement-guide"),
    ).rejects.toThrow(
      'journalPost("springbank-engagement-guide").body[2].title',
    );
  });

  it("raises when the body is empty", async () => {
    fetchMock.mockResolvedValue({ ...journalPostDoc(), body: [] });
    const { getJournalPostBySlug } = await loadFetchers();

    await expect(
      getJournalPostBySlug("springbank-engagement-guide"),
    ).rejects.toThrow('journalPost("springbank-engagement-guide").body');
  });

  it("treats blank SEO overrides as unset so the fallback applies", async () => {
    fetchMock.mockResolvedValue({
      ...journalPostDoc(),
      seoTitle: "   ",
      seoDescription: undefined,
    });
    const { getJournalPostBySlug } = await loadFetchers();

    const post = await getJournalPostBySlug("springbank-engagement-guide");

    expect(post?.seoTitle).toBeUndefined();
    expect(post?.seoDescription).toBeUndefined();
  });

  it("keeps SEO overrides the editor did set, trimmed", async () => {
    fetchMock.mockResolvedValue({
      ...journalPostDoc(),
      seoTitle: " Springbank Park engagement photos ",
      seoDescription: "A local guide.",
    });
    const { getJournalPostBySlug } = await loadFetchers();

    const post = await getJournalPostBySlug("springbank-engagement-guide");

    expect(post).toMatchObject({
      seoTitle: "Springbank Park engagement photos",
      seoDescription: "A local guide.",
    });
  });
});

describe("getJournalPostSlugs", () => {
  it("returns an empty list rather than raising when there are none", async () => {
    fetchMock.mockResolvedValue([]);
    const { getJournalPostSlugs } = await loadFetchers();

    await expect(getJournalPostSlugs()).resolves.toEqual([]);
  });
});

describe("the journal schedule is applied to every journal read", () => {
  // FR-007a: `$today` is what keeps a scheduled post off the site. If one
  // fetcher forgot to pass it, that query would fail in GROQ — or, worse, a
  // future query written without the shared fragment would leak the post.
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["getJournalPosts", [] as unknown[], []],
    ["getJournalPostSlugs", [], []],
    ["getJournalPostBySlug", null, ["springbank-engagement-guide"]],
  ] as const)(
    "%s passes today's date in the studio's time zone",
    async (name, resolved, args) => {
      vi.useFakeTimers({ toFake: ["Date"] });
      // Already the 16th in UTC, still the 15th in Toronto.
      vi.setSystemTime(new Date("2026-09-16T03:30:00Z"));
      fetchMock.mockResolvedValue(resolved);
      const fetchers = await loadFetchers();

      await (fetchers[name] as (...a: string[]) => Promise<unknown>)(...args);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("publishedAt <= $today"),
        expect.objectContaining({ today: "2026-09-15" }),
        expect.anything(),
      );
    },
  );
});
