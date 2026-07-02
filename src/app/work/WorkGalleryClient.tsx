"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { WorkFilters } from "@/components/work/WorkFilters/WorkFilters";
import { WorkMasonryGrid } from "@/components/work/WorkMasonryGrid/WorkMasonryGrid";
import { WorkProjectGallery } from "@/components/work/WorkProjectGallery/WorkProjectGallery";
import { formatWorkCategory } from "@/data/work";
import type { Project } from "@/types/project";
import type { WorkPageContent } from "@/types/site";
import styles from "./work.module.scss";

gsap.registerPlugin(useGSAP);

const ALL_FILTER = "all";

type WorkGalleryClientProps = {
  content: WorkPageContent;
  projects: Project[];
};

export function WorkGalleryClient({ content, projects }: WorkGalleryClientProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-work-title] span", {
          yPercent: 105,
          opacity: 0,
          duration: 0.78,
          stagger: 0.045,
          ease: "power4.out",
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section className={styles["work-page"]} ref={rootRef} aria-labelledby="work-title">
      <div className={styles["work-page__hero"]}>
        <p className={styles["work-page__eyebrow"]}>{content.eyebrow}</p>
        <h1 className={styles["work-page__title"]} data-work-title id="work-title">
          {content.titleWords.map((word) => (
            <span key={word}>
              <span>{word}</span>
            </span>
          ))}
        </h1>
      </div>

      <div className={styles["work-page__toolbar"]}>
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
        onSelectProject={setSelectedProject}
        variant="work"
      />

      {selectedProject ? (
        <WorkProjectGallery
          isModal
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      ) : null}
    </section>
  );
}
