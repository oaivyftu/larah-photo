import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LarahImage } from "./LarahImage";

afterEach(cleanup);

// A thin wrapper over next/image whose only real decision is the placeholder:
// passing `placeholder="blur"` without a blurDataURL makes next/image throw at
// render, so the default has to be derived rather than hardcoded.

const base = {
  alt: "A bride on a clifftop",
  src: "https://cdn.sanity.io/i/a.jpg",
  width: 800,
  height: 600,
};

describe("LarahImage", () => {
  it("renders the image with its alt text", () => {
    render(<LarahImage {...base} />);

    expect(screen.getByRole("img", { name: base.alt })).toBeInTheDocument();
  });

  it("blurs up when a blur placeholder is available", () => {
    render(<LarahImage {...base} blurDataURL="data:image/jpeg;base64,xx" />);

    // next/image applies the blur as an inline background while loading.
    expect(screen.getByRole("img")).toHaveStyle({
      backgroundImage: expect.stringContaining("data:image/jpeg") as never,
    });
  });

  it("falls back to an empty placeholder without one", () => {
    // Not "blur": next/image throws when told to blur with nothing to blur.
    render(<LarahImage {...base} />);

    expect(screen.getByRole("img")).not.toHaveStyle({
      backgroundSize: "cover",
    });
  });

  it("lets a caller override the derived placeholder", () => {
    render(
      <LarahImage
        {...base}
        blurDataURL="data:image/jpeg;base64,xx"
        placeholder="empty"
      />,
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("appends a caller's className without dropping its own", () => {
    render(<LarahImage {...base} className="extra" />);
    const className = screen.getByRole("img").getAttribute("class") ?? "";

    expect(className).toContain("extra");
    expect(className.split(" ").length).toBeGreaterThan(1);
  });

  it("forwards sizes so the browser picks the right source", () => {
    render(<LarahImage {...base} sizes="(max-width: 767px) 47vw, 23vw" />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "sizes",
      "(max-width: 767px) 47vw, 23vw",
    );
  });

  it("drops lazy-loading when the image is marked priority", () => {
    // This Next version omits `loading` entirely rather than setting
    // "eager" -- absent is the HTML default, which is eager. What matters is
    // that an above-the-fold image is not left lazy.
    render(<LarahImage {...base} priority />);

    expect(screen.getByRole("img")).not.toHaveAttribute("loading", "lazy");
  });

  it("lazy-loads by default", () => {
    render(<LarahImage {...base} />);

    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });

  it("keeps an empty alt empty, for a decorative image", () => {
    // Principle II: a decorative image must be hidden, not given filler text.
    render(<LarahImage {...base} alt="" />);

    expect(screen.getByRole("presentation")).toBeInTheDocument();
  });
});
