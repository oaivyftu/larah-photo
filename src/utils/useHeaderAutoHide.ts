"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// Pixels of scroll that count as movement. A trackpad resting on a page or a
// momentum tail reports a pixel or two the other way, which would flick the
// header in and out without the reader having changed direction.
const SCROLL_NOISE = 4;

type HeaderAutoHide<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  /** The header's measured height, 0 until the first measurement. */
  height: number;
  /**
   * The page has been scrolled past the header, so it has left the flow and
   * is parked above the viewport (or showing, if `revealed`).
   */
  floating: boolean;
  /** Floating *and* currently on screen: the reader is scrolling back up. */
  revealed: boolean;
};

/**
 * Hide the header when scrolling down, bring it back when scrolling up.
 *
 * Nothing changes until the page has scrolled further than the header is tall;
 * above that it is an ordinary block at the top of the page. Past it the
 * header becomes `floating`, and `revealed` follows the scroll direction. It
 * stays floating until the page is back at the very top, where the floating and
 * the in-flow positions coincide, so handing it back to the flow cannot be seen.
 *
 * The hook only decides *state*; where the header sits and how it slides is the
 * stylesheet's business.
 */
export function useHeaderAutoHide<
  T extends HTMLElement = HTMLElement,
>(): HeaderAutoHide<T> {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);
  const [floating, setFloating] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // The scroll handler runs outside React's render, so it reads these rather
  // than the state above, which it would only ever see stale.
  const heightRef = useRef(0);
  const floatingRef = useRef(false);
  const revealedRef = useRef(false);
  const lastY = useRef(0);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    const measure = () => {
      heightRef.current = header.offsetHeight;
      setHeight(header.offsetHeight);
    };

    // The scroll effect below reads this straight away, before the observer's
    // first callback has had a chance to run.
    heightRef.current = header.offsetHeight;

    if (typeof ResizeObserver === "undefined") {
      measure();
      return;
    }
    // Fires once on observe, and again whenever the header changes height: it
    // wraps at tablet widths and is a single row on a phone.
    const observer = new ResizeObserver(measure);
    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const apply = (nextFloating: boolean, nextRevealed: boolean) => {
      if (floatingRef.current !== nextFloating) {
        floatingRef.current = nextFloating;
        setFloating(nextFloating);
      }
      if (revealedRef.current !== nextRevealed) {
        revealedRef.current = nextRevealed;
        setRevealed(nextRevealed);
      }
    };

    // `scrollY` goes negative during iOS's rubber-band at the top.
    const readY = () => Math.max(0, window.scrollY);

    // A reload restores the scroll position before this runs: start in the
    // state that position implies, hidden, rather than waiting for a scroll.
    lastY.current = readY();
    if (lastY.current > heightRef.current && heightRef.current > 0) {
      apply(true, false);
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = readY();

      if (y <= 0) {
        lastY.current = 0;
        apply(false, false);
        return;
      }

      const delta = y - lastY.current;
      if (Math.abs(delta) < SCROLL_NOISE) return;
      lastY.current = y;

      const nextFloating = floatingRef.current || y > heightRef.current;
      apply(nextFloating, nextFloating && delta < 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    // A link parked above the viewport can still take focus from Tab; showing
    // the header keeps the focused element visible.
    const onFocusIn = () => {
      if (floatingRef.current) apply(true, true);
    };

    const header = ref.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    header?.addEventListener("focusin", onFocusIn);

    return () => {
      window.removeEventListener("scroll", onScroll);
      header?.removeEventListener("focusin", onFocusIn);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, height, floating, revealed };
}
