import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingCta } from "./LandingCta";

afterEach(cleanup);

const cta = {
  heading: "Ready to talk it through?",
  body: "Send a message with the date you have in mind.",
  contactLabel: "Get in touch",
};

describe("LandingCta", () => {
  it("uses the settings wording", () => {
    render(<LandingCta cta={cta} />);

    expect(
      screen.getByRole("heading", { level: 2, name: cta.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(cta.body)).toBeInTheDocument();
  });

  it("carries its identity hook and reaches the contact page in one link", () => {
    const { container } = render(<LandingCta cta={cta} />);
    const section = container.querySelector("[data-landing-cta]");

    expect(section).not.toBeNull();
    expect(section!.querySelector('a[href="/contact"]')).toHaveTextContent(
      cta.contactLabel,
    );
  });
});
