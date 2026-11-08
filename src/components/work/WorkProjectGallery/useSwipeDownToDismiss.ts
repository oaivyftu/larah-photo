import { useEffect, useRef, type RefObject } from "react";

// What the stylesheet reads. The hook writes nothing but these two custom
// properties and one state attribute, so no React state changes per touchmove
// and the component never re-renders mid-gesture.
export const SWIPE_DRAG_Y = "--gallery-drag-y";
export const SWIPE_DRAG_PROGRESS = "--gallery-drag-progress";
export const SWIPE_STATE = "data-swipe";

// How far a finger has to travel before the gesture is read as one thing or
// the other. Matches Flickity's own `dragThreshold`, so a horizontal swipe is
// claimed by the carousel at the same moment this decides to leave it alone.
const AXIS_LOCK_DISTANCE = 10;
// Let go past the lesser of these and the viewer leaves; short of it, it
// springs back. A fixed distance alone would be a long reach on a tall phone.
const DISMISS_DISTANCE = 160;
const DISMISS_VIEWPORT_RATIO = 0.2;
// The dim behind the viewer is gone by this much travel.
const PROGRESS_VIEWPORT_RATIO = 0.6;
// A flick is dismissal even when it is short: fast enough, and far enough that
// it was not a twitch.
const FLICK_VELOCITY = 0.5; // px per ms
const FLICK_MIN_DISTANCE = 24;
const VELOCITY_WINDOW = 80; // ms of recent movement the speed is read from
// The CSS transition ends the animation; this only covers the case where
// `transitionend` never arrives (an interrupted transition, a hidden tab).
const SETTLE_FALLBACK = 600;

type Sample = { y: number; t: number };

type Gesture = {
  startX: number;
  startY: number;
  // `pending` until the finger has moved far enough to tell which way it is
  // going; then locked for the rest of the gesture.
  mode: "pending" | "dismiss" | "ignore";
  // Where the finger already was when the gesture locked, so the viewer starts
  // moving from zero instead of jumping by the lock distance.
  lockOffset: number;
  travel: number;
  samples: Sample[];
};

function releaseVelocity(samples: Sample[]) {
  const first = samples[0];
  const last = samples[samples.length - 1];

  if (!first || !last || last.t <= first.t) {
    return 0;
  }

  return (last.y - first.y) / (last.t - first.t);
}

type Options = {
  enabled: boolean;
  onDismiss: () => void;
};

/**
 * Swiping down on the full-screen photograph pushes it off the bottom of the
 * screen and closes it.
 *
 * Touch events, not pointer events, because that is what Flickity listens to
 * on a touch device: this runs on the section, which the touch reaches before
 * `window`, so a swipe locked as vertical can be kept from Flickity by stopping
 * it there. Flickity never sees those moves and never starts a horizontal drag
 * out of a downward one. `touchend` and `touchcancel` are deliberately left to
 * reach it -- it unbinds its own listeners on them, and swallowing them would
 * leave it believing a finger was still down.
 *
 * Only downward, only one finger. A horizontal swipe, an upward one and a
 * pinch are left entirely to the carousel.
 */
