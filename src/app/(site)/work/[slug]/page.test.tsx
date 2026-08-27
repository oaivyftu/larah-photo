import { describe, expect, it, vi } from "vitest";
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
const notFound = vi.fn(() => {
  // The real one throws to unwind the render, and code after the call is
  // unreachable. A mock that returns would let the page carry on with a null
  // project and hide exactly the bug this file is here to catch.
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/sanity/fetchers", () => ({
  getWorkProjectBySlug: (slug: string) => getWorkProjectBySlug(slug),
  getWorkProjectSlugs: () => getWorkProjectSlugs(),
}));

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const page = await import("./page");

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
