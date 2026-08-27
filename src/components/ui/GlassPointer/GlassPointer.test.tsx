import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { claimPointerLabel, releasePointerLabel } from "./pointerLabelStore";

// The pill that trails the mouse. The easing loop itself is a browser thing
// and is not asserted frame by frame; what is testable here is every decision
// around it -- whether it runs at all, whether it defers to a reduced-motion
// preference, and whether it stops when the component goes away.
//
// The last one matters most: this listens on `window`, so a leaked listener
// survives every navigation for the life of the tab.

let pathname = "/work";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { GlassPointer } = await import("./GlassPointer");

const OWNER = Symbol("owner");

/** A matchMedia that reports the given answer for every query. */
function setReducedMotion(matches: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  } as unknown as MediaQueryList;

  vi.spyOn(window, "matchMedia").mockReturnValue(query);

  return {
    change(next: boolean) {
      (query as { matches: boolean }).matches = next;
      for (const listener of listeners) listener();
    },
  };
}

function pill() {
  return document.querySelector<HTMLElement>("[aria-hidden='true']");
}

function movePointer(x: number, y: number, pointerType = "mouse") {
  fireEvent(
    window,
    Object.assign(new Event("pointermove"), {
      clientX: x,
      clientY: y,
      pointerType,
    }),
  );
}

beforeEach(() => {
  pathname = "/work";
  releasePointerLabel(OWNER);
  const reset = Symbol("reset");
  claimPointerLabel(reset, "reset");
  releasePointerLabel(reset);
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GlassPointer", () => {
  it("is hidden from assistive tech, being a cursor decoration", () => {
    render(<GlassPointer />);

    expect(pill()).toHaveAttribute("aria-hidden", "true");
  });

  it("renders nothing at all inside the Studio", () => {
    // The Studio is Sanity's own UI; a trailing pill over it is noise.
    pathname = "/studio/desk";
    const { container } = render(<GlassPointer />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders on a normal route", () => {
    const { container } = render(<GlassPointer />);

    expect(container).not.toBeEmptyDOMElement();
  });

  it("shows nothing until a target claims a label", () => {
    render(<GlassPointer />);

    expect(pill()).not.toHaveAttribute("data-active");
  });

  it("shows the claimed label and marks itself active", () => {
    render(<GlassPointer />);

    act(() => claimPointerLabel(OWNER, "View project"));

    expect(screen.getByText("View project")).toBeInTheDocument();
    expect(pill()).toHaveAttribute("data-active");
  });

  it("goes quiet again when the label is released", () => {
    render(<GlassPointer />);
    act(() => claimPointerLabel(OWNER, "View project"));

    act(() => releasePointerLabel(OWNER));

    expect(pill()).not.toHaveAttribute("data-active");
  });

  it("jumps straight to the first pointer position rather than sliding in from 0,0", () => {
    render(<GlassPointer />);

    movePointer(120, 340);

    expect(pill()?.style.getPropertyValue("--x")).toBe("120.000px");
    expect(pill()?.style.getPropertyValue("--y")).toBe("340.000px");
  });

  it("ignores a touch pointer, which has no cursor to trail", () => {
    render(<GlassPointer />);

    movePointer(120, 340, "touch");

    expect(pill()?.style.getPropertyValue("--x")).toBe("");
  });

  it("follows the mouse exactly, with no easing, under reduced motion", () => {
    setReducedMotion(true);
    const raf = vi.spyOn(window, "requestAnimationFrame");
    render(<GlassPointer />);

    movePointer(10, 10);
    movePointer(400, 500);

    expect(pill()?.style.getPropertyValue("--x")).toBe("400.000px");
    expect(pill()?.style.getPropertyValue("--y")).toBe("500.000px");
    expect(raf).not.toHaveBeenCalled();
  });

  it("stops animating the moment the preference changes mid-session", () => {
    const media = setReducedMotion(false);
    render(<GlassPointer />);
    act(() => claimPointerLabel(OWNER, "View"));
    movePointer(10, 10);

    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    act(() => media.change(true));

    // Whatever frame was queued is dropped, and the pill lands on target.
    expect(cancel).toHaveBeenCalled();
  });

  it("stops listening on the window when it unmounts", () => {
    // A leaked pointermove listener survives every navigation for the life of
    // the tab, and this component mounts on every route.
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<GlassPointer />);

    unmount();

    expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function));
  });

  it("cancels a queued frame on unmount", () => {
    render(<GlassPointer />);
    act(() => claimPointerLabel(OWNER, "View"));
    movePointer(10, 10);

    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    cleanup();

    expect(cancel).toHaveBeenCalled();
  });

  it("carries the SVG filter the glass effect reads", () => {
    const { container } = render(<GlassPointer />);

    expect(container.querySelector("#glass-distortion")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
