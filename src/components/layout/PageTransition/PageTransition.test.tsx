import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// This component intercepts every click on the site and decides whether to
// take over the navigation. That makes it the highest-consequence file in the
// app: a branch that stops returning early breaks Cmd-click, downloads,
// external links, in-page anchors or the Studio -- each of which looks fine
// until someone tries it.
//
// The curtain animation is CSS. What is tested here is the decision table in
// front of it, plus the accessibility work it does after a route change:
// moving focus to <main> and announcing the new title, which Next does not do.

const push = vi.fn();
let pathname = "/";

// One stable object, as Next's own useRouter returns. A fresh object per
// render would re-run the click effect every time, and its cleanup clears the
// pending navigation -- so the transition would never actually route.
const router = { push };

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => router,
}));

const { PageTransition } = await import("./PageTransition");

const TRANSITION_DURATION = 780;
const PUSH_DELAY = TRANSITION_DURATION - 260;

function link(attributes: Record<string, string>, text = "Go") {
  const anchor = document.createElement("a");
  for (const [name, value] of Object.entries(attributes)) {
    anchor.setAttribute(name, value);
  }
  anchor.textContent = text;
  document.body.append(anchor);

  return anchor;
}

/** A left click that a real anchor would act on. */
function clickLink(anchor: HTMLElement, init: MouseEventInit = {}) {
  return fireEvent.click(anchor, { button: 0, bubbles: true, ...init });
}

