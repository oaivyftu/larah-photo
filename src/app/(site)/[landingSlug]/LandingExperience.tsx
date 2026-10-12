"use client";

import { usePageIntro } from "@/utils/usePageIntro";
import styles from "./landing.module.scss";

type LandingExperienceProps = {
  children: React.ReactNode;
};

/**
 * The landing page's entry animation, and nothing else. The page itself is
 * rendered on the server and arrives as `children`, so only this wrapper needs
 * the browser (the same shape as `JournalPostClient`). The heading's mask
 * reveal comes from `usePageIntro`; the introduction and each section then
 * rise in behind it. Under reduced motion `usePageIntro` builds no timeline,
 * so nothing is parked at `opacity: 0` and everything is simply there
 * (spec 014 FR-033).
 */
export function LandingExperience({ children }: LandingExperienceProps) {
  const rootRef = usePageIntro<HTMLDivElement>((intro) => {
    intro.from(
      "[data-landing-intro], [data-landing-section]",
      {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.09,
        ease: "power3.out",
      },
      "-=0.4",
    );
  });

  return (
    <div className={styles["landing"]} data-landing-page ref={rootRef}>
      {children}
    </div>
  );
}
