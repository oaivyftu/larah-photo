import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import NotFound, { metadata } from "./not-found";

afterEach(cleanup);

// The one page that must render during a CMS outage, because a CMS outage is
// exactly when it gets hit: every other route reads Sanity, and a fetcher that
// throws lands the visitor here. A single Sanity import in this file would
// make the 404 page fail for the same reason the real page did.

describe("NotFound", () => {
  it("renders without any CMS data at all", () => {
    // No fetcher is mocked in this file, so an accidental Sanity import would
    // reach the real client and this would fail.
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("says what happened in words, not just a code", () => {
    render(<NotFound />);

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "This page is no longer here",
    );
  });

  it("explains why the link might be dead", () => {
    render(<NotFound />);

    expect(screen.getByText(/retired from the portfolio/)).toBeInTheDocument();
  });

  it("offers a way out to both the home page and the work index", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: /Back to home/ })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /Browse work/ })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  it("keeps the button icons out of the link names", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("link", { name: "Back to home" }),
    ).toBeInTheDocument();
  });
});

describe("not-found metadata", () => {
  it("keeps a soft 404 out of the index", () => {
    // Next already answers 404, which is what crawlers act on. This covers the
    // case where one arrives through a stale link and files the page anyway.
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("still lets crawlers follow the way-out links", () => {
    expect(metadata.robots).toMatchObject({ follow: true });
  });

  it("titles the page for a human reading a tab", () => {
    expect(metadata.title).toBe("Page not found");
  });
});

describe("no CMS dependency", () => {
  it("imports nothing from the Sanity layer", async () => {
    // Structural rather than behavioural: the render test above would only
    // catch an import that throws, and the client does not throw on import.
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    // Resolved from the project root: under jsdom `import.meta.url` is not a
    // file: URL, the same reason breakpoints.test.ts resolves this way.
    const source = readFileSync(
      resolve(process.cwd(), "src/app/not-found.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["']@\/sanity/);
  });
});
