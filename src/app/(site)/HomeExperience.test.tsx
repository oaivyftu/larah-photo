import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";
import type { ServicePackage } from "@/types/service";
import type { HomePageContent } from "@/types/site";

// The home page's own markup. The scroll-driven choreography over it is GSAP
// and belongs to the E2E feature; what is asserted here is everything the
// choreography decorates -- the copy from Sanity, the landmarks, and the two
// places the page counts things and has to get singular/plural right.

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    timeline: () => ({
      from: vi.fn(),
      to: vi.fn(),
      set: vi.fn(),
      kill: vi.fn(),
    }),
    matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }),
    set: vi.fn(),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));
vi.mock("@gsap/react", () => ({ useGSAP: () => undefined }));

vi.mock("isotope-layout", () => ({
  default: class FakeIsotope {
    arrange() {}
    once(_event: string, callback: () => void) {
      callback();
    }
    destroy() {}
  },
}));

const { HomeExperience } = await import("./HomeExperience");

function image(name: string) {
  return {
    src: `https://cdn.sanity.io/${name}`,
    alt: `Alt for ${name}`,
    width: 1600,
    height: 900,
  };
}

const content = {
  heroTagline: "Photographs that stay with you",
  heroPortraitImage: image("portrait.jpg"),
  heroImage: image("hero.jpg"),
  heroCtaLabel: "See the work",
  heroCtaHref: "/work",
  manifestoWords: ["Light", "Memory", "Motion"],
  manifestoImageOne: image("one.jpg"),
  manifestoImageTwo: image("two.jpg"),
  selectedWorkEyebrow: "Selected work",
  servicesEyebrow: "Session packages",
} as HomePageContent;

function project(id: string): Project {
  return {
    id,
    slug: id,
    title: `Project ${id}`,
    meta: "2026",
    category: "wedding",
    year: "2026",
    location: "Ontario",
    description: "",
    image: image("card.jpg").src,
    alt: `Card ${id}`,
    width: 800,
    height: 600,
    images: [],
  };
}

function service(id: string, title: string): ServicePackage {
  return {
    id,
    index: "01",
    title,
    description: "A description.",
    features: ["One", "Two"],
    price: 900,
    image: image("service.jpg").src,
    imageAlt: "A service",
    ctaHref: "/contact",
  } as ServicePackage;
}

function renderHome(
  overrides: Partial<Parameters<typeof HomeExperience>[0]> = {},
) {
  return render(
    <HomeExperience
      content={content}
      projectCount={4}
      projects={[project("a"), project("b")]}
      services={[service("portrait-session", "Portrait")]}
      siteName="Larah Photo"
      {...overrides}
    />,
  );
}

afterEach(cleanup);

describe("HomeExperience", () => {
  it("carries the tagline as the page's h1", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: /Photographs that stay/ }),
    ).toBeInTheDocument();
  });

  it("names the logo by the site name rather than by the file", () => {
    renderHome();

    expect(
      screen.getByRole("img", { name: "Larah Photo" }),
    ).toBeInTheDocument();
  });

  it("shows the hero call to action from the CMS, not a hardcoded label", () => {
    renderHome();

    expect(screen.getByRole("link", { name: /See the work/ })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  it("hides the manifesto words from assistive tech, being a visual motif", () => {
    // They are three loose words with no sentence around them; read aloud in
    // sequence they say nothing.
    renderHome();
    const motif = screen.getByText("Light").closest("[aria-hidden='true']");

    expect(motif).toBeInTheDocument();
  });

  it("renders all three manifesto words", () => {
    renderHome();

    for (const word of content.manifestoWords) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });

  it("counts the whole portfolio, not just the projects on this page", async () => {
    // The collage shows a curated few; the heading advertises the full body of
    // work, so the count comes from its own prop.
    renderHome({ projectCount: 12, projects: [project("a")] });

    await waitFor(() =>
      expect(document.querySelectorAll("[data-work-card]")).toHaveLength(1),
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "12 Projects",
    );
  });

  it("says Project, singular, for a portfolio of one", () => {
    renderHome({ projectCount: 1 });

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "1 Project",
    );
  });

  it("labels the selected-work section by the CMS eyebrow", () => {
    renderHome();

    expect(
      screen.getByRole("region", { name: "Selected work" }),
    ).toBeInTheDocument();
  });

  it("labels the services section by its own eyebrow", () => {
    renderHome();

    expect(
      screen.getByRole("region", { name: "Session packages" }),
    ).toBeInTheDocument();
  });

  it("renders the featured projects in the collage", async () => {
    renderHome();

    await waitFor(() =>
      expect(document.querySelectorAll("[data-work-card]")).toHaveLength(2),
    );
  });

  it("shows each service package", () => {
    renderHome({
      services: [
        service("portrait-session", "Portrait"),
        service("wedding-session", "Wedding"),
      ],
    });

    expect(screen.getByText("Portrait")).toBeInTheDocument();
    expect(screen.getByText("Wedding")).toBeInTheDocument();
  });

  it("falls back to a generic icon for a package it has no mark for", () => {
    // Service ids come from Sanity, so a new package must not render a hole.
    const { container } = renderHome({
      services: [service("brand-new-session", "Something new")],
    });

    expect(screen.getByText("Something new")).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("renders with no services rather than failing", () => {
    renderHome({ services: [] });

    expect(
      screen.getByRole("region", { name: "Session packages" }),
    ).toBeInTheDocument();
  });

  it("loads the hero images eagerly, being the largest contentful paint", () => {
    renderHome();

    expect(screen.getByRole("img", { name: "Larah Photo" })).toHaveAttribute(
      "loading",
      "eager",
    );
  });
});
