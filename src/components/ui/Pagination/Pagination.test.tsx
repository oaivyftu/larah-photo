import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Pagination } from "./Pagination";

afterEach(cleanup);

const hrefForPage = (page: number) =>
  page === 1 ? "/journal" : `/journal/page/${page}`;

function renderPagination(currentPage: number, totalPages: number) {
  return render(
    <Pagination
      currentPage={currentPage}
      hrefForPage={hrefForPage}
      label="Journal pages"
      totalPages={totalPages}
    />,
  );
}

// Read from the DOM, not the accessibility tree: the ellipses are hidden from
// it on purpose, and are exactly what these cases need to see.
function pageNumbers() {
  return [...screen.getByRole("navigation").querySelectorAll("li")]
    .map((item) => item.textContent)
    .filter((text) => text && /^(\d+|…)$/.test(text));
}

describe("Pagination", () => {
  it("renders nothing for a single page, so the caller can always mount it", () => {
    const { container } = renderPagination(1, 1);

    expect(container).toBeEmptyDOMElement();
  });

  it("is a landmark with the name it was given", () => {
    renderPagination(1, 3);

    expect(
      screen.getByRole("navigation", { name: "Journal pages" }),
    ).toBeInTheDocument();
  });

  it("marks the current page for assistive technology, and does not link it", () => {
    renderPagination(2, 3);

    const current = screen.getByText("2");

    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.closest("a")).toBeNull();
    expect(current).toHaveAccessibleName("Page 2, current page");
  });

  it("links every other page by its own address", () => {
    renderPagination(2, 3);

    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "href",
      "/journal",
    );
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute(
      "href",
      "/journal/page/3",
    );
  });

  it("offers Next but not Previous on the first page", () => {
    renderPagination(1, 3);

    expect(screen.queryByRole("link", { name: "Previous page" })).toBeNull();
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/journal/page/2",
    );
  });

  it("offers Previous but not Next on the last page", () => {
    renderPagination(3, 3);

    expect(screen.queryByRole("link", { name: "Next page" })).toBeNull();
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/journal/page/2",
    );
  });

  it("tells search engines which way the sequence runs", () => {
    renderPagination(2, 3);

    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "rel",
      "prev",
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "rel",
      "next",
    );
  });

  it("lists every page when there are few", () => {
    renderPagination(1, 7);

    expect(pageNumbers()).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });

  describe("with many pages", () => {
    it("collapses the far end near the start", () => {
      renderPagination(2, 20);

      expect(pageNumbers()).toEqual(["1", "2", "3", "4", "…", "20"]);
    });

    it("collapses the near end near the finish", () => {
      renderPagination(19, 20);

      expect(pageNumbers()).toEqual(["1", "…", "17", "18", "19", "20"]);
    });

    it("keeps a neighbour on each side of a middle page and both ends", () => {
      renderPagination(10, 20);

      expect(pageNumbers()).toEqual(["1", "…", "9", "10", "11", "…", "20"]);
    });

    it("hides the ellipses from assistive technology", () => {
      renderPagination(10, 20);

      for (const gap of screen.getAllByText("…")) {
        expect(gap.closest("li")).toHaveAttribute("aria-hidden", "true");
      }
    });
  });
});
