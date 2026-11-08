import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollToTopVisibility } from "./useScrollToTopVisibility";

const VIEWPORT = 1000;
const LINE = VIEWPORT * 0.8;

function Harness() {
  const visible = useScrollToTopVisibility();
  return <output data-visible={visible} />;
}

// A frame clock the test advances by hand, as a real one is asynchronous.
let pendingFrames: FrameRequestCallback[] = [];

function flushFrames() {
  const frames = pendingFrames;
  pendingFrames = [];
  frames.forEach((callback) => callback(0));
}

function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    fireEvent.scroll(window);
    flushFrames();
  });
}

const state = () => screen.getByRole("status").getAttribute("data-visible");

beforeEach(() => {
  pendingFrames = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pendingFrames.push(callback);
    return pendingFrames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: VIEWPORT,
  });
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useScrollToTopVisibility", () => {
  it("is hidden at the top of the page", () => {
    render(<Harness />);

    expect(state()).toBe("false");
  });

  it("stays hidden up to 80% of the viewport height", () => {
    render(<Harness />);

    scrollTo(LINE);

    expect(state()).toBe("false");
  });

  it("shows once the page has scrolled past that line", () => {
    render(<Harness />);

    scrollTo(LINE + 1);

    expect(state()).toBe("true");
  });

  it("stays shown while scrolling on, and hides again back at the line", () => {
    render(<Harness />);
    scrollTo(LINE + 400);
    scrollTo(LINE + 50);
    expect(state()).toBe("true");

    scrollTo(LINE);

    expect(state()).toBe("false");
  });

  it("starts shown when a reload restores a deep scroll position", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: LINE + 500,
    });

    render(<Harness />);

    expect(state()).toBe("true");
  });

  it("re-reads the line when the viewport is resized", () => {
    render(<Harness />);
    scrollTo(LINE + 10);
    expect(state()).toBe("true");

    act(() => {
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: VIEWPORT * 2,
      });
      fireEvent(window, new Event("resize"));
      flushFrames();
    });

    expect(state()).toBe("false");
  });

  describe("on a page that marks a section to scroll past", () => {
    function setBottom(element: Element, bottom: number) {
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
        bottom,
      } as DOMRect);
    }

    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("ignores the viewport-height rule until the section has gone by", () => {
      const section = document.createElement("section");
      section.setAttribute("data-scroll-to-top-after", "");
      document.body.append(section);
      setBottom(section, 300);
      render(<Harness />);

      scrollTo(LINE + 500);
      expect(state()).toBe("false");

      setBottom(section, 0);
      scrollTo(LINE + 800);
      expect(state()).toBe("true");

      setBottom(section, 40);
      scrollTo(LINE + 760);
      expect(state()).toBe("false");
    });

    it("measures the pin spacer rather than the pinned section inside it", () => {
      const spacer = document.createElement("div");
      spacer.className = "pin-spacer";
      const section = document.createElement("section");
      section.setAttribute("data-scroll-to-top-after", "");
      spacer.append(section);
      document.body.append(spacer);
      // A pinned section sits fixed in the viewport and never leaves it.
      setBottom(section, 700);
      setBottom(spacer, -10);
      render(<Harness />);

      scrollTo(LINE + 800);

      expect(state()).toBe("true");
    });
  });
});
