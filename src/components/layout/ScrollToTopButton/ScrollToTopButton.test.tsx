import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollToTopButton } from "./ScrollToTopButton";

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

// `visibility: hidden` is the stylesheet's job and jsdom loads none, so the
// button's state is read from the attribute the stylesheet keys on.
const button = () =>
  screen.getByRole("button", { name: "Back to top", hidden: true });

beforeEach(() => {
  pendingFrames = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pendingFrames.push(callback);
    return pendingFrames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ScrollToTopButton", () => {
  it("is an icon-only button named for what it does", () => {
    render(<ScrollToTopButton />);

    expect(button()).toHaveTextContent("");
    expect(button().querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("is hidden at the top and shown after scrolling down", () => {
    render(<ScrollToTopButton />);
    expect(button()).not.toHaveAttribute("data-visible");

    scrollTo(900);
    expect(button()).toHaveAttribute("data-visible", "true");

    scrollTo(100);
    expect(button()).not.toHaveAttribute("data-visible");
  });

  it("scrolls to the top and moves focus to the page's focus target", () => {
    const top = document.createElement("div");
    top.id = "top";
    top.tabIndex = -1;
    document.body.append(top);
    const scroll = vi.fn();
    vi.stubGlobal("scrollTo", scroll);
    render(<ScrollToTopButton />);
    scrollTo(900);

    fireEvent.click(button());

    expect(scroll).toHaveBeenCalledWith({ top: 0 });
    expect(document.activeElement).toBe(top);
  });
});
