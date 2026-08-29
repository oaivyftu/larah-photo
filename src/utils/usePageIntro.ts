"use client";

import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { playOnPageReady } from "@/utils/playOnPageReady";

// Registered once, at this module's scope, rather than at the top of every
// page component. Four copies of this line is what feature 010 removed.
gsap.registerPlugin(useGSAP);

/**
 * The page heading's mask reveal, which every route with a `PageHeading` gets.
 *
 * This lived in four route components, written out identically, until feature
 * 012 -- and that was the problem: a browser test asserting the reveal on one
 * route would have reported success while the other three drifted. One
 * definition is what makes testing it mean anything (spec 012 FR-007, SC-008).
 *
 * The seven values stay here rather than moving to `src/constants/`. Principle
 * IV forbids motion values *duplicated across components*, which this no longer
 * is; after the consolidation there is exactly one call site, and a shared
 * constants file whose entries have one reader each is a second dictionary
 * rather than a shared decision.
 */
const HEADING_REVEAL = {
  yPercent: 115,
  opacity: 0,
  rotate: 2,
  duration: 0.82,
  stagger: 0.07,
  ease: "power4.out",
} as const;

const HEADING_TARGET = "[data-page-heading] > span";

/**
 * The page-entry animation every route shares: reveal the heading, let the page
 * add its own tweens, play the result once the page is ready, and skip the
 * whole thing under `reduce`.
 *
 * Returns the ref the page attaches to its root element, which is also the
 * timeline's scope -- so selectors inside `buildIntro` resolve within the page
 * rather than the document.
 *
 * `buildIntro` runs once, on mount. It is not re-run when the component
 * re-renders, which is the behaviour the four hand-written copies had. It
 * receives a timeline that already contains the heading reveal, so a page's
 * first tween can still position itself relative to it -- `"-=0.42"` and the
 * like keep working unchanged.
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

        // Guarded rather than unconditional: a page with no `PageHeading` would
        // otherwise hand GSAP a selector matching nothing, which warns and
        // leaves the page's own tweens positioned against an empty slot.
        if (rootRef.current?.querySelector(HEADING_TARGET)) {
          intro.from(HEADING_TARGET, HEADING_REVEAL);
        }

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
