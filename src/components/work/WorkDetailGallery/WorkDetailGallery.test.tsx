import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";

// The project album, in its two presentations: a standalone page and the
// intercepted modal. Almost everything that differs between them is a
// heading-level or landmark decision, which is exactly the kind that passes a
// design review and fails a screen reader.
//
// The lightbox it opens is the Flickity carousel, stubbed here -- its own
// behaviour is browser-coupled and belongs to the E2E feature.

const destroy = vi.fn();

vi.mock("isotope-layout", () => ({
  default: class FakeIsotope {
    arrange() {}
    layout() {}
    once(_event: string, callback: () => void) {
      callback();
    }
    destroy() {
      destroy();
    }
  },
}));

// Only the carousel component is stubbed. `getProjectGalleryImages` is the
// real one -- it decides which images the album shows, which is this
// component's own behaviour rather than the lightbox's.
vi.mock("../WorkProjectGallery/WorkProjectGallery", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../WorkProjectGallery/WorkProjectGallery")
  >()),
  WorkProjectGallery: ({ initialIndex }: { initialIndex: number }) => (
    <div data-testid="lightbox">opened at {initialIndex}</div>
  ),
}));

const { WorkDetailGallery } = await import("./WorkDetailGallery");

/** next/image rejects a relative src, so fixtures carry a full CDN url. */
function image(name: string) {
  return {
    src: `https://cdn.sanity.io/${name}`,
    alt: `Alt for ${name}`,
    width: 1600,
    height: 900,
  };
}

const project: Project = {
  id: "project-1",
  slug: "harbour-light",
  title: "Harbour Light",
  meta: "Wedding — 2026",
  category: "fine-art",
  year: "2026",
  location: "Ontario",
  description: "A coastal wedding at first light.",
  image: "https://cdn.sanity.io/card.jpg",
  alt: "A bride on a clifftop",
  width: 1600,
  height: 900,
  images: [image("one.jpg"), image("two.jpg"), image("three.jpg")],
};

beforeEach(() => {
  destroy.mockClear();
});

afterEach(cleanup);

describe("WorkDetailGallery", () => {
  it("is a region labelled by the project title", async () => {
    render(<WorkDetailGallery project={project} />);

    await waitFor(() =>
      expect(
        screen.getByRole("article", { name: "Harbour Light" }),
      ).toBeInTheDocument(),
    );
  });

  it("shows the project's own copy, not a summary of it", () => {
    render(<WorkDetailGallery project={project} />);

    expect(
      screen.getByText("A coastal wedding at first light."),
    ).toBeInTheDocument();
  });

  it("shows the category in a readable form above the title", () => {
    render(<WorkDetailGallery project={project} />);

    expect(screen.getByText("Fine Art")).toBeInTheDocument();
  });

  it("lists the year, location, category and image count", () => {
    render(<WorkDetailGallery project={project} />);

    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("Ontario")).toBeInTheDocument();
    // Zero-padded, so the column does not jog between 9 and 10 images.
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("pads the image count to two digits", () => {
    render(
      <WorkDetailGallery
        project={{ ...project, images: [image("one.jpg")] }}
      />,
    );

    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("renders an image per album entry", async () => {
    render(<WorkDetailGallery project={project} />);

    await waitFor(() =>
      expect(screen.getAllByRole("img")).toHaveLength(project.images.length),
    );
  });

  it("names the album region for a screen reader browsing landmarks", () => {
    render(<WorkDetailGallery project={project} />);

    expect(
      screen.getByRole("region", { name: "Harbour Light album" }),
    ).toBeInTheDocument();
  });

  it("tears the layout down on unmount", async () => {
    const { unmount } = render(<WorkDetailGallery project={project} />);

    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(3));
    unmount();

    expect(destroy).toHaveBeenCalled();
  });
});

describe("as a standalone page", () => {
  it("titles the project with an h1, being the page's own subject", () => {
    render(<WorkDetailGallery presentation="page" project={project} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Harbour Light" }),
    ).toBeInTheDocument();
  });

  it("offers a way back to the index and a share control", () => {
    render(<WorkDetailGallery presentation="page" project={project} />);

    expect(screen.getByRole("link", { name: "All work" })).toHaveAttribute(
      "href",
      "/work",
    );
    expect(
      screen.getByRole("button", { name: /Copy link to Harbour Light/ }),
    ).toBeInTheDocument();
  });
});

describe("as an intercepted modal", () => {
  it("drops to an h2, since the modal's own title is the h1", () => {
    render(<WorkDetailGallery presentation="modal" project={project} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Harbour Light" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("drops the back link and share row, which the sticky bar already carries", () => {
    // Duplicating them would give a screen reader two identical controls and
    // leave the second unreachable once the header scrolls away.
    render(<WorkDetailGallery presentation="modal" project={project} />);

    expect(
      screen.queryByRole("link", { name: "All work" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Copy link/ }),
    ).not.toBeInTheDocument();
  });
});

describe("opening the lightbox", () => {
  it("stays closed until an image is chosen", () => {
    render(<WorkDetailGallery project={project} />);

    expect(screen.queryByTestId("lightbox")).not.toBeInTheDocument();
  });

  it("names each image opener by its position and alt text", () => {
    render(<WorkDetailGallery project={project} />);

    expect(
      screen.getByRole("button", { name: "Open image 2: Alt for two.jpg" }),
    ).toBeInTheDocument();
  });

  it("opens on the image that was clicked, not on the first", async () => {
    // Selected by label rather than by index: the page presentation also
    // renders a ShareButton, so positional lookup would drift.
    render(<WorkDetailGallery project={project} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open image 3: Alt for three.jpg" }),
    );

    expect(await screen.findByTestId("lightbox")).toHaveTextContent(
      "opened at 2",
    );
  });
});
