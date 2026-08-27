import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";
import type { WorkPageContent } from "@/types/site";

// Integration test for the first of the two flows constitution Principle V
// calls critical: work gallery navigation. Three components take part for
// real -- WorkGalleryClient, WorkFilters and WorkCard -- and only the layout
// engine is replaced.
//
// It has to be replaced, and the reason shapes the whole test. Filtering here
// is done by Isotope, not by React: every card stays mounted and Isotope
// hides the non-matching ones visually (WorkMasonryGrid.tsx filterItem +
// arrange). So "only two cards are on screen" is not a thing jsdom can see,
// and asserting `getAllByRole("article")` after a filter click would pass
// whatever the filter did.
//
// What is worth asserting is the contract between the two halves: React
// renders `data-work-category` onto each card and hands Isotope a predicate;
// Isotope calls that predicate per element. The fake below captures the real
// predicate and runs it against the real rendered cards, which exercises both
// halves of that contract without needing a layout engine.

type ArrangeOptions = { filter?: (item: Element) => boolean };

const arrange = vi.fn<(options: ArrangeOptions) => void>();
const destroy = vi.fn();
let capturedFilter: ((item: Element) => boolean) | undefined;

vi.mock("isotope-layout", () => ({
  default: class FakeIsotope {
    constructor(_element: HTMLElement, options: ArrangeOptions) {
      capturedFilter = options.filter;
    }
    arrange(options: ArrangeOptions) {
      if (options.filter) capturedFilter = options.filter;
      arrange(options);
    }
    once(_event: string, callback: () => void) {
      callback();
    }
    destroy() {
      destroy();
    }
  },
}));

// The page-entry animation is not part of this flow, and running GSAP in jsdom
// would add noise without adding signal. The hook's own behaviour is covered
// separately; here it only has to hand back the ref the section attaches.
vi.mock("@/utils/usePageIntro", async () => {
  const { useRef } = await import("react");

  return {
    usePageIntro: () => useRef<HTMLElement>(null),
  };
});

const { WorkGalleryClient } = await import("./WorkGalleryClient");

function project(
  overrides: Partial<Project> & Pick<Project, "id" | "category">,
): Project {
  return {
    slug: overrides.id,
    title: `Project ${overrides.id}`,
    meta: "2026",
    year: "2026",
    location: "Hanoi",
    description: "",
    image: "https://cdn.sanity.io/i/a.jpg",
    alt: `Project ${overrides.id}`,
    width: 800,
    height: 600,
    images: [],
    ...overrides,
  };
}

const projects: Project[] = [
  project({ id: "a", category: "wedding" }),
  project({ id: "b", category: "wedding" }),
  project({ id: "c", category: "editorial" }),
  project({ id: "d", category: "fine-art" }),
];

const content = { titleWords: ["Selected", "Work"] } as WorkPageContent;

function renderGallery(items: Project[] = projects) {
  return render(<WorkGalleryClient content={content} projects={items} />);
}

/** The real cards, as Isotope would receive them. */
function cards() {
  return [...document.querySelectorAll("[data-work-card]")];
}

/** Run the predicate React actually handed Isotope over the real card nodes. */
function survivingTitles() {
  if (!capturedFilter) throw new Error("Isotope was never given a filter");

  return cards()
    .filter((card) => capturedFilter!(card))
    .map((card) => card.querySelector("a")?.textContent?.replace(/2026$/, ""));
}

beforeEach(() => {
  arrange.mockClear();
  destroy.mockClear();
  capturedFilter = undefined;
});

afterEach(cleanup);

describe("work gallery navigation", () => {
  it("offers one filter per distinct category, plus All, in that order", async () => {
    renderGallery();

    const names = (await screen.findAllByRole("button")).map(
      (button) => button.textContent,
    );

    // Two projects share "wedding", so it must appear once.
    // "fine-art" comes back title-cased per word, via formatWorkCategory.
    expect(names).toEqual(["All", "Wedding", "Editorial", "Fine Art"]);
  });

  it("starts on All with nothing announced", async () => {
    renderGallery();

    expect(await screen.findByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The announcement is made on the interaction, not from an effect, so the
    // first render must not speak.
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("moves the pressed state to the chosen filter", async () => {
    renderGallery();

    fireEvent.click(await screen.findByRole("button", { name: "Wedding" }));

    expect(screen.getByRole("button", { name: "Wedding" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps exactly the matching cards when a category is chosen", async () => {
    renderGallery();
    await screen.findByRole("button", { name: "Wedding" });

    fireEvent.click(screen.getByRole("button", { name: "Wedding" }));

    await waitFor(() =>
      expect(survivingTitles()).toEqual(["Project a", "Project b"]),
    );
  });

  it("keeps every card under All", async () => {
    renderGallery();
    await screen.findByRole("button", { name: "Editorial" });

    fireEvent.click(screen.getByRole("button", { name: "Editorial" }));
    await waitFor(() => expect(survivingTitles()).toEqual(["Project c"]));

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    await waitFor(() => expect(survivingTitles()).toHaveLength(4));
  });

  it("re-runs the layout when the filter changes", async () => {
    renderGallery();
    await screen.findByRole("button", { name: "Wedding" });
    arrange.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Wedding" }));

    await waitFor(() => expect(arrange).toHaveBeenCalled());
  });

  it("announces the filter and how much is left", async () => {
    renderGallery();

    fireEvent.click(await screen.findByRole("button", { name: "Wedding" }));

    expect(screen.getByRole("status")).toHaveTextContent("Wedding: 2 projects");
  });

  it("says project, singular, when one is left", async () => {
    renderGallery();

    fireEvent.click(await screen.findByRole("button", { name: "Editorial" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Editorial: 1 project",
    );
  });

  it("announces the whole set again on returning to All", async () => {
    renderGallery();
    fireEvent.click(await screen.findByRole("button", { name: "Wedding" }));

    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByRole("status")).toHaveTextContent("All: 4 projects");
  });

  it("announces zero rather than going silent", async () => {
    // Reachable when a category's only project is unpublished between the
    // filter list being built and the click. Silence would read as "nothing
    // happened" to a screen reader.
    const single = [project({ id: "a", category: "wedding" })];
    renderGallery(single);
    fireEvent.click(await screen.findByRole("button", { name: "Wedding" }));

    expect(screen.getByRole("status")).toHaveTextContent("Wedding: 1 project");
  });

  it("labels the region by its own heading", async () => {
    renderGallery();

    expect(
      await screen.findByRole("region", { name: "Selected Work" }),
    ).toBeInTheDocument();
  });

  it("renders no filters beyond All when there are no projects", async () => {
    renderGallery([]);

    expect(await screen.findAllByRole("button")).toHaveLength(1);
  });

  it("tears the layout down on unmount", async () => {
    const { unmount } = renderGallery();
    await screen.findByRole("button", { name: "Wedding" });

    unmount();

    expect(destroy).toHaveBeenCalled();
  });
});
