/**
 * Page intros are parked at their `from` state — `opacity: 0` — until the page
 * transition curtain lifts and dispatches `larah:page-ready`. If that signal
 * never lands, the content stays invisible with no way back, so the wait is
 * always bounded by a fallback.
 *
 * Returns a teardown that cancels whichever wait is still outstanding.
 */
const INTRO_FALLBACK_DELAY = 1500;

export function playOnPageReady(play: () => void) {
  if (document.documentElement.dataset.pageTransition === "ready") {
    const frame = requestAnimationFrame(play);

    return () => cancelAnimationFrame(frame);
  }

  // Declared before `fallbackTimeout` so it can clear it, and hoisted so the
  // const below can still reference it as the timeout's callback.
  function playOnce() {
    clearTimeout(fallbackTimeout);
    window.removeEventListener("larah:page-ready", playOnce);
    play();
  }

  const fallbackTimeout = setTimeout(playOnce, INTRO_FALLBACK_DELAY);

  window.addEventListener("larah:page-ready", playOnce);

  return () => {
    clearTimeout(fallbackTimeout);
    window.removeEventListener("larah:page-ready", playOnce);
  };
}
