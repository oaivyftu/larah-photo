import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The hook every page-entry animation goes through, extracted in feature 010
// from four hand-written copies. GSAP is mocked at the module boundary because
// it needs layout to do anything real; what the test owns is the wiring around
// it, which is where the two behaviours that matter live:
//
//   1. Under `prefers-reduced-motion: reduce` the timeline is never built, so
//      nothing is parked at opacity: 0. Get this wrong and the page is blank
//      for exactly the users least able to work out why.
//   2. Teardown kills the timeline and cancels the pending play. A page
//      navigated away from mid-intro must not animate a detached tree.

const timeline = {
  play: vi.fn(),
  kill: vi.fn(),
  from: vi.fn(),
};
const matchMediaAdd = vi.fn();
const matchMediaRevert = vi.fn();
const stopWaiting = vi.fn();
// Typed with its parameter so `mock.calls[0][0]` is the play callback rather
// than an element of an empty tuple.
const playOnPageReady = vi.fn<(play: () => void) => () => void>(
  () => stopWaiting,
);

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    timeline: () => timeline,
    matchMedia: () => ({ add: matchMediaAdd, revert: matchMediaRevert }),
  },
}));

// useGSAP normally defers to its own scope handling; here it just runs the
// callback on mount and its returned cleanup on unmount, which is the contract
// the hook relies on.
vi.mock("@gsap/react", async () => {
  const { useEffect } = await import("react");

  return {
    useGSAP: (callback: () => (() => void) | void) => {
      // Mount-only, matching useGSAP's own default of an empty dependency
      // list. The lint rule wants `callback` here, and adding it would change
      // the behaviour under test: the real hook does not re-run the builder
      // when the caller passes a new inline function on re-render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      useEffect(() => callback(), []);
    },
  };
});

vi.mock("./playOnPageReady", () => ({
  playOnPageReady: (play: () => void) => playOnPageReady(play),
}));

const { usePageIntro } = await import("./usePageIntro");

/** Runs whatever the hook registered for the no-preference media query. */
function runNoPreferenceBranch() {
  const [query, callback] = matchMediaAdd.mock.calls.at(-1) ?? [];

  expect(query).toBe("(prefers-reduced-motion: no-preference)");

  return (callback as () => (() => void) | void)();
}

function Page({ build = vi.fn() }: { build?: (intro: unknown) => void }) {
  const ref = usePageIntro<HTMLDivElement>(build);

  return <div data-testid="root" ref={ref} />;
}

/** The same page, but carrying a heading for the reveal to find. */
function PageWithHeading({
  build = vi.fn(),
}: {
  build?: (intro: unknown) => void;
}) {
  const ref = usePageIntro<HTMLDivElement>(build);

  return (
    <div data-testid="root" ref={ref}>
      <h1 data-page-heading>
        <span>Selected</span>
        <span>work</span>
      </h1>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("usePageIntro", () => {
  it("attaches the ref it returns to the page root", () => {
    const { getByTestId } = render(<Page />);

    expect(getByTestId("root")).toBeInTheDocument();
  });

  it("guards the whole timeline behind no-preference", () => {
    // The guard is the point: under `reduce` the callback never runs, so the
    // page renders at its natural state instead of waiting to be animated in.
    const build = vi.fn();
    render(<Page build={build} />);

    expect(matchMediaAdd).toHaveBeenCalledOnce();
    expect(matchMediaAdd.mock.calls[0]?.[0]).toBe(
      "(prefers-reduced-motion: no-preference)",
    );
    expect(build).not.toHaveBeenCalled();
  });

  it("builds the caller's timeline once the query matches", () => {
    const build = vi.fn();
    render(<Page build={build} />);

    runNoPreferenceBranch();

    expect(build).toHaveBeenCalledOnce();
    expect(build).toHaveBeenCalledWith(timeline);
  });

  it("waits for the page-ready signal rather than playing immediately", () => {
    // The intro is parked until the page transition curtain lifts; playing on
    // mount would run it behind the curtain where nobody sees it.
    render(<Page />);

    runNoPreferenceBranch();

    expect(playOnPageReady).toHaveBeenCalledOnce();
    expect(timeline.play).not.toHaveBeenCalled();
  });

  it("plays from the start when the signal lands", () => {
    render(<Page />);
    runNoPreferenceBranch();

    const play = playOnPageReady.mock.calls[0]?.[0] as () => void;
    play();

    expect(timeline.play).toHaveBeenCalledWith(0);
  });

  it("kills the timeline and stops waiting when the branch is torn down", () => {
    render(<Page />);

    const teardown = runNoPreferenceBranch();
    teardown?.();

    expect(stopWaiting).toHaveBeenCalledOnce();
    expect(timeline.kill).toHaveBeenCalledOnce();
  });

  it("reverts matchMedia on unmount", () => {
    const { unmount } = render(<Page />);

    unmount();

    expect(matchMediaRevert).toHaveBeenCalledOnce();
  });

  it("does not rebuild the timeline when the component re-renders", () => {
    // The four hand-written copies built once on mount; the hook must not
    // change that, or a parent re-render would restart the intro.
    const build = vi.fn();
    const { rerender } = render(<Page build={build} />);
    runNoPreferenceBranch();

    rerender(<Page build={build} />);

    expect(matchMediaAdd).toHaveBeenCalledOnce();
    expect(build).toHaveBeenCalledOnce();
  });
});

describe("usePageIntro heading reveal", () => {
  // Feature 012 moved this tween here from four route components that each
  // carried a byte-identical copy. The point of the move is that a browser
  // test asserting the reveal now says something about all four routes rather
  // than one, so these tests guard the thing that makes that true.

  it("reveals the page heading before the caller's own tweens", () => {
    const build = vi.fn((intro: unknown) => {
      (intro as typeof timeline).from("[data-work-card]", {});
    });
    render(<PageWithHeading build={build} />);

    runNoPreferenceBranch();

    const targets = timeline.from.mock.calls.map(([target]) => target);

    expect(targets).toEqual(["[data-page-heading] > span", "[data-work-card]"]);
  });

  it("reveals it with the values the four copies shared", () => {
    render(<PageWithHeading />);

    runNoPreferenceBranch();

    expect(timeline.from).toHaveBeenCalledWith("[data-page-heading] > span", {
      yPercent: 115,
      opacity: 0,
      rotate: 2,
      duration: 0.82,
      stagger: 0.07,
      ease: "power4.out",
    });
  });

  it("adds no heading tween when the page has no heading", () => {
    // Without the guard GSAP gets a selector matching nothing, which warns and
    // leaves the page's own tweens positioned against an empty slot -- so a
    // relative offset like "-=0.42" would silently mean something else.
    const build = vi.fn();
    render(<Page build={build} />);

    runNoPreferenceBranch();

    expect(timeline.from).not.toHaveBeenCalled();
    expect(build).toHaveBeenCalledOnce();
  });

  it("does not reveal it under reduced motion", () => {
    // The branch never runs, so the heading is never parked at opacity: 0.
    render(<PageWithHeading />);

    expect(timeline.from).not.toHaveBeenCalled();
  });
});
