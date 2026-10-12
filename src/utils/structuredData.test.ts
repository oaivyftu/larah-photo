import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/constants/seo";
import type { JournalPost } from "@/types/journal";
import type { LandingPage } from "@/types/landing";
import type { Project } from "@/types/project";
import type { SiteSettings } from "@/types/site";
import {
  businessId,
  buildAboutPageSchema,
  buildBreadcrumbSchema,
  buildBusinessSchema,
  buildContactPageSchema,
  buildJournalCollectionSchema,
  buildJournalPostSchema,
  buildLandingFaqSchema,
  buildLandingServiceSchema,
  buildProjectSchema,
  buildStartingPriceOffer,
  buildServiceListSchema,
  buildWebSiteSchema,
  buildWorkCollectionSchema,
  websiteId,
} from "./structuredData";

const project: Project = {
  id: "project-1",
  slug: "harbour-light",
  title: "Harbour Light",
  meta: "Editorial",
  category: "editorial",
  year: "2024",
  location: "Da Nang",
  description: "A dusk shoot along the harbour.",
  image: "https://cdn.sanity.io/images/p/d/cover.jpg",
  alt: "Boats at dusk",
  width: 1600,
  height: 1067,
  images: [
    {
      src: "https://cdn.sanity.io/images/p/d/second.jpg",
      alt: "Rigging detail",
      width: 1200,
      height: 800,
    },
  ],
};

describe("buildBreadcrumbSchema", () => {
  it("numbers positions from 1 and resolves each path to an absolute URL", () => {
    const schema = buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
    ]);

    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: absoluteUrl("/work"),
      },
    ]);
  });

  it("produces an empty trail rather than throwing when given no crumbs", () => {
    expect(buildBreadcrumbSchema([]).itemListElement).toEqual([]);
  });
});

describe("buildProjectSchema", () => {
  it("references the shared business and website @ids rather than restating them", () => {
    const schema = buildProjectSchema(project);

    expect(schema.isPartOf).toEqual({ "@id": websiteId });
    expect(schema.author).toEqual({ "@id": businessId });
    expect(schema.copyrightHolder).toEqual({ "@id": businessId });
  });

  it("anchors @id and url to the project's own route", () => {
    const schema = buildProjectSchema(project);
    const url = absoluteUrl("/work/harbour-light");

    expect(schema.url).toBe(url);
    expect(schema["@id"]).toBe(`${url}#gallery`);
  });

  it("lists the cover image first, then the gallery images", () => {
    const images = buildProjectSchema(project).image as {
      contentUrl: string;
      caption: string;
    }[];

    expect(images.map((image) => image.contentUrl)).toEqual([
      project.image,
      project.images[0].src,
    ]);
    expect(images[0].caption).toBe("Boats at dusk");
  });

  it("promotes a clean four-digit year to datePublished", () => {
    expect(buildProjectSchema(project).datePublished).toBe("2024");
  });

  it("omits datePublished when the CMS year is free text, not a year", () => {
    const schema = buildProjectSchema({ ...project, year: "Summer 2024" });

    expect(schema).not.toHaveProperty("datePublished");
  });

  it("drops empty-string properties instead of asserting them", () => {
    const schema = buildProjectSchema({ ...project, description: "" });

    expect(schema).not.toHaveProperty("description");
  });
});

// ---------------------------------------------------------------------------
// The remaining builders. They were reached only indirectly, through the pages
// that render them, which meant a wrong @id or a dropped field showed up as a
// passing page test and a broken rich result.

const settings = {
  name: "Larah Photo",
  instagramUrl: "https://instagram.com/larah",
  email: "hi@larah.photo",
  phone: "+1 555 0100",
  location: "Ontario, Canada",
  priceCurrency: "CAD",
  footerStatement: "Shot on location.",
  navigationItems: [],
} as unknown as SiteSettings;

