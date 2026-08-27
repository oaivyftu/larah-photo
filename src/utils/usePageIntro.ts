"use client";

import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { playOnPageReady } from "@/utils/playOnPageReady";

// Registered once, at this module's scope, rather than at the top of every
// page component. Four copies of this line is what feature 010 removed.
gsap.registerPlugin(useGSAP);

/**
 * The page-entry animation every route shares: build a paused timeline, play
 * it once the page is ready, and skip the whole thing under `reduce`.
 *
 * Returns the ref the page attaches to its root element, which is also the
 * timeline's scope — so selectors inside `buildIntro` resolve within the page
 * rather than the document.
 *
 * `buildIntro` runs once, on mount. It is not re-run when the component
 * re-renders, which is the behaviour the four hand-written copies had.
 */
export function usePageIntro<T extends HTMLElement>(
  buildIntro: (intro: gsap.core.Timeline) => void,
): RefObject<T | null> {
  const rootRef = useRef<T>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Under `reduce` the timeline is never built, so nothing is parked at
      // `opacity: 0` and the page renders at its natural state right away.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ paused: true });
        buildIntro(intro);

        const stopWaitingForPage = playOnPageReady(() => intro.play(0));

        return () => {
          stopWaitingForPage();
          intro.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return rootRef;
}
