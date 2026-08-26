import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

afterEach(cleanup);

// Button decides between three elements from one prop shape: a <button> with
// no href, a next/link for a site-relative href, and a plain <a> for anything
// that leaves the site. Getting that wrong is a routing bug, not a styling
// one, so the element each case produces is the thing worth asserting.

describe("Button", () => {
  it("renders a real button when given no href", () => {
    render(<Button>Send</Button>);
    const button = screen.getByRole("button", { name: "Send" });

    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("keeps an explicit type rather than forcing button", () => {
    render(<Button type="submit">Send</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("forwards button props such as disabled and onClick", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Send
      </Button>,
    );
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("routes a site-relative href through the router", () => {
    render(<Button href="/work">Work</Button>);

    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  it.each([
    ["an absolute url", "https://instagram.com/larah"],
    ["a mailto link", "mailto:hello@larah.photo"],
    ["a tel link", "tel:+441234567890"],
    ["a protocol-relative url", "//cdn.example.com/x"],
  ])("leaves the router out of %s", (_case, href) => {
    render(<Button href={href}>Out</Button>);
    const link = screen.getByRole("link", { name: "Out" });

    expect(link).toHaveAttribute("href", href);
  });

  it("forwards anchor props such as target and rel", () => {
    render(
      <Button href="https://example.com" rel="noreferrer" target="_blank">
        Out
      </Button>,
    );
    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("hides the optional icon from assistive tech", () => {
    const { container } = render(<Button withIcon>Next</Button>);
    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    // The icon must not leak into the button's name.
    expect(screen.getByRole("button")).toHaveAccessibleName("Next");
  });

  it("renders no icon by default", () => {
    const { container } = render(<Button>Next</Button>);

    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it.each([
    ["primary", "small"],
    ["secondary", "large"],
  ] as const)("carries the %s / %s variant classes", (variant, size) => {
    render(
      <Button size={size} variant={variant}>
        X
      </Button>,
    );
    const className = screen.getByRole("button").getAttribute("class") ?? "";

    expect(className).toContain(variant);
    expect(className).toContain(size);
  });

  it("appends a caller's className without dropping its own", () => {
    render(<Button className="extra">X</Button>);
    const className = screen.getByRole("button").getAttribute("class") ?? "";

    expect(className).toContain("extra");
    expect(className.split(" ").length).toBeGreaterThan(1);
  });
});
