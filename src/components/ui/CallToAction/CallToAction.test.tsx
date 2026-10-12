import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CallToAction } from "./CallToAction";

afterEach(cleanup);

function renderCta(props: Partial<Parameters<typeof CallToAction>[0]> = {}) {
  return render(
    <CallToAction
      body="Tell me about your plans."
      heading="Planning something?"
      headingId="cta-heading"
      {...props}
    >
      <button type="button">Get in touch</button>
    </CallToAction>,
  );
}

describe("CallToAction", () => {
  it("is a region labelled by its heading", () => {
    renderCta();

    const region = screen.getByRole("region", { name: "Planning something?" });

    expect(region).toHaveAttribute("aria-labelledby", "cta-heading");
    expect(
      screen.getByRole("heading", { level: 2, name: "Planning something?" }),
    ).toHaveAttribute("id", "cta-heading");
  });

  it("shows its body text", () => {
    renderCta();

    expect(screen.getByText("Tell me about your plans.")).toBeInTheDocument();
  });

  it("renders its children in the actions row", () => {
    renderCta();

    expect(
      screen.getByRole("button", { name: "Get in touch" }),
    ).toBeInTheDocument();
  });

  it("passes className and data attributes to the section", () => {
    const { container } = renderCta({
      className: "placement",
      "data-landing-cta": "",
    } as never);

    const section = container.querySelector("section")!;

    expect(section).toHaveClass("placement");
    expect(section).toHaveAttribute("data-landing-cta");
  });
});
