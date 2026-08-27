import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";
import { getProjectGalleryImages } from "./WorkProjectGallery";

// The lightbox. Flickity drives the actual sliding and is stubbed -- that part
// belongs to the E2E feature. What is asserted here is what React decides
// around it, and one decision in particular:
//
// only the current slide and its immediate neighbours get a real <img>.
// Flickity's own lazyLoad cannot do this (it assigns src to images rendered
// without one, and next/image always emits a real src), and native lazy
// loading cannot either, because fade mode stacks every cell at the same
// coordinates so all of them read as on-screen. Opening a 30-image album used
// to fetch all 30 at once. That is a performance regression nothing else here
// would catch.

type FlickityHandler = (...args: unknown[]) => void;

const select = vi.fn();
const previous = vi.fn();
const next = vi.fn();
const destroy = vi.fn();
let handlers: Record<string, FlickityHandler> = {};

vi.mock("flickity", () => ({
  default: class FakeFlickity {
    selectedIndex: number;
    // The real Flickity honours `initialIndex` and reports it back through
    // `selectedIndex`, which the component reads once on mount. A mock stuck
    // at 0 would silently reset the index and make the window tests lie.
    constructor(_element: HTMLElement, options: { initialIndex?: number }) {
      this.selectedIndex = options.initialIndex ?? 0;
    }
    on(event: string, handler: FlickityHandler) {
      handlers[event] = handler;
    }
    off() {}
    select(index: number) {
      this.selectedIndex = index;
      select(index);
    }
    previous() {
      previous();
    }
    next() {
      next();
    }
    resize() {}
    destroy() {
      destroy();
    }
  },
}));

vi.mock("flickity-fade", () => ({ default: {} }));
vi.mock("flickity/css/flickity.css", () => ({}));
vi.mock("flickity-fade/flickity-fade.css", () => ({}));

const { WorkProjectGallery } = await import("./WorkProjectGallery");

function image(name: string) {
  return {
    src: `https://cdn.sanity.io/${name}.jpg`,
    alt: `Alt ${name}`,
    width: 1600,
    height: 900,
  };
}

function project(imageCount: number): Project {
  return {
    id: "project-1",
    slug: "harbour-light",
    title: "Harbour Light",
    meta: "2026",
    category: "wedding",
    year: "2026",
    location: "Ontario",
    description: "",
    image: "https://cdn.sanity.io/card.jpg",
    imageBlurDataURL: "data:x",
    alt: "The card image",
    width: 1600,
    height: 900,
    images: Array.from({ length: imageCount }, (_, index) =>
      image(String(index)),
    ),
  };
}

beforeEach(() => {
  handlers = {};
  select.mockClear();
  previous.mockClear();
  next.mockClear();
  destroy.mockClear();
  delete document.documentElement.dataset["imageLightbox"];
});

afterEach(cleanup);

describe("getProjectGalleryImages", () => {
  it("uses the album when the project has one", () => {
    expect(getProjectGalleryImages(project(3))).toHaveLength(3);
  });

  it("falls back to the card image so the lightbox is never empty", () => {
    // A project published with no album still opens; it shows the one
    // photograph the card already displays.
    const bare = { ...project(0) };

    expect(getProjectGalleryImages(bare)).toEqual([
      {
        src: bare.image,
        alt: bare.alt,
        width: bare.width,
        height: bare.height,
        blurDataURL: bare.imageBlurDataURL,
      },
    ]);
  });
});

