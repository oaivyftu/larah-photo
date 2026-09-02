"use client";

import { useMemo, useState } from "react";
import { usePageIntro } from "@/utils/usePageIntro";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import { WorkFilters } from "@/components/work/WorkFilters/WorkFilters";
import { WorkMasonryGrid } from "@/components/work/WorkMasonryGrid/WorkMasonryGrid";
import type { Project } from "@/types/project";
import type { WorkPageContent } from "@/types/site";
import { formatWorkCategory } from "@/utils/formatWorkCategory";
import styles from "./work.module.scss";

const ALL_FILTER = "all";

type WorkGalleryClientProps = {
  content: WorkPageContent;
  projects: Project[];
};

export function WorkGalleryClient({
  content,
  projects,
}: WorkGalleryClientProps) {
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);
  const [filterAnnouncement, setFilterAnnouncement] = useState("");
  const filters = useMemo(() => {
    const categories = Array.from(
      new Set(projects.map((project) => project.category)),
    );

    return [
      { label: "All", value: ALL_FILTER },
      ...categories.map((category) => ({
        label: formatWorkCategory(category),
        value: category,
      })),
    ];
  }, [projects]);

  // Filtering rearranges the grid silently — Isotope just hides cards, so a
  // screen reader user gets no confirmation that anything happened, nor how
  // much is left. Announced on the interaction rather than from an effect, so
  // the initial render stays quiet.
  function handleFilterChange(filter: string) {
    setActiveFilter(filter);

    const matches =
      filter === ALL_FILTER
        ? projects
        : projects.filter((project) => project.category === filter);
    const label =
      filters.find((entry) => entry.value === filter)?.label ?? filter;

    setFilterAnnouncement(
      `${label}: ${matches.length} ${matches.length === 1 ? "project" : "projects"}`,
    );
  }

  const rootRef = usePageIntro<HTMLElement>((intro) => {
    intro.from(
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
  });

  return (
    <section
      className={styles["work-page"]}
      ref={rootRef}
      aria-labelledby="work-title"
    >
      <div className={styles["work-page__hero"]}>
        <PageHeading id="work-title" words={content.titleWords} />

        <div className={styles["work-page__toolbar"]} data-work-filter>
          <WorkFilters
            activeFilter={activeFilter}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      <p
        aria-atomic="true"
        aria-live="polite"
        className={styles["work-page__announcer"]}
        role="status"
      >
        {filterAnnouncement}
      </p>

      <WorkMasonryGrid
        activeFilter={activeFilter}
        className={styles["work-page__grid"]}
        items={projects}
        variant="work"
      />
    </section>
  );
}
