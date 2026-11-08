import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHeaderAutoHide } from "./useHeaderAutoHide";

const HEADER_HEIGHT = 80;

function Harness() {
  const { ref, height, floating, revealed } = useHeaderAutoHide<HTMLElement>();

  return (
    <header
      data-floating={floating}
      data-height={height}
      data-revealed={revealed}
      ref={ref}
    >
      <button type="button">Work</button>
    </header>
  );
}

// A frame clock the test advances by hand, as a real one is asynchronous: the
// hook records that a frame is pending, and only clears that when it runs.
let pendingFrames: FrameRequestCallback[] = [];

function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    fireEvent.scroll(window);
    const frames = pendingFrames;
    pendingFrames = [];
    frames.forEach((callback) => callback(0));
  });
}

const header = () => screen.getByRole("banner");

beforeEach(() => {
  pendingFrames = [];
  // The boundaries jsdom cannot provide: layout, and a frame clock.
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(
    HEADER_HEIGHT,
  );
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pendingFrames.push(callback);
    return pendingFrames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: () => void) {}
      observe() {
        this.callback();
      }
      disconnect() {}
    },
  );
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useHeaderAutoHide", () => {
  it("measures the header", () => {
    render(<Harness />);

    expect(header()).toHaveAttribute("data-height", String(HEADER_HEIGHT));
  });

  it("leaves the header alone until the page has scrolled past its height", () => {
    render(<Harness />);

    scrollTo(HEADER_HEIGHT);
    expect(header()).toHaveAttribute("data-floating", "false");

    // Scrolling back up inside that distance is not a reveal either.
    scrollTo(HEADER_HEIGHT / 2);
    expect(header()).toHaveAttribute("data-floating", "false");
    expect(header()).toHaveAttribute("data-revealed", "false");
  });

  it("parks the header out of view when scrolling down past its height", () => {
    render(<Harness />);

    scrollTo(HEADER_HEIGHT + 120);

    expect(header()).toHaveAttribute("data-floating", "true");
    expect(header()).toHaveAttribute("data-revealed", "false");
  });

  it("reveals it on the way back up and hides it again on the way down", () => {
    render(<Harness />);
    scrollTo(600);

    scrollTo(500);
    expect(header()).toHaveAttribute("data-revealed", "true");

    scrollTo(560);
    expect(header()).toHaveAttribute("data-revealed", "false");
  });

  it("keeps a revealed header through the stretch above its own height", () => {
    render(<Harness />);
    scrollTo(600);
    scrollTo(HEADER_HEIGHT * 3);

    scrollTo(HEADER_HEIGHT / 2);

    expect(header()).toHaveAttribute("data-floating", "true");
    expect(header()).toHaveAttribute("data-revealed", "true");
  });

  it("hands the header back to the flow at the very top", () => {
    render(<Harness />);
    scrollTo(600);
    scrollTo(300);

    scrollTo(0);

    expect(header()).toHaveAttribute("data-floating", "false");
    expect(header()).toHaveAttribute("data-revealed", "false");
  });

  it("treats the rubber-band overscroll above the top as the top", () => {
    render(<Harness />);
    scrollTo(600);

    scrollTo(-40);

    expect(header()).toHaveAttribute("data-floating", "false");
  });

  it("ignores movement too small to be a change of direction", () => {
    render(<Harness />);
    scrollTo(600);

    scrollTo(598);

    expect(header()).toHaveAttribute("data-revealed", "false");
  });

  it("starts parked when the page loads already scrolled past the header", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 900,
    });

    render(<Harness />);

    expect(header()).toHaveAttribute("data-floating", "true");
    expect(header()).toHaveAttribute("data-revealed", "false");
  });

  it("reveals a parked header when a link in it takes focus", () => {
    render(<Harness />);
    scrollTo(600);

    act(() => screen.getByRole("button", { name: "Work" }).focus());

    expect(header()).toHaveAttribute("data-revealed", "true");
  });

  it("does nothing on focus while the header is still in the flow", () => {
    render(<Harness />);

    act(() => screen.getByRole("button", { name: "Work" }).focus());

    expect(header()).toHaveAttribute("data-revealed", "false");
  });
});
