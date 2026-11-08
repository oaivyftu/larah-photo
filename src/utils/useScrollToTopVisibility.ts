"use client";

import { useEffect, useState } from "react";

// How far the page must scroll, as a share of the viewport's height, before the
// scroll-to-top button appears. One line serves both directions: it shows once
// the reader is past it and hides again when they scroll back up across it.
export const SCROLL_TO_TOP_THRESHOLD = 0.8;

// A page can mark one element with this attribute to move the line: the button
// then waits until that element has scrolled out of the top of the viewport
// instead of using the viewport-height rule above. The home page marks its
// manifesto, so the button stays away until the opening sequence is behind the
// reader.
export const SCROLL_TO_TOP_AFTER_ATTRIBUTE = "data-scroll-to-top-after";

// What GSAP's ScrollTrigger wraps a pinned element in. While pinned the element
// itself is `position: fixed` and so reports no useful position; its wrapper
// keeps the element's place in the flow, plus the distance it is held for.
const PIN_SPACER_SELECTOR = ".pin-spacer";

function hasScrolledFarEnough() {
  const anchor = document.querySelector(`[${SCROLL_TO_TOP_AFTER_ATTRIBUTE}]`);
  if (anchor) {
    const section = anchor.closest(PIN_SPACER_SELECTOR) ?? anchor;
    return section.getBoundingClientRect().bottom <= 0;
  }

  // `scrollY` goes negative during iOS's rubber-band at the top.
  const y = Math.max(0, window.scrollY);
  return y > window.innerHeight * SCROLL_TO_TOP_THRESHOLD;
}

/**
 * Whether the page has scrolled far enough to offer a way back to the top.
 * Only state is decided here; where the button sits and how it fades is the
 * stylesheet's business.
 */
export function useScrollToTopVisibility(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setVisible(hasScrolledFarEnough());
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    // A reload restores the scroll position before this runs.
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    // The line depends on the viewport's height, which a phone's browser chrome
    // and a rotation both change.
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return visible;
}
