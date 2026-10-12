import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ServicePackage } from "@/types/service";
import { LandingPackage } from "./LandingPackage";

afterEach(cleanup);

const servicePackage: ServicePackage = {
  id: "engagement",
  index: "02",
  title: "Engagement Session",
  description: "A relaxed session for two.",
  features: ["Ninety minutes", "Online gallery"],
  price: 450,
  image: "https://cdn.sanity.io/i/package.jpg",
  imageAlt: "A couple by the river",
  ctaHref: "/contact",
};

function renderPackage() {
  return render(
    <LandingPackage
      bookLabel="Reserve this session"
      heading="What's included"
      servicePackage={servicePackage}
    />,
  );
}

describe("LandingPackage", () => {
  it("is a section labelled by the settings heading, with an identity hook", () => {
    const { container } = renderPackage();

    expect(
      screen.getByRole("region", { name: "What's included" }),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-landing-package]")).not.toBeNull();
  });

  it("names the package and describes it", () => {
    renderPackage();

    expect(
      screen.getByRole("heading", { name: "Engagement Session" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A relaxed session for two.")).toBeInTheDocument();
  });

  it("lists every feature and shows the starting price with its label", () => {
    renderPackage();

    for (const feature of servicePackage.features) {
      expect(screen.getByText(feature)).toBeInTheDocument();
    }
    expect(screen.getByText("STARTING FROM")).toBeInTheDocument();
    expect(screen.getByText("$450")).toBeInTheDocument();
  });

  it("shows the image with the editor's alt text", () => {
    renderPackage();

    expect(
      screen.getByRole("img", { name: "A couple by the river" }),
    ).toBeInTheDocument();
  });

  it("books through the package's own link, with the text it is given", () => {
    renderPackage();

    const book = screen.getByRole("link", { name: "Reserve this session" });

    expect(book).toHaveAttribute("href", "/contact");
    expect(book.textContent).toBe("Reserve this session");
  });

  it("carries no booking wording of its own", () => {
    // Principle I: the label is the settings field, so this component holds no
    // string literal for it (research.md §12).
    const source = readFileSync(
      path.resolve(__dirname, "LandingPackage.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/Book now/i);
  });
});
