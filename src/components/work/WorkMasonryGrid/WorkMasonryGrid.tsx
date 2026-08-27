"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Isotope from "isotope-layout";
import type { Project } from "@/types/project";
import { WorkCard } from "../WorkCard/WorkCard";
import styles from "./WorkMasonryGrid.module.scss";

const ALL_FILTER = "all";
const ITEM_SELECTOR = `.${styles["work-layout__item"]}`;
const COLUMN_SIZER_SELECTOR = `.${styles["work-layout__sizer"]}`;
const GUTTER_SIZER_SELECTOR = `.${styles["work-layout__gutter-sizer"]}`;
const SKELETON_COLUMNS = [
  ["tall", "short"],
  ["medium", "tall"],
  ["short", "medium"],
  ["medium", "short"],
] as const;

type WorkMasonryGridProps = {
  activeFilter?: string;
  className?: string;
  items: Project[];
  titleSuffix?: string;
  variant: "homepage" | "work";
};

// Only the homepage collage spans columns; the work index is uniform-width.
function getHomepageSpan(project: Project) {
  return project.placement?.homepageSpan ?? 4;
}

export function WorkMasonryGrid({
  activeFilter = ALL_FILTER,
  className,
  items,
  titleSuffix,
  variant,
}: WorkMasonryGridProps) {
  const activeFilterRef = useRef(activeFilter);
  const layoutRef = useRef<Isotope | undefined>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isMasonryReady, setIsMasonryReady] = useState(false);

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
      filter === ALL_FILTER ||
      item.getAttribute("data-work-category") === filter
    );
  }, []);

  useEffect(() => {
    const container = gridRef.current;

    if (!container) {
      return;
    }

    let cancelled = false;

    async function initMasonry(masonryElement: HTMLDivElement) {
      const { default: IsotopeLayout } = await import("isotope-layout");

      if (cancelled) {
        return;
      }

      const instance = new IsotopeLayout(masonryElement, {
        filter: filterItem,
        initLayout: true,
        itemSelector: ITEM_SELECTOR,
        layoutMode: "masonry",
        masonry: {
          columnWidth: COLUMN_SIZER_SELECTOR,
          gutter: GUTTER_SIZER_SELECTOR,
        },
        percentPosition: true,
        transitionDuration: "260ms",
      });

      const handleFirstLayoutComplete = () => {
        if (!cancelled) {
          setIsMasonryReady(true);
        }
      };

      layoutRef.current = instance;
      instance.once("layoutComplete", handleFirstLayoutComplete);
      instance.arrange({ filter: filterItem });
    }

    void initMasonry(container).catch(() => {
      if (!cancelled) {
        setIsMasonryReady(true);
      }
    });

    return () => {
      cancelled = true;
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
      aria-busy={!isMasonryReady}
    >
      {!isMasonryReady && (
        <div
          aria-hidden="true"
          className={`${styles["work-layout__skeleton"]} ${styles["work-layout__skeleton--visible"]}`}
        >
          {SKELETON_COLUMNS.map((column, columnIndex) => (
            <div
              className={styles["work-layout__skeleton-column"]}
              key={columnIndex}
            >
              {column.map((size, blockIndex) => (
                <span
                  className={`${styles["work-layout__skeleton-block"]} ${
                    styles[`work-layout__skeleton-block--${size}`]
                  }`}
                  key={`${size}-${blockIndex}`}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <div
        className={`${styles["work-layout__grid"]} ${
          isMasonryReady
            ? styles["work-layout__grid--ready"]
            : styles["work-layout__grid--pending"]
        }`}
        ref={gridRef}
      >
        <div className={styles["work-layout__sizer"]} aria-hidden="true" />
        <div
          className={styles["work-layout__gutter-sizer"]}
          aria-hidden="true"
        />
        {sortedItems.map((project) => {
          const spanClass =
            variant === "homepage"
              ? styles[`work-layout__item--span-${getHomepageSpan(project)}`]
              : "";

          return (
            <WorkCard
              className={`${styles["work-layout__item"]} ${spanClass}`}
              key={project.id}
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
