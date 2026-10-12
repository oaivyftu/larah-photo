import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingSections } from "./LandingSections";

afterEach(cleanup);

const sections = [
  { heading: "The session", paragraphs: ["First.", "Second."] },
  { heading: "Where we shoot", paragraphs: ["Third."] },
];

describe("LandingSections", () => {
  it("gives each section an h2 and renders its paragraphs, in order", () => {
    const { container } = render(<LandingSections sections={sections} />);

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(["The session", "Where we shoot"]);
    expect(
      [...container.querySelectorAll("p")].map((p) => p.textContent),
    ).toEqual(["First.", "Second.", "Third."]);
  });

  it("never renders an h1, which belongs to the page", () => {
    render(<LandingSections sections={sections} />);

    expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(0);
  });

  it("marks each section for the page's entry animation", () => {
    const { container } = render(<LandingSections sections={sections} />);

    expect(container.querySelectorAll("[data-landing-section]")).toHaveLength(
      2,
    );
  });
});
