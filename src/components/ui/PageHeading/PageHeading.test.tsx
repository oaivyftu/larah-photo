import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PageHeading } from "./PageHeading";

afterEach(cleanup);

describe("PageHeading", () => {
  it("renders the words as one heading", () => {
    render(<PageHeading words={["Selected", "Work"]} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Selected Work" }),
    ).toBeInTheDocument();
  });

  it("wraps each word in its own span so the intro can reveal them one by one", () => {
    const { container } = render(
      <PageHeading words={["Get", "In", "Touch"]} />,
    );
    const spans = container.querySelectorAll("h1 > span");

    expect(spans).toHaveLength(3);
    expect([...spans].map((span) => span.textContent)).toEqual([
      "Get",
      "In",
      "Touch",
    ]);
  });

  it("carries the hook the GSAP intro selects on", () => {
    const { container } = render(<PageHeading words={["About"]} />);

    expect(container.querySelector("[data-page-heading]")).toBeInTheDocument();
  });

  it("survives a repeated word without a duplicate React key", () => {
    // The key is `${word}-${index}` rather than the word alone, so a title
    // like "Work Work" must still render both spans.
    const { container } = render(<PageHeading words={["Work", "Work"]} />);

    expect(container.querySelectorAll("h1 > span")).toHaveLength(2);
  });

  it("applies an id so a section can be labelled by it", () => {
    render(<PageHeading id="about-title" words={["About"]} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute(
      "id",
      "about-title",
    );
  });

  it("renders nothing inside the heading when given no words", () => {
    const { container } = render(<PageHeading words={[]} />);

    expect(container.querySelectorAll("h1 > span")).toHaveLength(0);
  });
});
