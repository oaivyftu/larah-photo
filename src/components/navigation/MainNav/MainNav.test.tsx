import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MainNav } from "./MainNav";

afterEach(cleanup);

const items = [
  { label: "Work", href: "/work" },
  { label: "Service", href: "/service" },
  { label: "About", href: "/about" },
];

describe("MainNav", () => {
  it("is a named landmark, so it can be jumped to", () => {
    render(<MainNav items={items} />);

    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
  });

  it("renders a link per item, in the order given", () => {
    render(<MainNav items={items} />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Work", "Service", "About"],
    );
  });

  it("marks the current page for assistive tech, not just visually", () => {
    // The active state used to be carried by weight and an underline alone,
    // which nothing but an eye can read.
    render(<MainNav activeHref="/service" items={items} />);

    expect(screen.getByRole("link", { name: "Service" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks only the current page", () => {
    render(<MainNav activeHref="/service" items={items} />);

    for (const label of ["Work", "About"]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("marks nothing when the route is not in the nav", () => {
    // A project detail page is under /work but is not itself a nav item.
    render(<MainNav activeHref="/work/harbour-light" items={items} />);

    expect(document.querySelectorAll("[aria-current]")).toHaveLength(0);
  });

  it("gives the active link a modifier class as well as the aria state", () => {
    render(<MainNav activeHref="/work" items={items} />);
    const active = screen.getByRole("link", { name: "Work" });
    const inactive = screen.getByRole("link", { name: "About" });

    expect(active.getAttribute("class")).not.toBe(
      inactive.getAttribute("class"),
    );
  });

  it("carries the label the page transition reads", () => {
    render(<MainNav items={items} />);

    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute(
      "data-transition-label",
      "Work",
    );
  });

  it("renders an empty list rather than failing when there are no items", () => {
    render(<MainNav items={[]} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
  });
});