describe("the loading window", () => {
  it("renders a real image only for the current slide and its neighbours", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(10)} />);

    // Ten slides, three loaded: the current one plus one either side, which
    // wraps -- so 0 loads 9, 0 and 1.
    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(3));
  });

  it("loads every slide when the album is smaller than the window", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(2)} />);

    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(2));
  });

  it("opens the window around the slide it was opened on, not around zero", async () => {
    render(<WorkProjectGallery initialIndex={5} project={project(10)} />);

    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(3));
    // 4, 5 and 6 -- not 0.
    expect(screen.getByRole("img", { name: /Alt 5/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /Alt 0/ }),
    ).not.toBeInTheDocument();
  });

  it("widens the window as the carousel moves, keeping what it already loaded", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(10)} />);
    await waitFor(() => expect(handlers["change"]).toBeDefined());

    fireEvent(window, new Event("resize"));
    handlers["change"]?.(5);

    // Already-loaded slides are not thrown away, so moving adds rather than
    // swaps -- a viewer stepping back does not refetch.
    await waitFor(() =>
      expect(screen.getAllByRole("img").length).toBeGreaterThan(3),
    );
  });
});

describe("the gallery shell", () => {
  it("names every slide by its position and alt text", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(3)} />);

    await waitFor(() =>
      expect(screen.getByLabelText("1 of 3: Alt 0")).toBeInTheDocument(),
    );
  });

  it("names the carousel region for a screen reader", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(3)} />);

    expect(
      await screen.findByRole("region", {
        name: "Harbour Light image gallery",
      }),
    ).toBeInTheDocument();
  });

  it("zero-pads the counter, so it does not jog between 9 and 10", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(10)} />);

    // Rendered as `{current} / {total}`, so the digits sit in separate text
    // nodes and have to be matched on the containing element.
    expect(
      await screen.findByText(
        (_text, element) => element?.textContent?.trim() === "01 / 10",
      ),
    ).toBeInTheDocument();
  });

  it("labels its controls as a named navigation landmark", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(3)} />);

    expect(
      await screen.findByRole("navigation", { name: "Gallery controls" }),
    ).toBeInTheDocument();
  });

  it("tears Flickity down on unmount", async () => {
    const { unmount } = render(
      <WorkProjectGallery initialIndex={0} project={project(3)} />,
    );
    await waitFor(() => expect(handlers["change"]).toBeDefined());

    unmount();

    expect(destroy).toHaveBeenCalled();
  });
});

describe("as a modal", () => {
  it("announces itself as a dialog", async () => {
    render(
      <WorkProjectGallery initialIndex={0} isModal project={project(3)} />,
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("is not a dialog when it is the page itself", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(3)} />);

    await screen.findByRole("region", { name: /image gallery/ });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("flags the document so the modal underneath stands down", async () => {
    // WorkDetailModal watches this: two nested aria-modal dialogs leave
    // assistive tech guessing which one confines the user.
    render(
      <WorkProjectGallery initialIndex={0} isModal project={project(3)} />,
    );

    await waitFor(() =>
      expect(document.documentElement.dataset["imageLightbox"]).toBe("true"),
    );
  });

  it("clears that flag when it closes", async () => {
    const { unmount } = render(
      <WorkProjectGallery initialIndex={0} isModal project={project(3)} />,
    );
    await waitFor(() =>
      expect(document.documentElement.dataset["imageLightbox"]).toBe("true"),
    );

    unmount();

    expect(document.documentElement.dataset["imageLightbox"]).not.toBe("true");
  });

  it("closes on the close control", async () => {
    const onClose = vi.fn();
    render(
      <WorkProjectGallery
        initialIndex={0}
        isModal
        onClose={onClose}
        project={project(3)}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Close gallery" }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("stepping through the album", () => {
  it("drives Flickity rather than tracking an index of its own", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(3)} />);

    fireEvent.click(await screen.findByRole("button", { name: "Next image" }));
    expect(next).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(previous).toHaveBeenCalled();
  });

  it("offers no stepping controls for a single-image album", async () => {
    render(<WorkProjectGallery initialIndex={0} project={project(1)} />);

    await screen.findByRole("region", { name: /image gallery/ });
    expect(
      screen.queryByRole("button", { name: "Next image" }),
    ).not.toBeInTheDocument();
  });
});
