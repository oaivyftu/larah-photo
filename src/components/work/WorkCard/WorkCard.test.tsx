import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WorkCard } from "./WorkCard";
import {
  getPointerLabel,
  releasePointerLabel,
} from "@/components/ui/GlassPointer/pointerLabelStore";
import type { Project } from "@/types/project";

const project: Project = {
  id: "project-1",
  slug: "harbour-light",
  title: "Harbour Light",
  meta: "Wedding — 2026",
  category: "wedding",
  year: "2026",
  location: "Ontario",
  description: "",
  image: "https://cdn.sanity.io/i/a.jpg",
  imageBlurDataURL: "data:image/jpeg;base64,xx",
  alt: "A bride on a clifftop",
  width: 1600,
  height: 900,
  images: [],
};

beforeEach(() => {
  releasePointerLabel(Symbol("reset"));
});

afterEach(cleanup);

describe("WorkCard", () => {
  it("links to the project by slug", () => {
    render(<WorkCard project={project} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/work/harbour-light",
    );
  });

  it("encodes a slug that needs it, rather than emitting a broken url", () => {
    render(<WorkCard project={{ ...project, slug: "a b/c" }} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/work/a%20b%2Fc");
  });

  it("shows the title and the meta line", () => {
    render(<WorkCard project={project} />);

    expect(screen.getByText("Harbour Light")).toBeInTheDocument();
    expect(screen.getByText("Wedding — 2026")).toBeInTheDocument();
  });

  it("appends a title suffix where the layout asks for one", () => {
    render(<WorkCard project={project} titleSuffix=" ↗" />);

    expect(screen.getByRole("link")).toHaveTextContent("Harbour Light ↗");
  });

  it("carries the category Isotope filters on", () => {
    // The contract with WorkMasonryGrid: the filter predicate reads this
    // attribute off the card element.
    const { container } = render(<WorkCard project={project} />);

    expect(container.querySelector("[data-work-card]")).toHaveAttribute(
      "data-work-category",
      "wedding",
    );
  });

  it("uses the photograph's own alt text", () => {
    render(<WorkCard project={project} />);

    expect(
      screen.getByRole("img", { name: "A bride on a clifftop" }),
    ).toBeInTheDocument();
  });

  it("asks for different image sizes on the homepage than on the index", () => {
    const { rerender } = render(<WorkCard project={project} variant="work" />);
    const work = screen.getByRole("img").getAttribute("sizes");

    rerender(<WorkCard project={project} variant="homepage" />);

    expect(screen.getByRole("img").getAttribute("sizes")).not.toBe(work);
  });

  it("shows the pointer label while a mouse is over the media", () => {
    const { container } = render(<WorkCard project={project} />);
    const media = container.querySelector("span");

    fireEvent.pointerEnter(media!, { pointerType: "mouse" });

    expect(getPointerLabel()).toBe("View");
  });

  it("clears the pointer label on click, so it does not survive the navigation", () => {
    const { container } = render(<WorkCard project={project} />);
    const media = container.querySelector("span");

    fireEvent.pointerEnter(media!, { pointerType: "mouse" });
    fireEvent.click(screen.getByRole("link"));

    expect(getPointerLabel()).toBeNull();
  });

  it("opts out of scroll restoration, because the link opens a modal route", () => {
    const { container } = render(<WorkCard project={project} />);

    expect(container.querySelector("[data-modal-route]")).toBeInTheDocument();
  });
});