describe("buildBusinessSchema", () => {
  it("carries the studio's own contact details", () => {
    const schema = buildBusinessSchema(settings);

    expect(schema).toMatchObject({
      "@type": "ProfessionalService",
      "@id": businessId,
      name: "Larah Photo",
      email: "hi@larah.photo",
      telephone: "+1 555 0100",
      areaServed: "Ontario, Canada",
      sameAs: ["https://instagram.com/larah"],
    });
  });

  it("omits alternateName when the CMS name already matches the site name", () => {
    // Emitting the same string twice tells a crawler the studio trades under
    // two names.
    expect(buildBusinessSchema(settings)).not.toHaveProperty("alternateName");
  });

  it("adds alternateName when the CMS name differs", () => {
    const renamed = { ...settings, name: "Larah Studio" };

    expect(buildBusinessSchema(renamed)).toMatchObject({
      name: "Larah Studio",
      alternateName: "Larah Photo",
    });
  });

  it("adds the Google Business Profile to sameAs once the CMS has one", () => {
    // sameAs is what tells Google the Maps listing and this site are one
    // business, so the reviews on the listing count towards this entity.
    const listed = {
      ...settings,
      googleBusinessUrl: "https://maps.google.com/?cid=1",
    } as unknown as SiteSettings;

    expect(buildBusinessSchema(listed)).toMatchObject({
      sameAs: ["https://instagram.com/larah", "https://maps.google.com/?cid=1"],
    });
  });

  it("omits the address entirely when the CMS has none", () => {
    expect(buildBusinessSchema(settings)).not.toHaveProperty("address");
  });

  it("includes a postal address once there is something in it", () => {
    const located = {
      ...settings,
      postalAddress: { locality: "Toronto", country: "CA" },
    } as unknown as SiteSettings;

    expect(buildBusinessSchema(located)).toMatchObject({
      address: {
        "@type": "PostalAddress",
        addressLocality: "Toronto",
        addressCountry: "CA",
      },
    });
  });

  it("omits an address object that would carry only its @type", () => {
    // An all-blank address block is worse than none: it asserts a location
    // and then describes nothing.
    const blank = {
      ...settings,
      postalAddress: { locality: "", country: "" },
    } as unknown as SiteSettings;

    expect(buildBusinessSchema(blank)).not.toHaveProperty("address");
  });
});

describe("buildWebSiteSchema", () => {
  it("names the business as publisher by reference, not by copy", () => {
    // The business graph is declared once in PageShell; every other graph
    // points at that @id rather than restating it.
    expect(buildWebSiteSchema()).toMatchObject({
      "@type": "WebSite",
      "@id": websiteId,
      publisher: { "@id": businessId },
    });
  });
});

describe("buildServiceListSchema", () => {
  const services = [
    {
      title: "Portrait",
      description: "A sitting.",
      price: 900,
      image: "a.jpg",
    },
    {
      title: "Wedding",
      description: "A full day.",
      price: 2500,
      image: "b.jpg",
    },
  ] as unknown as Parameters<typeof buildServiceListSchema>[0];

  it("numbers the packages from 1, in order", () => {
    const schema = buildServiceListSchema(services, "CAD");

    expect(schema["itemListElement"]).toMatchObject([
      { position: 1, item: { name: "Portrait" } },
      { position: 2, item: { name: "Wedding" } },
    ]);
  });

  it("quotes the price as a lowPrice, not as the price", () => {
    // The CMS field is a starting price and the UI says "From $x". Quoting it
    // as `Offer.price` would make a claim the studio does not.
    const [first] = buildServiceListSchema(services, "CAD")[
      "itemListElement"
    ] as { item: { offers: Record<string, unknown> } }[];

    expect(first?.item.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 900,
      priceCurrency: "CAD",
    });
  });

  it("uses the currency it was given rather than assuming one", () => {
    const [first] = buildServiceListSchema(services, "GBP")[
      "itemListElement"
    ] as { item: { offers: { priceCurrency: string } } }[];

    expect(first?.item.offers.priceCurrency).toBe("GBP");
  });

  it("produces an empty list rather than throwing when nothing is published", () => {
    expect(buildServiceListSchema([], "CAD")["itemListElement"]).toEqual([]);
  });

  it("states the offer exactly as it did before the helper was shared", () => {
    // Pins the literal so extracting `buildStartingPriceOffer` (spec 014)
    // provably changes nothing on the services page.
    const [first] = buildServiceListSchema(services, "CAD")[
      "itemListElement"
    ] as { item: { offers: unknown } }[];

    expect(first?.item.offers).toEqual({
      "@type": "AggregateOffer",
      lowPrice: 900,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
    });
  });
});

describe("buildAboutPageSchema", () => {
  it("joins the story into one description", () => {
    expect(buildAboutPageSchema(["First.", "Second."])).toMatchObject({
      "@type": "AboutPage",
      description: "First. Second.",
      mainEntity: { "@id": businessId },
    });
  });

  it("survives an empty story", () => {
    expect(buildAboutPageSchema([])).toMatchObject({ description: "" });
  });
});

