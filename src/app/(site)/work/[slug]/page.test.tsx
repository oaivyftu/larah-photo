import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LandingPageLink } from "@/types/landing";
import type { Project } from "@/types/project";

// AGENTS.md has said since feature 009 that async Server Components under
// src/app cannot be unit-tested, and the constitution's Sync Impact Report
// repeats it as a known gap. That is true of `render(<Page />)`, which is
// what React Testing Library offers -- but a Server Component is a function
// that returns a promise of an element, and calling it and awaiting the
// result works fine. Nothing about it needs a server.
//
// What that buys is the last piece of Principle V's second critical flow:
// proof that a page raises or 404s on bad content rather than rendering a
// hollow shell.

const getWorkProjectBySlug = vi.fn<(slug: string) => Promise<Project | null>>();
const getWorkProjectSlugs = vi.fn<() => Promise<string[]>>();
const getLandingPageLinks = vi.fn<() => Promise<LandingPageLink[]>>();
const notFound = vi.fn(() => {
  // The real one throws to unwind the render, and code after the call is
  // unreachable. A mock that returns would let the page carry on with a null
  // project and hide exactly the bug this file is here to catch.
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/sanity/fetchers", () => ({
  getWorkProjectBySlug: (slug: string) => getWorkProjectBySlug(slug),
  getWorkProjectSlugs: () => getWorkProjectSlugs(),
  getLandingPageLinks: () => getLandingPageLinks(),
}));

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const page = await import("./page");
const { WorkDetailGallery } =
  await import("@/components/work/WorkDetailGallery/WorkDetailGallery");

beforeEach(() => {
  getWorkProjectBySlug.mockReset();
  getLandingPageLinks.mockReset();
  getLandingPageLinks.mockResolvedValue([]);
  notFound.mockClear();
});

const project: Project = {
  id: "project-1",
  slug: "harbour-light",
  title: "Harbour Light",
  meta: "Wedding — 2026",
  category: "wedding",
  year: "2026",
  location: "Ontario",
  description: "A coastal wedding at first light.",
  image: "https://cdn.sanity.io/i/a.jpg",
  alt: "A bride on a clifftop",
  width: 1600,
  height: 900,
  images: [],
};

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("work detail page", () => {
  it("404s rather than rendering when the slug is unknown", async () => {
    getWorkProjectBySlug.mockResolvedValue(null);

    await expect(page.default(params("nope"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalled();
  });

  it("lets a content error surface rather than swallowing it into a 404", async () => {
    // A malformed document is not a missing one. Reporting it as 404 would
    // hide broken content behind a page that looks intentionally absent.
    getWorkProjectBySlug.mockRejectedValue(
      new Error('Sanity field "workProject.title" is required.'),
    );

    await expect(page.default(params("harbour-light"))).rejects.toThrow(
      'Sanity field "workProject.title" is required.',
    );
  });

  it("renders the gallery for a project that resolves", async () => {
    getWorkProjectBySlug.mockResolvedValue(project);

    const element = await page.default(params("harbour-light"));

    expect(element).toBeTruthy();
    expect(getWorkProjectBySlug).toHaveBeenCalledWith("harbour-light");
  });
});

/** The gallery element inside the shell, whatever else the page renders. */
function galleryProps(element: ReactElement): Record<string, unknown> {
  const found: Record<string, unknown>[] = [];

  function walk(node: unknown) {
    if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object" && "props" in node) {
      const child = node as ReactElement<{ children?: unknown }>;

      if (child.type === WorkDetailGallery) {
        found.push(child.props as Record<string, unknown>);
      }
      walk(child.props.children);
    }
  }

  walk(element);

  if (found.length !== 1) {
    throw new Error(`expected one WorkDetailGallery, found ${found.length}`);
  }

  return found[0]!;
}

function link(category: string): LandingPageLink {
  return {
    slug: "wedding-photographer-london-ontario",
    href: "/wedding-photographer-london-ontario",
    heading: "Wedding Photographer in London, Ontario",
    packageId: "wedding",
    category,
  };
}

describe("work detail page: the matching landing page", () => {
  it("links a project whose category matches a live page", async () => {
    getWorkProjectBySlug.mockResolvedValue(project);
    getLandingPageLinks.mockResolvedValue([link("Wedding")]);

    const props = galleryProps(await page.default(params("harbour-light")));

    expect(props["landingLink"]).toEqual({
      href: "/wedding-photographer-london-ontario",
      heading: "Wedding Photographer in London, Ontario",
    });
  });

  it("matches ignoring case and spacing", async () => {
    getWorkProjectBySlug.mockResolvedValue({
      ...project,
      category: "graduation",
    });
    getLandingPageLinks.mockResolvedValue([link("Graduation ")]);

    const props = galleryProps(await page.default(params("harbour-light")));

    expect(props["landingLink"]).toBeTruthy();
  });

  it("passes none, and does not error, when no page matches", async () => {
    getWorkProjectBySlug.mockResolvedValue(project);
    getLandingPageLinks.mockResolvedValue([link("portrait")]);

    const props = galleryProps(await page.default(params("harbour-light")));

    expect(props["landingLink"]).toBeUndefined();
  });

  it("changes nothing when no landing page is live", async () => {
    getWorkProjectBySlug.mockResolvedValue(project);
    getLandingPageLinks.mockResolvedValue([]);

    const props = galleryProps(await page.default(params("harbour-light")));

    expect(props["landingLink"]).toBeUndefined();
    expect(props["project"]).toBe(project);
  });

  it("still 404s an unknown project, without reading the landing pages", async () => {
    getWorkProjectBySlug.mockResolvedValue(null);

    await expect(page.default(params("nope"))).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(getLandingPageLinks).not.toHaveBeenCalled();
  });
});

describe("work detail metadata", () => {
  it("marks an unknown project noindex instead of titling the 404 plausibly", async () => {
    getWorkProjectBySlug.mockResolvedValue(null);

    await expect(page.generateMetadata(params("nope"))).resolves.toMatchObject({
      title: "Project not found",
      robots: { index: false },
    });
  });

  it("builds a self-referencing canonical, which the modal route depends on", async () => {
    getWorkProjectBySlug.mockResolvedValue(project);

    const metadata = await page.generateMetadata(params("harbour-light"));

    expect(metadata.alternates?.canonical).toContain("/work/harbour-light");
    expect(metadata.title).toContain("Harbour Light");
  });

  it("crops the social card from the project's own image", async () => {
    getWorkProjectBySlug.mockResolvedValue(project);

    const metadata = await page.generateMetadata(params("harbour-light"));
    const [ogImage] = [metadata.openGraph?.images].flat();

    expect(ogImage).toMatchObject({
      width: 1200,
      height: 630,
      alt: project.alt,
    });
  });
});

describe("generateStaticParams", () => {
  it("turns every published slug into a route param", async () => {
    getWorkProjectSlugs.mockResolvedValue(["harbour-light", "dune-study"]);

    await expect(page.generateStaticParams()).resolves.toEqual([
      { slug: "harbour-light" },
      { slug: "dune-study" },
    ]);
  });

  it("prerenders nothing rather than failing when no project is published", async () => {
    getWorkProjectSlugs.mockResolvedValue([]);

    await expect(page.generateStaticParams()).resolves.toEqual([]);
  });
});