function settle() {
  act(() => void vi.advanceTimersByTime(TRANSITION_DURATION));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  push.mockReset();
  pathname = "/";
  window.history.pushState({}, "", "/");
  document.body.innerHTML = "";
  delete document.documentElement.dataset["pageTransition"];
  delete document.documentElement.dataset["modalNavigation"];
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the reveal cycle", () => {
  it("marks the document ready and fires page-ready once the curtain lifts", () => {
    const ready = vi.fn();
    window.addEventListener("larah:page-ready", ready);
    render(<PageTransition />);

    expect(document.documentElement.dataset["pageTransition"]).toBe(
      "revealing",
    );

    settle();

    expect(document.documentElement.dataset["pageTransition"]).toBe("ready");
    // Page intros are parked at opacity: 0 waiting for exactly this.
    expect(ready).toHaveBeenCalledOnce();
    window.removeEventListener("larah:page-ready", ready);
  });

  it("stays silent on the very first load", () => {
    // The first pass is the initial page load, not a navigation -- announcing
    // there would talk over the screen reader already reading the page.
    render(<PageTransition />);
    settle();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces the new title and moves focus after a real navigation", () => {
    const main = document.createElement("div");
    main.id = "main-content";
    main.tabIndex = -1;
    document.body.append(main);
    document.title = "Work — Larah Photo";

    const { rerender } = render(<PageTransition />);
    settle();

    pathname = "/work";
    rerender(<PageTransition />);
    settle();

    // Next leaves focus on <body>, so a keyboard user would resume from the
    // top of the document with no signal that anything changed.
    expect(main).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Work — Larah Photo");
  });

  it("still moves focus when the visitor navigates before the first cycle ends", () => {
    // The regression this guards: the "have we navigated yet" flag used to be
    // set inside the idle timeout. A visitor who followed a link sooner than
    // TRANSITION_DURATION after load cancelled that timeout on the way out, so
    // the flag was still false when the next cycle checked it -- and that
    // navigation silently skipped both the focus move and the announcement.
    //
    // Reduced-motion visitors hit it most: their content is on screen straight
    // away, so they can click sooner. Found by the browser journey for US2 AS2
    // in spec 012, and pinned here so the push gate catches it without one.
    const main = document.createElement("div");
    main.id = "main-content";
    main.tabIndex = -1;
    document.body.append(main);
    document.title = "About — Larah Photo";

    const { rerender } = render(<PageTransition />);

    // Deliberately short of a full cycle -- this is the whole point.
    act(() => void vi.advanceTimersByTime(TRANSITION_DURATION - 100));

    pathname = "/about";
    rerender(<PageTransition />);
    settle();

    expect(main).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("About — Larah Photo");
  });

  it("skips the whole cycle for a modal navigation", () => {
    // The modal owns focus and announces itself, and the page underneath has
    // not changed.
    document.documentElement.dataset["modalNavigation"] = "true";
    const ready = vi.fn();
    window.addEventListener("larah:page-ready", ready);

    render(<PageTransition />);

    expect(document.documentElement.dataset["pageTransition"]).toBe("ready");
    expect(document.documentElement.dataset["modalNavigation"]).toBeUndefined();
    settle();
    expect(ready).not.toHaveBeenCalled();
    window.removeEventListener("larah:page-ready", ready);
  });

  it("renders nothing inside the Studio", () => {
    pathname = "/studio/desk";
    const { container } = render(<PageTransition />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("taking over an internal navigation", () => {
  it("covers the screen, then routes after the curtain is down", () => {
    render(<PageTransition />);
    settle();

    clickLink(link({ href: "/work" }));

    expect(document.documentElement.dataset["pageTransition"]).toBe("covering");
    expect(push).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(PUSH_DELAY));
    expect(push).toHaveBeenCalledWith("/work");
  });

  it("carries the query and hash through to the destination", () => {
    render(<PageTransition />);
    settle();

    clickLink(link({ href: "/work?filter=wedding#grid" }));
    act(() => void vi.advanceTimersByTime(PUSH_DELAY));

    expect(push).toHaveBeenCalledWith("/work?filter=wedding#grid");
  });

  it("follows a click on something inside the link", () => {
    render(<PageTransition />);
    settle();
    const anchor = link({ href: "/work" }, "");
    const span = document.createElement("span");
    anchor.append(span);

    clickLink(span);
    act(() => void vi.advanceTimersByTime(PUSH_DELAY));

    expect(push).toHaveBeenCalledWith("/work");
  });

  it("restarts the countdown when a second link is clicked mid-cover", () => {
    render(<PageTransition />);
    settle();

    clickLink(link({ href: "/work" }));
    act(() => void vi.advanceTimersByTime(PUSH_DELAY - 50));
    clickLink(link({ href: "/about" }));
    act(() => void vi.advanceTimersByTime(PUSH_DELAY));

    expect(push).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/about");
  });

  it("cancels a pending route change on unmount", () => {
    const { unmount } = render(<PageTransition />);
    settle();

    clickLink(link({ href: "/work" }));
    unmount();
    act(() => void vi.advanceTimersByTime(PUSH_DELAY * 2));

    expect(push).not.toHaveBeenCalled();
  });
});

describe("clicks it must not take over", () => {
  function expectIgnored() {
    act(() => void vi.advanceTimersByTime(TRANSITION_DURATION * 2));
    expect(push).not.toHaveBeenCalled();
    expect(document.documentElement.dataset["pageTransition"]).not.toBe(
      "covering",
    );
  }

  beforeEach(() => {
    render(<PageTransition />);
    settle();
  });

  it.each([
    ["Cmd-click, which opens a new tab", { metaKey: true }],
    ["Ctrl-click", { ctrlKey: true }],
    ["Shift-click, which opens a new window", { shiftKey: true }],
    ["Alt-click, which downloads", { altKey: true }],
  ])("leaves %s to the browser", (_case, modifier) => {
    clickLink(link({ href: "/work" }), modifier);

    expectIgnored();
  });

  it("leaves a middle click alone", () => {
    clickLink(link({ href: "/work" }), { button: 1 });

    expectIgnored();
  });

  it("leaves a link that opens in a new tab alone", () => {
    clickLink(link({ href: "/work", target: "_blank" }));

    expectIgnored();
  });

  it("leaves a download alone", () => {
    clickLink(link({ href: "/press-kit.zip", download: "" }));

    expectIgnored();
  });

  it("leaves an external link alone", () => {
    clickLink(link({ href: "https://instagram.com/larah" }));

    expectIgnored();
  });

  it("leaves a click that is not on a link alone", () => {
    const button = document.createElement("button");
    document.body.append(button);

    clickLink(button);

    expectIgnored();
  });

  it("leaves an in-page anchor alone, so the browser can scroll to it", () => {
    clickLink(link({ href: "#main-content" }));

    expectIgnored();
  });

  it("leaves a link to the current page alone", () => {
    clickLink(link({ href: "/" }));

    expectIgnored();
  });

  it("leaves a link into the Studio alone", () => {
    clickLink(link({ href: "/studio" }));

    expectIgnored();
  });

  it("leaves an already-handled click alone", () => {
    // The component listens on `document` in the capture phase, so only a
    // listener earlier in that phase -- window -- can have acted first. A
    // handler on the anchor itself runs later and cannot be what this guard
    // is for.
    const anchor = link({ href: "/work" });
    const handled = (event: Event) => event.preventDefault();
    window.addEventListener("click", handled, true);

    clickLink(anchor);
    window.removeEventListener("click", handled, true);

    expectIgnored();
  });

  it("flags a modal route instead of covering the screen", () => {
    // The intercepted modal opens over the current page; a curtain would
    // hide the page it is supposed to open on top of.
    clickLink(link({ href: "/work/harbour-light", "data-modal-route": "" }));

    expect(document.documentElement.dataset["modalNavigation"]).toBe("true");
    expectIgnored();
  });
});

describe("going back from a modal", () => {
  it("flags the back navigation so the curtain stays down", () => {
    pathname = "/work";
    render(<PageTransition />);
    settle();
    window.history.pushState({}, "", "/work/harbour-light");

    fireEvent(window, new PopStateEvent("popstate"));

    expect(document.documentElement.dataset["modalNavigation"]).toBe("true");
  });

  it("leaves an ordinary back navigation to the normal cycle", () => {
    pathname = "/about";
    render(<PageTransition />);
    settle();
    window.history.pushState({}, "", "/work");

    fireEvent(window, new PopStateEvent("popstate"));

    expect(document.documentElement.dataset["modalNavigation"]).toBeUndefined();
  });
});
