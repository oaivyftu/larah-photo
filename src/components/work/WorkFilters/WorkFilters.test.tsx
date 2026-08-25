import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkFilters } from "./WorkFilters";

const filters = [
  { label: "All", value: "all" },
  { label: "Wedding", value: "wedding" },
  { label: "Editorial", value: "editorial" },
];

afterEach(cleanup);

function renderFilters(activeFilter = "all") {
  const onFilterChange = vi.fn();
  render(
    <WorkFilters
      activeFilter={activeFilter}
      filters={filters}
      onFilterChange={onFilterChange}
    />,
  );
  return { onFilterChange };
}

describe("WorkFilters", () => {
  it("renders a button for every filter", () => {
    renderFilters();

    expect(screen.getAllByRole("button")).toHaveLength(filters.length);
    filters.forEach((filter) => {
      expect(
        screen.getByRole("button", { name: filter.label }),
      ).toBeInTheDocument();
    });
  });

  it("marks only the active filter as pressed", () => {
    renderFilters("wedding");

    expect(screen.getByRole("button", { name: "Wedding" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the clicked filter's value, not its label", () => {
    const { onFilterChange } = renderFilters();

    fireEvent.click(screen.getByRole("button", { name: "Editorial" }));

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith("editorial");
  });

  it("does not fire on render, only on interaction", () => {
    const { onFilterChange } = renderFilters();

    expect(onFilterChange).not.toHaveBeenCalled();
  });

  // Guards the a11y fix the component documents in its own comment: a bare
  // <div> takes no accessible name, so the group role is what carries it
  // (constitution Principle II).
  it("exposes the filter set as a named group", () => {
    renderFilters();

    expect(
      screen.getByRole("group", { name: "Work filters" }),
    ).toBeInTheDocument();
  });

  it("hides the decorative separators from assistive tech", () => {
    const { container } = render(
      <WorkFilters
        activeFilter="all"
        filters={filters}
        onFilterChange={vi.fn()}
      />,
    );

    // One fewer separator than buttons, and none of them announced.
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(filters.length - 1);
  });
});
