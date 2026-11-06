import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

afterEach(cleanup);

const props = {
  navigationItems: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
  ],
  siteName: "Larah Photo",
};

describe("SiteHeader", () => {
  it("is a banner landmark", () => {
    render(<SiteHeader {...props} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("names the brand link by the site name, not by the file", () => {
    render(<SiteHeader {...props} />);

    expect(screen.getByRole("link", { name: "Larah Photo" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("loads the logo eagerly, since it is above the fold on every route", () => {
    render(<SiteHeader {...props} />);

    expect(screen.getByRole("img", { name: "Larah Photo" })).toHaveAttribute(
      "loading",
      "eager",
    );
  });

  it("still renders the brand link when the home hero hides it", () => {
    // Hidden by `visibility` in CSS rather than removed, so the markup is the
    // same on every route -- but the element must exist to be hidden.
    render(<SiteHeader {...props} hideBrand />);

    expect(
      screen.getByRole("link", { name: "Larah Photo" }),
    ).toBeInTheDocument();
  });

  it("marks the hidden brand differently from the shown one", () => {
    const { rerender } = render(<SiteHeader {...props} />);
    const shown = screen.getByRole("link", { name: "Larah Photo" }).className;

    rerender(<SiteHeader {...props} hideBrand />);
    const hidden = screen.getByRole("link", { name: "Larah Photo" }).className;

    expect(hidden).not.toBe(shown);
  });

  it("passes the active route through to the nav", () => {
    render(<SiteHeader {...props} activeHref="/about" />);

    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("has no Instagram call to action -- the footer and contact page carry it", () => {
    // Figma's header is the logo and the primary navigation only.
    render(<SiteHeader {...props} />);

    expect(
      screen.queryByRole("link", { name: /Instagram/ }),
    ).not.toBeInTheDocument();
  });

  it("renders the nav even with no navigation items", () => {
    render(<SiteHeader {...props} navigationItems={[]} />);

    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
  });
});
