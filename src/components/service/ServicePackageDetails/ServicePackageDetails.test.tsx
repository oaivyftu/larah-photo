import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ServicePackageDetails } from "./ServicePackageDetails";

afterEach(cleanup);

describe("ServicePackageDetails", () => {
  it("lists every feature", () => {
    render(
      <ServicePackageDetails features={["Coverage", "Album"]} price={900} />,
    );

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Coverage", "Album"]);
  });

  it("shows the starting price with its label", () => {
    render(<ServicePackageDetails features={["Coverage"]} price={900} />);

    expect(screen.getByText("STARTING FROM")).toBeInTheDocument();
    expect(screen.getByText("$900")).toBeInTheDocument();
  });

  it("renders one root element so a caller can place it in a grid", () => {
    const { container } = render(
      <ServicePackageDetails
        className="placement"
        features={["A"]}
        price={1}
      />,
    );

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toHaveClass("placement");
  });
});
