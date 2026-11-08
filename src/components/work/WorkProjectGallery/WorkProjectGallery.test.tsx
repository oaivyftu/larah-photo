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
type FlickityOptions = { initialIndex?: number } & Record<string, unknown>;

const select = vi.fn();
const previous = vi.fn();
const next = vi.fn();
const destroy = vi.fn();
let handlers: Record<string, FlickityHandler> = {};
// Every set of options Flickity was constructed with, in order. A list rather
// than just the last one, because a breakpoint crossing builds a second
// carousel and the test needs to see both.
let constructions: FlickityOptions[] = [];

vi.mock("flickity", () => ({
  default: class FakeFlickity {
    selectedIndex: number;
    // The real Flickity honours `initialIndex` and reports it back through
    // `selectedIndex`, which the component reads once on mount. A mock stuck
    // at 0 would silently reset the index and make the window tests lie.
    constructor(_element: HTMLElement, options: FlickityOptions) {
      this.selectedIndex = options.initialIndex ?? 0;
      constructions.push(options);
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

// The component asks two questions of `matchMedia`: whether this pointer gets
// the sliding carousel, and whether the controls may auto-hide. They are
// opposites -- coarse pointer versus fine -- so one flag answers both, and the
// stub keeps the slide query's listeners so a breakpoint crossing can be fired.
type MediaListener = (event: MediaQueryListEvent) => void;

const slideMediaListeners = new Set<MediaListener>();
let isSlideMedia = false;
// `prefers-reduced-motion` is a third question the stub has to answer apart
// from the other two, or it would read as a slide-mode flag and flip with it.
let isReducedMotion = false;
let realMatchMedia: typeof window.matchMedia;

function isSlideQuery(query: string) {
  return query.includes("coarse");
}

function setSlideMedia(matches: boolean) {
  isSlideMedia = matches;

  for (const listener of slideMediaListeners) {
    listener({ matches } as MediaQueryListEvent);
  }
}

/**
 * A pointer event of a given `pointerType`.
 *
 * `fireEvent.pointerMove(element, { pointerType })` cannot express this: jsdom
 * has no `PointerEvent`, so Testing Library falls back to a plain `Event` and
 * the `pointerType` never reaches the handler -- which would make every case
 * here look like a non-mouse pointer and pass for the wrong reason.
 */
function pointerMove(element: Element, pointerType: string) {
  const event = new window.MouseEvent("pointermove", {
    bubbles: true,
    clientX: 10,
    clientY: 10,
  });

  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(element, event);
}

beforeEach(() => {
  handlers = {};
  constructions = [];
  slideMediaListeners.clear();
  isSlideMedia = false;
  isReducedMotion = false;
  select.mockClear();
  previous.mockClear();
  next.mockClear();
  destroy.mockClear();
  delete document.documentElement.dataset["imageLightbox"];

  realMatchMedia = window.matchMedia;
  window.matchMedia = ((query: string) => {
    const slideQuery = isSlideQuery(query);
    const reducedMotionQuery = query.includes("prefers-reduced-motion");

    return {
      get matches() {
        if (reducedMotionQuery) {
          return isReducedMotion;
        }

        return slideQuery ? isSlideMedia : !isSlideMedia;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: MediaListener) => {
        if (slideQuery) {
          slideMediaListeners.add(listener);
        }
      },
      removeEventListener: (_type: string, listener: MediaListener) => {
        slideMediaListeners.delete(listener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  window.matchMedia = realMatchMedia;
});

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

/**
 * A touch event with a list of fingers on it.
 *
 * Built by hand for the same reason as `pointerMove` above: jsdom has no
 * `Touch`, and Testing Library's `fireEvent.touchMove(el, { touches })` does not
 * carry the list through. The component reads `touches.length` and
 * `touches.item(0)`, so the stand-in has both.
 */
function touchEvent(type: string, fingers: Array<[x: number, y: number]>) {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  const points = fingers.map(([clientX, clientY]) => ({ clientX, clientY }));
  const touches = Object.assign(points, {
    item: (index: number) => points[index] ?? null,
  });

  Object.defineProperty(event, "touches", { value: touches });

  return event;
}

describe("swiping down to dismiss", () => {
  // `performance.now` is what the component times a flick with, and Date-based
  // fake timers would not move it here, so the clock is the test's own.
  let now = 0;

  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    // A touch device: the viewer is the sliding carousel, and the section is
    // what listens.
    isSlideMedia = true;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function open(props: { isModal?: boolean; onClose?: () => void } = {}) {
    const onClose = props.onClose ?? vi.fn();
    const { container } = render(
      <WorkProjectGallery
        initialIndex={0}
        isModal={props.isModal ?? true}
        onClose={onClose}
        project={project(3)}
      />,
    );
    const section = container.querySelector("section") as HTMLElement;

    // Let the dynamic Flickity import settle before touching anything.
    await vi.waitFor(() => expect(constructions.length).toBeGreaterThan(0));

    const panel = section.firstElementChild as HTMLElement;

    return { onClose, panel, section };
  }

  const start = (el: Element, x: number, y: number) =>
    fireEvent(el, touchEvent("touchstart", [[x, y]]));
  const move = (el: Element, x: number, y: number, ms = 16) => {
    now += ms;
    fireEvent(el, touchEvent("touchmove", [[x, y]]));
  };
  const end = (el: Element) => fireEvent(el, touchEvent("touchend", []));
  const transitionEnd = (panel: Element) =>
    fireEvent(
      panel,
      Object.assign(new window.Event("transitionend", { bubbles: true }), {
        propertyName: "transform",
      }),
    );
  const dragY = (el: HTMLElement) =>
    el.style.getPropertyValue("--gallery-drag-y");

  it("follows the finger down, then leaves once let go past the threshold", async () => {
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115); // locks as a downward swipe
    move(section, 100, 300, 120);

    expect(section).toHaveAttribute("data-swipe", "dragging");
    expect(dragY(section)).toBe("185px");

    end(section);

    // Sliding away, not yet gone: it closes when the slide has finished.
    expect(section).toHaveAttribute("data-swipe", "dismissing");
    expect(dragY(section)).toBe(`${window.innerHeight}px`);
    expect(onClose).not.toHaveBeenCalled();

    transitionEnd(panel);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes once even if the fallback timer and the transition both fire", async () => {
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    end(section);
    transitionEnd(panel);
    vi.advanceTimersByTime(1000);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on the fallback timer when the transition never ends", async () => {
    const { onClose, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    end(section);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(700);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ignores a transition that is not the panel's own transform", async () => {
    // The float nav and the carousel transition transforms too, and those
    // bubble up to the section.
    const { onClose, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    end(section);
    transitionEnd(section.querySelector("button") as Element);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("springs back when let go short of the threshold", async () => {
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 160, 200); // 45px further, slowly
    end(section);

    expect(section).toHaveAttribute("data-swipe", "returning");
    expect(dragY(section)).toBe("0px");

    transitionEnd(panel);

    expect(onClose).not.toHaveBeenCalled();
    expect(section).not.toHaveAttribute("data-swipe");
    expect(dragY(section)).toBe("");
  });

  it("ignores a new touch while it is already on its way out", async () => {
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    end(section);

    // A finger lands on the sliding viewer and drags: it must not take over.
    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 160, 120);

    expect(section).toHaveAttribute("data-swipe", "dismissing");
    expect(dragY(section)).toBe(`${window.innerHeight}px`);

    transitionEnd(panel);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("takes a new swipe that lands while it is still springing back", async () => {
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 160, 200);
    end(section);
    expect(section).toHaveAttribute("data-swipe", "returning");

    // Straight away, before the spring has settled: the next gesture.
    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    expect(section).toHaveAttribute("data-swipe", "dragging");

    end(section);
    transitionEnd(panel);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("treats a short, fast flick as a dismissal", async () => {
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 120);
    move(section, 100, 160, 10); // 40px in 10ms
    end(section);
    transitionEnd(panel);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not count a flick the finger rested after before lifting", async () => {
    // Fast, and far enough -- but it stopped, held for a beat and then lifted,
    // which is a drag, not a flick.
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 120);
    move(section, 100, 160, 10);
    now += 200;
    end(section);

    expect(section).toHaveAttribute("data-swipe", "returning");

    transitionEnd(panel);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not count a twitch as a flick", async () => {
    const { onClose, panel, section } = await open();

    start(section, 100, 100);
    move(section, 100, 112);
    move(section, 100, 118, 4); // fast, but 6px
    end(section);
    transitionEnd(panel);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps a downward swipe from Flickity, which listens on the window", async () => {
    const { section } = await open();
    const onWindowMove = vi.fn();
    window.addEventListener("touchmove", onWindowMove);

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 200);

    window.removeEventListener("touchmove", onWindowMove);
    expect(onWindowMove).not.toHaveBeenCalled();
  });

  it("cancels the browser's own handling of the swipe", async () => {
    const { section } = await open();
    const event = touchEvent("touchmove", [[100, 200]]);

    start(section, 100, 100);
    move(section, 100, 115);
    fireEvent(section, event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves a horizontal swipe to the carousel", async () => {
    const { onClose, section } = await open();
    const onWindowMove = vi.fn();
    window.addEventListener("touchmove", onWindowMove);

    start(section, 100, 100);
    move(section, 140, 105);
    move(section, 200, 400); // later drifting down must not flip the mode
    end(section);

    window.removeEventListener("touchmove", onWindowMove);
    expect(onWindowMove).toHaveBeenCalled();
    expect(section).not.toHaveAttribute("data-swipe");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("leaves a swipe that leans more sideways than down to the carousel", async () => {
    const { onClose, section } = await open();

    start(section, 100, 100);
    move(section, 160, 130);
    move(section, 200, 400);
    end(section);

    expect(section).not.toHaveAttribute("data-swipe");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores a swipe upward", async () => {
    const { onClose, section } = await open();

    start(section, 100, 400);
    move(section, 100, 300);
    move(section, 100, 100, 200);
    end(section);

    expect(section).not.toHaveAttribute("data-swipe");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores a gesture that starts with two fingers", async () => {
    const { onClose, section } = await open();

    fireEvent(
      section,
      touchEvent("touchstart", [
        [100, 100],
        [200, 100],
      ]),
    );
    move(section, 100, 115);
    move(section, 100, 400, 120);
    end(section);

    expect(section).not.toHaveAttribute("data-swipe");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("lets go of the viewer when a second finger lands mid-drag", async () => {
    const { onClose, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    now += 16;
    fireEvent(
      section,
      touchEvent("touchmove", [
        [100, 320],
        [200, 320],
      ]),
    );

    expect(section).toHaveAttribute("data-swipe", "returning");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("springs back when the browser takes the touch away", async () => {
    const { onClose, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    fireEvent(section, touchEvent("touchcancel", []));

    expect(section).toHaveAttribute("data-swipe", "returning");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes without sliding for someone who asked for less motion", async () => {
    isReducedMotion = true;
    const { onClose, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    end(section);

    // No transition to wait for.
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("settles without easing under reduced motion when let go short", async () => {
    isReducedMotion = true;
    const { onClose, section } = await open();

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 160, 200);
    end(section);

    expect(section).not.toHaveAttribute("data-swipe");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does nothing on the page presentation, which has nothing to dismiss", async () => {
    const { container } = render(
      <WorkProjectGallery initialIndex={0} project={project(3)} />,
    );
    const section = container.querySelector("section") as HTMLElement;

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);

    expect(section).not.toHaveAttribute("data-swipe");
  });

  it("does nothing when there is no close handler to call", async () => {
    const { container } = render(
      <WorkProjectGallery initialIndex={0} isModal project={project(3)} />,
    );
    const section = container.querySelector("section") as HTMLElement;

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);

    expect(section).not.toHaveAttribute("data-swipe");
  });

  it("puts everything back when it unmounts mid-drag", async () => {
    const { section } = await open();
    const { unmount } = { unmount: () => cleanup() };

    start(section, 100, 100);
    move(section, 100, 115);
    move(section, 100, 300, 120);
    expect(section).toHaveAttribute("data-swipe", "dragging");

    unmount();

    expect(section).not.toHaveAttribute("data-swipe");
    expect(dragY(section)).toBe("");
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

/**
 * Which carousel each pointer gets, and on what terms.
 *
 * Flickity reads these once, at construction, and what it does with them is a
 * browser question answered by the E2E suite. What is asserted here is the
 * decision itself -- the part that was wrong: `freeScroll` with `wrapAround`
 * never re-arms selected-attraction on drag end, so a swipe coasted to rest
 * between two photographs and fade then snapped them apart.
 */
describe("the carousel each pointer gets", () => {
  async function optionsAfterRender(props: { slide: boolean }) {
    setSlideMedia(props.slide);
    render(
      <WorkProjectGallery initialIndex={0} isModal project={project(3)} />,
    );
    await waitFor(() => expect(constructions).toHaveLength(1));

    return constructions[0];
  }

  it("slides under the finger on a coarse pointer", async () => {
    const options = await optionsAfterRender({ slide: true });

    expect(options["draggable"]).toBe(true);
    expect(options["fade"]).toBe(false);
  });

  it("keeps the crossfade, and the controls that drive it, on a fine pointer", async () => {
    const options = await optionsAfterRender({ slide: false });

    expect(options["fade"]).toBe(true);
    // Not draggable: a drag across a viewport-wide crossfade follows nothing.
    expect(options["draggable"]).toBe(false);
  });

  it("never free-scrolls, so a swipe settles on a photograph", async () => {
    for (const slide of [true, false]) {
      cleanup();
      constructions = [];

      expect((await optionsAfterRender({ slide }))["freeScroll"]).toBe(false);
    }
  });

  it("does not reposition the slider when a photograph finishes loading", async () => {
    // `imagesLoaded`'s progress callback calls `positionSliderAtSelected()`
    // while free-scroll is off, which would snap the slider mid-drag.
    const options = await optionsAfterRender({ slide: true });

    expect(options["imagesLoaded"]).toBeUndefined();
  });

  it("rebuilds on the photograph in view when the pointer changes", async () => {
    render(
      <WorkProjectGallery initialIndex={3} isModal project={project(8)} />,
    );
    await waitFor(() => expect(handlers["change"]).toBeDefined());

    // The visitor pages on before rotating the phone.
    handlers["change"]?.(5);
    setSlideMedia(true);

    await waitFor(() => expect(constructions).toHaveLength(2));
    expect(destroy).toHaveBeenCalled();
    // Not 3: rebuilding at the index it opened on would throw away where they
    // had got to.
    expect(constructions[1]["initialIndex"]).toBe(5);
    expect(constructions[1]["fade"]).toBe(false);
  });
});

describe("what a drag costs", () => {
  it("does not measure the controls while a finger is on the carousel", async () => {
    setSlideMedia(true);
    render(
      <WorkProjectGallery initialIndex={0} isModal project={project(3)} />,
    );

    const carousel = await screen.findByRole("region", {
      name: /image gallery/,
    });
    const controls = screen.getByRole("navigation", {
      name: "Gallery controls",
    });
    const measure = vi.spyOn(controls, "getBoundingClientRect");

    pointerMove(carousel, "touch");

    // Measuring forces a layout, and on touch it landed on every move of a
    // finger mid-drag -- to place a hint only a mouse can ever see.
    expect(measure).not.toHaveBeenCalled();

    pointerMove(carousel, "mouse");

    expect(measure).toHaveBeenCalled();
  });
});
