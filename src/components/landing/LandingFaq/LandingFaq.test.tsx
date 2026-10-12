import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingFaq } from "./LandingFaq";

afterEach(cleanup);

const faqs = [
  { question: "How long is a session?", answer: "About ninety minutes." },
  { question: "Where do we shoot?", answer: "Wherever feels like you." },
  { question: "When do I get photos?", answer: "Within a few weeks." },
];

function renderFaq() {
  return render(
    <LandingFaq faqs={faqs} heading="Frequently asked questions" />,
  );
}

describe("LandingFaq", () => {
  it("is a section labelled by its heading", () => {
    renderFaq();

    expect(
      screen.getByRole("region", { name: "Frequently asked questions" }),
    ).toBeInTheDocument();
  });

  it("is findable by its identity attribute", () => {
    const { container } = renderFaq();

    expect(container.querySelector("[data-landing-faq]")).toBeInTheDocument();
  });

  it("gives each question an h3 beneath the section's h2", () => {
    renderFaq();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Frequently asked questions",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
    ).toEqual(faqs.map((faq) => faq.question));
  });

  it("shows every answer with no interaction, in the editor's order", () => {
    const { container } = renderFaq();

    expect(
      [...container.querySelectorAll("p")].map((p) => p.textContent),
    ).toEqual(faqs.map((faq) => faq.answer));
  });

  it("hides nothing behind a disclosure widget", () => {
    // A closed <details> removes its answer from the accessibility tree, and
    // a button implies state to keep in step (research.md §9).
    const { container } = renderFaq();

    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
