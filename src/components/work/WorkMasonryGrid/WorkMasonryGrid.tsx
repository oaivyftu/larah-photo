"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type Isotope from "isotope-layout";
import type { Project } from "@/types/project";
import { WorkCard } from "../WorkCard/WorkCard";
import styles from "./WorkMasonryGrid.module.scss";

const ALL_FILTER = "all";
const ITEM_SELECTOR = `.${styles["work-layout__item"]}`;
const COLUMN_SIZER_SELECTOR = `.${styles["work-layout__sizer"]}`;
const GUTTER_SIZER_SELECTOR = `.${styles["work-layout__gutter-sizer"]}`;

type WorkMasonryGridProps = {
  activeFilter?: string;
  className?: string;
  items: Project[];
  onSelectProject: (project: Project) => void;
  titleSuffix?: string;
  variant: "homepage" | "work";
};

function getSpan(project: Project, variant: WorkMasonryGridProps["variant"]) {
  const span =
    variant === "homepage"
      ? project.placement?.homepageSpan
      : project.placement?.workSpan;

  return span ?? (variant === "homepage" ? 4 : 3);
}

export function WorkMasonryGrid({
  activeFilter = ALL_FILTER,
  className,
  items,
  onSelectProject,
  titleSuffix,
  variant,
}: WorkMasonryGridProps) {
  const activeFilterRef = useRef(activeFilter);
  const layoutRef = useRef<Isotope | undefined>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);

  const sortedItems = useMemo(() => {
    if (variant !== "homepage") {
      return items;
    }

    return [...items].sort(
      (itemA, itemB) =>
        (itemA.placement?.featuredOrder ?? 0) -
        (itemB.placement?.featuredOrder ?? 0),
    );
  }, [items, variant]);

  const filterItem = useCallback((item: Element) => {
    const filter = activeFilterRef.current;

    return (
      filter === ALL_FILTER || item.getAttribute("data-work-category") === filter
    );
  }, []);

  useEffect(() => {
    const container = gridRef.current;

    if (!container) {
      return;
    }

    let cleanupImagesLoaded: (() => void) | undefined;
    let cancelled = false;

    async function initMasonry(masonryElement: HTMLDivElement) {
      const [{ default: IsotopeLayout }, { default: imagesLoaded }] =
        await Promise.all([import("isotope-layout"), import("imagesloaded")]);

      if (cancelled) {
        return;
      }

      layoutRef.current = new IsotopeLayout(masonryElement, {
        filter: filterItem,
        itemSelector: ITEM_SELECTOR,
        layoutMode: "masonry",
        masonry: {
          columnWidth: COLUMN_SIZER_SELECTOR,
          gutter: GUTTER_SIZER_SELECTOR,
        },
        percentPosition: true,
        transitionDuration: "260ms",
      });

      const tracker = imagesLoaded(masonryElement);
      const handleLayout = () => layoutRef.current?.layout();

      tracker.on("progress", handleLayout);
      tracker.on("always", handleLayout);

      cleanupImagesLoaded = () => {
        tracker.off("progress", handleLayout);
        tracker.off("always", handleLayout);
      };
    }

    void initMasonry(container);

    return () => {
      cancelled = true;
      cleanupImagesLoaded?.();
      layoutRef.current?.destroy();
      layoutRef.current = undefined;
    };
  }, [filterItem]);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
    layoutRef.current?.arrange({ filter: filterItem });
  }, [activeFilter, filterItem]);

  return (
    <div
      className={`${styles["work-layout"]} ${
        styles[`work-layout--${variant}`]
      } ${className ?? ""}`}
    >
      <div className={styles["work-layout__grid"]} ref={gridRef}>
        <div className={styles["work-layout__sizer"]} aria-hidden="true" />
        <div
          className={styles["work-layout__gutter-sizer"]}
          aria-hidden="true"
        />
        {sortedItems.map((project) => {
          const span = getSpan(project, variant);

          return (
            <WorkCard
              className={`${styles["work-layout__item"]} ${
                styles[`work-layout__item--span-${span}`]
              }`}
              key={project.id}
              onSelectProject={onSelectProject}
              project={project}
              titleSuffix={titleSuffix}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
}