export function useSwipeDownToDismiss(
  rootRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  { enabled, onDismiss }: Options,
) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const root = rootRef.current;

    if (!enabled || !root) {
      return;
    }

    let gesture: Gesture | null = null;
    let settling: "dismissing" | "returning" | null = null;
    let dismissed = false;
    let fallbackTimer: number | undefined;

    const prefersReducedMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setDrag = (travel: number, progress: number) => {
      root.style.setProperty(SWIPE_DRAG_Y, `${travel}px`);
      root.style.setProperty(SWIPE_DRAG_PROGRESS, String(progress));
    };

    const reset = () => {
      window.clearTimeout(fallbackTimer);
      settling = null;
      root.removeAttribute(SWIPE_STATE);
      root.style.removeProperty(SWIPE_DRAG_Y);
      root.style.removeProperty(SWIPE_DRAG_PROGRESS);
    };

    // The viewer is gone once the parent unmounts it; until then it stays where
    // the animation left it, off the bottom of the screen.
    const finishDismiss = () => {
      if (dismissed) {
        return;
      }

      dismissed = true;
      window.clearTimeout(fallbackTimer);
      onDismissRef.current();
    };

    const settle = (state: "dismissing" | "returning") => {
      settling = state;
      root.setAttribute(SWIPE_STATE, state);

      if (state === "dismissing") {
        setDrag(window.innerHeight, 1);
      } else {
        setDrag(0, 0);
      }

      // No slide for someone who asked for less motion: the viewer simply
      // goes, or comes back, where the finger left it.
      if (prefersReducedMotion()) {
        if (state === "dismissing") {
          finishDismiss();
        } else {
          reset();
        }

        return;
      }

      fallbackTimer = window.setTimeout(
        state === "dismissing" ? finishDismiss : reset,
        SETTLE_FALLBACK,
      );
    };

    const cancelGesture = () => {
      const current = gesture;
      gesture = null;

      if (current?.mode !== "dismiss") {
        return;
      }

      if (current.travel > 0) {
        settle("returning");
      } else {
        reset();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      // On its way out there is no taking it back; springing back is a
      // different matter, and a finger that lands in the middle of it is
      // simply the next gesture. It starts from rest rather than from wherever
      // the spring had got to, which is a few pixels at most by the time a hand
      // can get there again.
      if (settling === "dismissing") {
        return;
      }

      if (settling === "returning") {
        reset();
      }

      const touch = event.touches.item(0);

      if (event.touches.length !== 1 || !touch) {
        cancelGesture();
        return;
      }

      gesture = {
        startX: touch.clientX,
        startY: touch.clientY,
        mode: "pending",
        lockOffset: 0,
        travel: 0,
        samples: [],
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!gesture) {
        return;
      }

      const touch = event.touches.item(0);

      if (event.touches.length !== 1 || !touch) {
        cancelGesture();
        return;
      }

      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;

      if (gesture.mode === "pending") {
        if (Math.hypot(dx, dy) < AXIS_LOCK_DISTANCE) {
          return;
        }

        if (dy > 0 && dy > Math.abs(dx)) {
          gesture.mode = "dismiss";
          gesture.lockOffset = dy;
          root.setAttribute(SWIPE_STATE, "dragging");
        } else {
          gesture.mode = "ignore";
        }
      }

      if (gesture.mode !== "dismiss") {
        return;
      }

      // Ours from here on: keep it from Flickity, and from the browser.
      event.stopPropagation();

      if (event.cancelable) {
        event.preventDefault();
      }

      const now = performance.now();
      const travel = Math.max(0, dy - gesture.lockOffset);

      gesture.travel = travel;
      gesture.samples = [
        ...gesture.samples.filter(
          (sample) => now - sample.t <= VELOCITY_WINDOW,
        ),
        { y: touch.clientY, t: now },
      ];
      setDrag(
        travel,
        Math.min(1, travel / (window.innerHeight * PROGRESS_VIEWPORT_RATIO)),
      );
    };

    const handleTouchEnd = () => {
      const current = gesture;
      gesture = null;

      if (current?.mode !== "dismiss") {
        return;
      }

      const distance = Math.min(
        DISMISS_DISTANCE,
        window.innerHeight * DISMISS_VIEWPORT_RATIO,
      );
      // Speed is read from the last moments *before the finger lifts*, not from
      // the last moments of movement: a drag that stopped and rested for a
      // beat was not a flick, however fast it was going before it stopped.
      const lifted = performance.now();
      const recent = current.samples.filter(
        (sample) => lifted - sample.t <= VELOCITY_WINDOW,
      );
      const flicked =
        releaseVelocity(recent) > FLICK_VELOCITY &&
        current.travel >= FLICK_MIN_DISTANCE;

      if (current.travel > distance || flicked) {
        settle("dismissing");
      } else if (current.travel > 0) {
        settle("returning");
      } else {
        reset();
      }
    };

    // Only the panel's own `transform` ends the animation: the float nav and
    // the carousel also transition transforms, and those bubble up here.
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (
        !settling ||
        event.target !== panelRef.current ||
        event.propertyName !== "transform"
      ) {
        return;
      }

      if (settling === "dismissing") {
        finishDismiss();
      } else {
        reset();
      }
    };

    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    // Not passive: a locked swipe has to be able to cancel the browser's own
    // handling of it.
    root.addEventListener("touchmove", handleTouchMove, { passive: false });
    root.addEventListener("touchend", handleTouchEnd, { passive: true });
    root.addEventListener("touchcancel", cancelGesture, { passive: true });
    root.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      root.removeEventListener("touchstart", handleTouchStart);
      root.removeEventListener("touchmove", handleTouchMove);
      root.removeEventListener("touchend", handleTouchEnd);
      root.removeEventListener("touchcancel", cancelGesture);
      root.removeEventListener("transitionend", handleTransitionEnd);
      reset();
    };
  }, [enabled, panelRef, rootRef]);
}
