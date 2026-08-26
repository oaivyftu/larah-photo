import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playOnPageReady } from "./playOnPageReady";

// The failure this guards is invisible rather than noisy: a page intro parked
// at `opacity: 0` waiting for a signal that never lands leaves the content
// gone with no error anywhere. So the interesting assertions here are about
// the fallback firing and the teardown actually cancelling.

const FALLBACK_DELAY = 1500;

beforeEach(() => {
  vi.useFakeTimers();
  delete document.documentElement.dataset["pageTransition"];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("playOnPageReady", () => {
  it("plays on the next frame when the page is already ready", () => {
    document.documentElement.dataset["pageTransition"] = "ready";
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const play = vi.fn();

    playOnPageReady(play);

    expect(raf).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
  });

  it("cancels that frame when torn down before it runs", () => {
    document.documentElement.dataset["pageTransition"] = "ready";
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(42);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");

    playOnPageReady(vi.fn())();

    expect(cancel).toHaveBeenCalledWith(42);
  });

  it("waits for larah:page-ready when the page is not ready yet", () => {
    const play = vi.fn();

    playOnPageReady(play);
    expect(play).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("larah:page-ready"));
    expect(play).toHaveBeenCalledOnce();
  });

  it("plays anyway once the fallback delay elapses", () => {
    const play = vi.fn();

    playOnPageReady(play);
    vi.advanceTimersByTime(FALLBACK_DELAY - 1);
    expect(play).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(play).toHaveBeenCalledOnce();
  });

  it("plays once, not twice, when the signal arrives and the timer would too", () => {
    const play = vi.fn();

    playOnPageReady(play);
    window.dispatchEvent(new Event("larah:page-ready"));
    vi.advanceTimersByTime(FALLBACK_DELAY * 2);

    expect(play).toHaveBeenCalledOnce();
  });

  it("ignores a second signal after the first has played", () => {
    const play = vi.fn();

    playOnPageReady(play);
    window.dispatchEvent(new Event("larah:page-ready"));
    window.dispatchEvent(new Event("larah:page-ready"));

    expect(play).toHaveBeenCalledOnce();
  });

  it("stops listening and stops the timer when torn down", () => {
    const play = vi.fn();

    playOnPageReady(play)();

    window.dispatchEvent(new Event("larah:page-ready"));
    vi.advanceTimersByTime(FALLBACK_DELAY * 2);
    expect(play).not.toHaveBeenCalled();
  });
});
