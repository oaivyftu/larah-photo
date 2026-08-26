import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";
import type { SiteSettings } from "@/types/site";

afterEach(cleanup);

const settings = {
  name: "Larah Photo",
  instagramUrl: "https://instagram.com/larah",
  email: "hi@larah.photo",
  phone: "+1 (555) 010-0100",
  location: "Ontario, Canada",
  priceCurrency: "CAD",
  footerStatement: "Shot on location, printed by hand.",
  navigationItems: [],
} as unknown as SiteSettings;

describe("SiteFooter", () => {
  it("is a contentinfo landmark", () => {
    render(<SiteFooter settings={settings} />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("shows the studio's statement", () => {
    render(<SiteFooter settings={settings} />);

    expect(
      screen.getByText("Shot on location, printed by hand."),
    ).toBeInTheDocument();
  });

  it("makes the email a mailto link", () => {
    render(<SiteFooter settings={settings} />);

    expect(screen.getByRole("link", { name: settings.email })).toHaveAttribute(
      "href",
      "mailto:hi@larah.photo",
    );
  });

  it("strips formatting from the phone number in the tel: href but not on screen", () => {
    // A dialler cannot parse "+1 (555) 010-0100", but a reader wants to.
    render(<SiteFooter settings={settings} />);
    const link = screen.getByRole("link", { name: settings.phone });

    expect(link).toHaveAttribute("href", "tel:+15550100100");
    expect(link).toHaveTextContent("+1 (555) 010-0100");
  });

  it("shows the service area outside the address block", () => {
    // <address> is for ways to reach someone; a service area is not one.
    render(<SiteFooter settings={settings} />);
    const location = screen.getByText("Ontario, Canada");

    expect(location.closest("address")).toBeNull();
  });

  it("keeps the email and phone inside the address block", () => {
    render(<SiteFooter settings={settings} />);

    expect(
      screen.getByRole("link", { name: settings.email }).closest("address"),
    ).not.toBeNull();
  });

  it("opens Instagram safely in a new tab", () => {
    render(<SiteFooter settings={settings} />);
    const link = screen.getByRole("link", { name: "Instagram" });

    expect(link).toHaveAttribute("href", settings.instagramUrl);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("points back to top at the shell's focusable anchor", () => {
    // PageShell carries tabIndex={-1} on #top so focus follows the scroll.
    render(<SiteFooter settings={settings} />);

    expect(screen.getByRole("link", { name: /BACK TO TOP/ })).toHaveAttribute(
      "href",
      "#top",
    );
  });

  it("hides the back-to-top arrow from assistive tech", () => {
    const { container } = render(<SiteFooter settings={settings} />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
