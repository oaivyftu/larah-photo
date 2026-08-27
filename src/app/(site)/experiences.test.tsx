import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServicePackage } from "@/types/service";
import type {
  AboutPageContent,
  ContactPageContent,
  ServicePageContent,
} from "@/types/site";

// The About, Contact and Service pages' markup. All three are the same shape --
// a PageHeading, then CMS content -- so they share a file. The page intro is
// mocked out: it is GSAP, and its own behaviour is covered by
// usePageIntro.test.tsx.

vi.mock("@/utils/usePageIntro", async () => {
  const { useRef } = await import("react");

  return { usePageIntro: () => useRef<HTMLElement>(null) };
});

const { AboutExperience } = await import("./about/AboutExperience");
const { ContactExperience } = await import("./contact/ContactExperience");
const { ServiceExperience } = await import("./service/ServiceExperience");

const portrait = {
  src: "https://cdn.sanity.io/portrait.jpg",
  alt: "Larah at work",
  width: 1600,
  height: 900,
};

afterEach(cleanup);

describe("AboutExperience", () => {
  const content = {
    titleWords: ["About", "Larah"],
    portraitOne: portrait,
    story: ["The first paragraph.", "The second paragraph."],
  } as AboutPageContent;

  it("titles the page from the CMS words", () => {
    render(<AboutExperience content={content} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "About Larah" }),
    ).toBeInTheDocument();
  });

  it("renders every paragraph of the story", () => {
    render(<AboutExperience content={content} />);

    for (const paragraph of content.story) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  it("labels the section by its own heading", () => {
    render(<AboutExperience content={content} />);

    expect(
      screen.getByRole("region", { name: "About Larah" }),
    ).toBeInTheDocument();
  });

  it("shows the portrait with the alt text an editor wrote", () => {
    render(<AboutExperience content={content} />);

    expect(
      screen.getByRole("img", { name: "Larah at work" }),
    ).toBeInTheDocument();
  });

  it("renders a one-paragraph story rather than requiring two", () => {
    render(<AboutExperience content={{ ...content, story: ["Only one."] }} />);

    expect(screen.getByText("Only one.")).toBeInTheDocument();
  });
});

describe("ContactExperience", () => {
  const content = { titleWords: ["Get", "In", "Touch"] } as ContactPageContent;
  const contactDetails = {
    email: "hi@larah.photo",
    phone: "+1 (555) 010-0100",
    instagramUrl: "https://instagram.com/larahphoto",
  };

  function renderContact() {
    return render(
      <ContactExperience content={content} contactDetails={contactDetails} />,
    );
  }

  it("titles the page from the CMS words", () => {
    renderContact();

    expect(
      screen.getByRole("heading", { level: 1, name: "Get In Touch" }),
    ).toBeInTheDocument();
  });

  it("names the contact block as its own landmark", () => {
    // It sits inside the titled section, so without its own label a screen
    // reader lists two regions with the same name.
    renderContact();

    expect(
      screen.getByRole("region", { name: "Direct contact" }),
    ).toBeInTheDocument();
  });

  it("makes the email dialable as a mailto link", () => {
    renderContact();

    expect(
      screen.getByRole("link", { name: contactDetails.email }),
    ).toHaveAttribute("href", "mailto:hi@larah.photo");
  });

  it("strips formatting from the tel: href but not from the text", () => {
    renderContact();
    const link = screen.getByRole("link", { name: contactDetails.phone });

    expect(link).toHaveAttribute("href", "tel:+15550100100");
    expect(link).toHaveTextContent("+1 (555) 010-0100");
  });

  it("opens Instagram safely in a new tab", () => {
    renderContact();
    const link = screen.getByRole("link", { name: /larahphoto/ });

    expect(link).toHaveAttribute("href", contactDetails.instagramUrl);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("keeps the reachable details inside an address block", () => {
    renderContact();

    expect(
      screen
        .getByRole("link", { name: contactDetails.email })
        .closest("address"),
    ).not.toBeNull();
  });
});

describe("ServiceExperience", () => {
  const content = { titleWords: ["Session", "Packages"] } as ServicePageContent;

  function servicePackage(
    id: string,
    title: string,
    overrides: Partial<ServicePackage> = {},
  ): ServicePackage {
    return {
      id,
      index: "01",
      title,
      description: `About ${title}.`,
      features: ["Coverage", "Album"],
      price: 900,
      image: "https://cdn.sanity.io/service.jpg",
      imageAlt: `${title} photograph`,
      ctaHref: "/contact",
      ...overrides,
    } as ServicePackage;
  }

  const services = [
    servicePackage("portrait", "Portrait"),
    servicePackage("wedding", "Wedding", { price: 2500 }),
  ];

  it("titles the page from the CMS words", () => {
    render(<ServiceExperience content={content} services={services} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Session Packages" }),
    ).toBeInTheDocument();
  });

  it("names the list of packages as its own landmark", () => {
    render(<ServiceExperience content={content} services={services} />);

    expect(
      screen.getByRole("region", { name: "Photography services" }),
    ).toBeInTheDocument();
  });

  it("gives each package its own h2, below the page title", () => {
    render(<ServiceExperience content={content} services={services} />);

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["Portrait", "Wedding"]);
  });

  it("lists every feature of a package", () => {
    render(<ServiceExperience content={content} services={services} />);

    expect(screen.getAllByText("Coverage")).toHaveLength(services.length);
  });

  it("points each package at its call to action", () => {
    render(<ServiceExperience content={content} services={services} />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/contact");
    }
  });

  it("shows each package's photograph with its own alt text", () => {
    render(<ServiceExperience content={content} services={services} />);

    expect(
      screen.getByRole("img", { name: "Portrait photograph" }),
    ).toBeInTheDocument();
  });

  it("renders the page with no packages published rather than failing", () => {
    render(<ServiceExperience content={content} services={[]} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Session Packages" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
  });
});
