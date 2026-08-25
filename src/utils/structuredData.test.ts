import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/constants/seo";
import type { Project } from "@/types/project";
import {
  businessId,
  buildBreadcrumbSchema,
  buildProjectSchema,
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
