import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Project } from "@/types/project";
import { LandingProjects } from "./LandingProjects";

afterEach(cleanup);

function project(slug: string): Project {
  return {
    id: slug,
    slug,
    title: `Project ${slug}`,
    meta: "Engagement — 2026",
    category: "engagement",
    year: "2026",
    location: "London",
    description: "",
    image: `https://cdn.sanity.io/i/${slug}.jpg`,
    alt: `Photograph ${slug}`,
    width: 1600,
    height: 900,
    images: [],
  };
}

describe("LandingProjects", () => {
  it("shows one card per project, each linking to its project page", () => {
    render(
      <LandingProjects
        heading="Recent work"
        projects={[project("one"), project("two")]}
      />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(2);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/work/one",
      "/work/two",
    ]);
  });

  it("is a section labelled by the settings heading", () => {
    render(
      <LandingProjects heading="Recent work" projects={[project("one")]} />,
    );

    expect(
      screen.getByRole("region", { name: "Recent work" }),
    ).toBeInTheDocument();
  });

  it("renders nothing at all for a category with no projects", () => {
    // Not a heading over an empty frame (spec 014 FR-015).
    const { container } = render(
      <LandingProjects heading="Recent work" projects={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
