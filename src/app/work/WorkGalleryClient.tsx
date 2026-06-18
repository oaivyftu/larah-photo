"use client";

import { useMemo, useState } from "react";
import { formatWorkCategory } from "@/data/work";
import { WorkFilters } from "@/components/work/WorkFilters/WorkFilters";
import { WorkMasonryGrid } from "@/components/work/WorkMasonryGrid/WorkMasonryGrid";
import type { Project } from "@/types/project";
import styles from "./work.module.scss";

const ALL_FILTER = "all";

type WorkGalleryClientProps = {
  projects: Project[];
};

export function WorkGalleryClient({ projects }: WorkGalleryClientProps) {
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);

  const filterOptions = useMemo(
    () => [
      { label: "All", value: ALL_FILTER },
      ...Array.from(new Set(projects.map((project) => project.category))).map(
        (category) => ({
          label: formatWorkCategory(category),
          value: category,
        }),
      ),
    ],
    [projects],
  );

  return (
    <>
      <div className={styles["work-page__header"]}>
        <h1 className={styles["work-page__title"]} id="work-title">
          Recent Work <span>— Enjoy!</span>
        </h1>
        <WorkFilters
          activeFilter={activeFilter}
          filters={filterOptions}
          onFilterChange={setActiveFilter}
        />
      </div>
      <WorkMasonryGrid
        activeFilter={activeFilter}
        items={projects}
        titleSuffix=" -"
        variant="work"
      />
    </>
  );
}
