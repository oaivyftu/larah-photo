import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import { icons } from "@/constants/icons";

afterEach(cleanup);

// Icon is the one primitive whose whole job is an accessibility decision:
// whether the glyph is announced or hidden. Principle II makes that testable
// behaviour rather than styling, so these assert the two modes and the rule
// that decides between them.

describe("Icon", () => {
  it("is hidden from assistive tech by default", () => {
    const { container } = render(<Icon icon={icons.arrowRight} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(svg).not.toHaveAttribute("aria-label");
  });

  it("is announced when given a label", () => {
    render(<Icon aria-label="Next project" icon={icons.arrowRight} />);
    const svg = screen.getByRole("img", { name: "Next project" });

    expect(svg).not.toHaveAttribute("aria-hidden");
  });

  it("stays hidden when labelled but explicitly marked decorative", () => {
    // The explicit prop wins over the label — a caller that passes both is
    // saying the surrounding text already names the control.
    const { container } = render(
      <Icon aria-label="Next" decorative icon={icons.arrowRight} />,
    );

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("is announced when decorative is explicitly false", () => {
    render(
      <Icon aria-label="Menu" decorative={false} icon={icons.arrowRight} />,
    );

    expect(screen.getByRole("img", { name: "Menu" })).toBeInTheDocument();
  });

  it("draws the geometry it was given", () => {
    const { container } = render(<Icon icon={icons.arrowRight} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("viewBox", icons.arrowRight.viewBox);
    expect(svg).toHaveAttribute("data-icon", icons.arrowRight.name);
    expect(container.querySelector("path")).toHaveAttribute(
      "d",
      icons.arrowRight.path,
    );
  });

  it("appends a caller's className without dropping its own", () => {
    const { container } = render(
      <Icon className="extra" icon={icons.arrowRight} />,
    );
    const className = container.querySelector("svg")?.getAttribute("class");

    expect(className).toContain("extra");
    expect(className?.split(" ").length).toBeGreaterThan(1);
  });
});