describe("buildContactPageSchema", () => {
  it("describes how to reach the studio, attached to the business @id", () => {
    expect(buildContactPageSchema(settings)).toMatchObject({
      "@type": "ContactPage",
      mainEntity: {
        "@id": businessId,
        contactPoint: {
          contactType: "Booking enquiries",
          email: "hi@larah.photo",
          telephone: "+1 555 0100",
        },
      },
    });
  });
});

describe("buildWorkCollectionSchema", () => {
  const projects = [
    { slug: "harbour-light", title: "Harbour Light" },
    { slug: "dune-study", title: "Dune Study" },
  ] as Parameters<typeof buildWorkCollectionSchema>[0];

  it("states the full set of projects, which the filtered grid does not", () => {
    // The grid is laid out and filtered client-side, so this ItemList is what
    // the server HTML says about the whole collection.
    const schema = buildWorkCollectionSchema(projects);

    expect(schema["mainEntity"]).toMatchObject({
      numberOfItems: 2,
      itemListElement: [
        { position: 1, name: "Harbour Light" },
        { position: 2, name: "Dune Study" },
      ],
    });
  });

  it("gives every project an absolute url", () => {
    const { itemListElement } = buildWorkCollectionSchema(projects)[
      "mainEntity"
    ] as { itemListElement: { url: string }[] };

    for (const entry of itemListElement) {
      expect(entry.url).toMatch(/^https?:\/\/.+\/work\//);
    }
  });

  it("reports zero rather than omitting the count for an empty portfolio", () => {
    expect(buildWorkCollectionSchema([])["mainEntity"]).toMatchObject({
      numberOfItems: 0,
      itemListElement: [],
    });
  });
});

const journalPost: JournalPost = {
  slug: "springbank-engagement-guide",
  title: "Engagement photos at Springbank Park",
  excerpt: "Where to stand, when to go, and what the light does.",
  publishedAt: "2026-09-01",
  updatedAt: "2026-09-10T12:00:00Z",
  category: "Location Guide",
  location: "Springbank Park, London, Ontario",
  coverImage: {
    src: "https://cdn.sanity.io/images/p/d/cover.jpg",
    alt: "Couple on the footbridge",
    width: 1600,
    height: 1067,
  },
  bodyImages: [],
  body: [],
};

describe("buildJournalPostSchema", () => {
  const url = absoluteUrl("/journal/springbank-engagement-guide");

  it("describes the post as a BlogPosting at its own URL", () => {
    expect(buildJournalPostSchema(journalPost)).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: journalPost.title,
      description: journalPost.excerpt,
      url,
      mainEntityOfPage: url,
      inLanguage: "en",
    });
  });

  it("credits the studio by reference instead of restating it", () => {
    const schema = buildJournalPostSchema(journalPost);

    expect(schema["author"]).toEqual({ "@id": businessId });
    expect(schema["publisher"]).toEqual({ "@id": businessId });
    expect(schema["isPartOf"]).toEqual({ "@id": websiteId });
  });

  it("dates the post by the day the editor chose, and its last edit", () => {
    expect(buildJournalPostSchema(journalPost)).toMatchObject({
      datePublished: "2026-09-01",
      dateModified: "2026-09-10T12:00:00Z",
    });
  });

  it("carries the category and the place, which is the local-search point", () => {
    expect(buildJournalPostSchema(journalPost)).toMatchObject({
      articleSection: "Location Guide",
      contentLocation: "Springbank Park, London, Ontario",
      image: journalPost.coverImage.src,
    });
  });

  it("uses the search description when the editor set one", () => {
    expect(
      buildJournalPostSchema({ ...journalPost, seoDescription: "A guide." }),
    ).toMatchObject({ description: "A guide." });
  });

  it("claims nothing empty", () => {
    const values = Object.values(buildJournalPostSchema(journalPost));

    expect(values).not.toContain(undefined);
    expect(values).not.toContain("");
  });
});

describe("buildJournalCollectionSchema", () => {
  const posts = [
    { slug: "springbank-guide", title: "Springbank Park" },
    { slug: "covent-garden-market", title: "Covent Garden Market" },
  ] as Parameters<typeof buildJournalCollectionSchema>[0];

  it("describes the journal as a collection, the way the work index is", () => {
    expect(buildJournalCollectionSchema(posts)).toMatchObject({
      "@type": "CollectionPage",
      url: absoluteUrl("/journal"),
      isPartOf: { "@id": websiteId },
      about: { "@id": businessId },
    });
  });

  it("lists the posts in the order given, newest first as the query returns", () => {
    expect(buildJournalCollectionSchema(posts)["mainEntity"]).toMatchObject({
      "@type": "ItemList",
      numberOfItems: 2,
      itemListElement: [
        {
          position: 1,
          name: "Springbank Park",
          url: absoluteUrl("/journal/springbank-guide"),
        },
        { position: 2, name: "Covent Garden Market" },
      ],
    });
  });

  it("reports zero rather than omitting the count for an empty journal", () => {
    expect(buildJournalCollectionSchema([])["mainEntity"]).toMatchObject({
      numberOfItems: 0,
      itemListElement: [],
    });
  });
});

