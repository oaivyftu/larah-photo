import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/constants/seo";
import type { Project } from "@/types/project";
import type { SiteSettings } from "@/types/site";
import {
  businessId,
  buildAboutPageSchema,
  buildBreadcrumbSchema,
  buildBusinessSchema,
  buildContactPageSchema,
  buildProjectSchema,
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
