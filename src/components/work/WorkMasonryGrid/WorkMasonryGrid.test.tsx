import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";

// The grid's own behaviour, as distinct from the filtering contract the
// gallery integration test covers. What is testable here without a layout
// engine: the loading state it shows before Isotope reports back, the sort
// the homepage collage applies, and the teardown.

type IsotopeOptions = { filter?: (item: Element) => boolean };

const arrange = vi.fn();
const destroy = vi.fn();
let layoutComplete: (() => void) | undefined;
let shouldFailToLoad = false;

vi.mock("isotope-layout", () => ({
  get default() {
    if (shouldFailToLoad) throw new Error("chunk load failed");

    return class FakeIsotope {
      arrange(options: IsotopeOptions) {
        arrange(options);
      }
      once(_event: string, callback: () => void) {
        // Held rather than called, so the pending state is observable.
        layoutComplete = callback;
      }
      destroy() {
        destroy();
      }
    };
  },
}));

const { WorkMasonryGrid } = await import("./WorkMasonryGrid");

function project(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    slug: id,
    title: `Project ${id}`,
    meta: "2026",
    category: "wedding",
    year: "2026",
    location: "Ontario",
    description: "",
    image: "https://cdn.sanity.io/i/a.jpg",
    alt: id,
    width: 800,
    height: 600,
    images: [],
    ...overrides,
  };
}

function titles() {
  return screen
    .getAllByRole("article")
    .map((card) => card.querySelector("a")?.textContent?.replace("2026", ""));
}

beforeEach(() => {
  arrange.mockClear();
  destroy.mockClear();
  layoutComplete = undefined;
  shouldFailToLoad = false;
});

afterEach(cleanup);

describe("WorkMasonryGrid", () => {
  it("renders a card per item", async () => {
    render(
      <WorkMasonryGrid items={[project("a"), project("b")]} variant="work" />,
    );

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
  });

  it("marks itself busy until the layout has settled", async () => {
    const { container } = render(
      <WorkMasonryGrid items={[project("a")]} variant="work" />,
    );

    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
  });

  it("shows a skeleton while busy, hidden from assistive tech", async () => {
    const { container } = render(
      <WorkMasonryGrid items={[project("a")]} variant="work" />,
    );

    const skeleton = container.querySelector("[aria-hidden='true']");
    expect(skeleton).toBeInTheDocument();
  });

  it("drops the skeleton and the busy flag once the layout completes", async () => {
    const { container } = render(
      <WorkMasonryGrid items={[project("a")]} variant="work" />,
    );

    await waitFor(() => expect(layoutComplete).toBeDefined());
    await act(async () => layoutComplete?.());

    expect(container.firstElementChild).toHaveAttribute("aria-busy", "false");
  });

  it("stops waiting when the layout engine fails to load at all", async () => {
    // A chunk that 404s must not leave the grid skeletal forever -- the cards
    // are in the DOM either way, so unstyled is better than invisible.
    shouldFailToLoad = true;
    const { container } = render(
      <WorkMasonryGrid items={[project("a")]} variant="work" />,
    );

    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute("aria-busy", "false"),
    );
  });

  it("keeps the work index in the order it was given", async () => {
    render(
      <WorkMasonryGrid
        items={[project("c"), project("a"), project("b")]}
        variant="work"
      />,
    );

    await waitFor(() =>
      expect(titles()).toEqual(["Project c", "Project a", "Project b"]),
    );
  });

  it("sorts the homepage collage by its curated order", async () => {
    render(
      <WorkMasonryGrid
        items={[
          project("c", { placement: { featuredOrder: 3 } }),
          project("a", { placement: { featuredOrder: 1 } }),
          project("b", { placement: { featuredOrder: 2 } }),
        ]}
        variant="homepage"
      />,
    );

    await waitFor(() =>
      expect(titles()).toEqual(["Project a", "Project b", "Project c"]),
    );
  });

  it("treats an unordered homepage item as first rather than dropping it", async () => {
    render(
      <WorkMasonryGrid
        items={[
          project("b", { placement: { featuredOrder: 2 } }),
          project("a"),
        ]}
        variant="homepage"
      />,
    );

    await waitFor(() => expect(titles()).toEqual(["Project a", "Project b"]));
  });

  it("does not mutate the caller's array while sorting", async () => {
    const items = [
      project("b", { placement: { featuredOrder: 2 } }),
      project("a", { placement: { featuredOrder: 1 } }),
    ];
    render(<WorkMasonryGrid items={items} variant="homepage" />);

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(items.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("appends a title suffix to every card", async () => {
    render(
      <WorkMasonryGrid
        items={[project("a")]}
        titleSuffix=" ↗"
        variant="work"
      />,
    );

    await waitFor(() => expect(titles()).toEqual(["Project a ↗"]));
  });

  it("renders an empty grid rather than failing with no items", async () => {
    render(<WorkMasonryGrid items={[]} variant="work" />);

    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("tears the layout down on unmount", async () => {
    const { unmount } = render(
      <WorkMasonryGrid items={[project("a")]} variant="work" />,
    );

    await waitFor(() => expect(layoutComplete).toBeDefined());
    unmount();

    expect(destroy).toHaveBeenCalled();
  });
});
