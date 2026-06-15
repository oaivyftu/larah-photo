"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatWorkCategory } from "@/data/work";
import type { Project } from "@/types/project";
import styles from "./work.module.scss";

const ALL_FILTER = "all";
const COLUMN_COUNT = 3;

type WorkGalleryClientProps = {
  projects: Project[];
};

function createColumns(projects: Project[]) {
  return projects.reduce<Project[][]>((columns, project, index) => {
    columns[index % COLUMN_COUNT].push(project);
    return columns;
  }, Array.from({ length: COLUMN_COUNT }, () => []));
}

export function WorkGalleryClient({ projects }: WorkGalleryClientProps) {
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);

  const filterOptions = useMemo(
    () => [
      ALL_FILTER,
      ...Array.from(new Set(projects.map((project) => project.category))),
    ],
    [projects],
  );

  const filteredProjects = useMemo(() => {
    if (activeFilter === ALL_FILTER) {
      return projects;
    }

    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter, projects]);

  const columns = useMemo(() => createColumns(filteredProjects), [filteredProjects]);

  return (
    <>
      <div className={styles["work-page__header"]}>
        <h1 className={styles["work-page__title"]} id="work-title">
          Recent Work <span>— Enjoy!</span>
        </h1>
        <div className={styles["work-page__filters"]}>
          <span className={styles["work-page__filters-label"]}>Filters:</span>
          {filterOptions.map((filter) => {
            const isActive = filter === activeFilter;
            const label =
              filter === ALL_FILTER ? "All" : formatWorkCategory(filter);

            return (
              <button
                aria-pressed={isActive}
                className={`${styles["work-page__filter"]} ${
                  isActive ? styles["work-page__filter--active"] : ""
                }`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles["work-page__grid"]}>
        {columns.map((column, columnIndex) => (
          <div className={styles["work-page__column"]} key={columnIndex}>
            {column.map((project) => (
              <article className={styles["work-page__card"]} key={project.slug}>
                <Link
                  className={styles["work-page__card-link"]}
                  href={`/work/${project.slug}`}
                >
                  <Image
                    className={styles["work-page__image"]}
                    src={project.image}
                    alt={project.imageAlt}
                    width={project.width}
                    height={project.height}
                    sizes="(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 31vw"
                  />
                  <span className={styles["work-page__card-title"]}>
                    {project.title} -
                  </span>
                  <span className={styles["work-page__card-meta"]}>
                    {project.meta}
                  </span>
                </Link>
              </article>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