const landingPage: LandingPage = {
  slug: "engagement-photographer-london-ontario",
  serviceName: "Engagement",
  alternateName: "Pre-wedding",
  category: "Engagement",
  packageId: "engagement",
  packageImage: {
    src: "https://cdn.sanity.io/images/p/d/package.jpg",
    alt: "A couple by the river",
    width: 1600,
    height: 1067,
  },
  updatedAt: "2026-10-01T12:00:00Z",
  introduction: ["First paragraph.", "Second paragraph."],
  sections: [{ heading: "The session", paragraphs: ["What happens."] }],
  faqs: [
    { question: "How long is a session?", answer: "About ninety minutes." },
    { question: "Where do we shoot?", answer: "Wherever feels like you." },
  ],
  seoTitle: "Engagement photographer",
  seoDescription: "Engagement photography.",
  package: {
    id: "engagement",
    index: "02",
    title: "Engagement Session",
    description: "A session.",
    features: ["Coverage"],
    price: 450,
    image: "https://cdn.sanity.io/images/p/d/package.jpg",
    imageAlt: "A couple by the river",
    ctaHref: "/contact",
  },
};

const landingUrl = absoluteUrl("/engagement-photographer-london-ontario");

describe("buildStartingPriceOffer", () => {
  it("quotes a starting price as an AggregateOffer", () => {
    expect(buildStartingPriceOffer(450, "CAD")).toEqual({
      "@type": "AggregateOffer",
      lowPrice: 450,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
    });
  });
});

describe("buildLandingServiceSchema", () => {
  const schema = buildLandingServiceSchema(
    landingPage,
    "London, Ontario",
    "CAD",
  );

  it("is a Service with its own @id", () => {
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${landingUrl}#service`,
      url: landingUrl,
    });
  });

  it("names the service by the editor's service name", () => {
    expect(schema).toMatchObject({
      name: "Engagement",
      serviceType: "Engagement",
    });
  });

  it("declares the alternate name when the editor set one", () => {
    expect(schema["alternateName"]).toBe("Pre-wedding");
  });

  it("describes it with the visible introduction", () => {
    expect(schema["description"]).toBe("First paragraph. Second paragraph.");
  });

  it("uses the package image and the studio's location", () => {
    expect(schema).toMatchObject({
      image: "https://cdn.sanity.io/images/p/d/package.jpg",
      areaServed: "London, Ontario",
    });
  });

  it("refers to the business by @id rather than restating it", () => {
    expect(schema["provider"]).toEqual({ "@id": businessId });
  });

  it("states the price the way the services page does", () => {
    expect(schema["offers"]).toEqual(buildStartingPriceOffer(450, "CAD"));
  });

  it("holds no undefined or empty value", () => {
    for (const value of Object.values(schema)) {
      expect(value).not.toBeUndefined();
      expect(value).not.toBe("");
    }
  });

  it.each([undefined, "", "   "])(
    "leaves alternateName out entirely when it is %j",
    (alternateName) => {
      const bare = buildLandingServiceSchema(
        { ...landingPage, alternateName },
        "London, Ontario",
        "CAD",
      );

      expect("alternateName" in bare).toBe(false);
    },
  );
});

describe("buildLandingFaqSchema", () => {
  const schema = buildLandingFaqSchema(landingPage);

  it("is a FAQPage with its own @id", () => {
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${landingUrl}#faq`,
      url: landingUrl,
    });
  });

  it("has one Question per FAQ, in the editor's order", () => {
    const questions = schema["mainEntity"] as {
      "@type": string;
      name: string;
    }[];

    expect(questions.map((question) => question.name)).toEqual([
      "How long is a session?",
      "Where do we shoot?",
    ]);
    expect(questions.every((q) => q["@type"] === "Question")).toBe(true);
  });

  it("carries each answer byte-for-byte as the page shows it", () => {
    const questions = schema["mainEntity"] as {
      acceptedAnswer: { "@type": string; text: string };
    }[];

    expect(questions.map((question) => question.acceptedAnswer)).toEqual(
      landingPage.faqs.map((faq) => ({ "@type": "Answer", text: faq.answer })),
    );
  });
});
