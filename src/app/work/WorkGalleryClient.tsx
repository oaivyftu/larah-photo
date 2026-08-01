"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import { WorkFilters } from "@/components/work/WorkFilters/WorkFilters";
import { WorkMasonryGrid } from "@/components/work/WorkMasonryGrid/WorkMasonryGrid";
import type { Project } from "@/types/project";
import type { WorkPageContent } from "@/types/site";
import { formatWorkCategory } from "@/utils/formatWorkCategory";
import styles from "./work.module.scss";

gsap.registerPlugin(useGSAP);

const ALL_FILTER = "all";

type WorkGalleryClientProps = {
  content: WorkPageContent;
  projects: Project[];
};

export function WorkGalleryClient({
  content,
  projects,
}: WorkGalleryClientProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);
  const filters = useMemo(() => {
    const categories = Array.from(new Set(projects.map((project) => project.category)));

    return [
      { label: "All", value: ALL_FILTER },
      ...categories.map((category) => ({
        label: formatWorkCategory(category),
        value: category,
      })),
    ];
  }, [projects]);

  useGSAP(
    () => {
      const intro = gsap.timeline({ paused: true });

      intro
        .from("[data-page-heading] > span", {
          yPercent: 115,
          opacity: 0,
          rotate: 2,
          duration: 0.82,
          stagger: 0.07,
          ease: "power4.out",
        })
        .from(
          "[data-work-filter], [data-work-card]",
          {
            y: 28,
            opacity: 0,
            duration: 0.72,
            stagger: 0.035,
            ease: "power3.out",
          },
          "-=0.38",
        );

      const playIntro = () => intro.play(0);

      if (document.documentElement.dataset.pageTransition === "ready") {
        requestAnimationFrame(playIntro);
      } else {
        window.addEventListener("larah:page-ready", playIntro, { once: true });
      }

      return () => {
        window.removeEventListener("larah:page-ready", playIntro);
        intro.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <section className={styles["work-page"]} ref={rootRef} aria-labelledby="work-title">
      <div className={styles["work-page__hero"]}>
        <PageHeading id="work-title" words={content.titleWords} />
      </div>

      <div className={styles["work-page__toolbar"]} data-work-filter>
        <WorkFilters
          activeFilter={activeFilter}
          filters={filters}
          onFilterChange={setActiveFilter}
        />
      </div>

      <WorkMasonryGrid
        activeFilter={activeFilter}
        className={styles["work-page__grid"]}
        items={projects}
        variant="work"
      />
    </section>
  );
}
