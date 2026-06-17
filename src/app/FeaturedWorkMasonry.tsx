"use client";

import { type ReactNode, useEffect, useRef } from "react";
import type Isotope from "isotope-layout";

type FeaturedWorkMasonryProps = {
  children: ReactNode;
  className: string;
  columnSizerClassName: string;
  gutterSizerClassName: string;
};

export function FeaturedWorkMasonry({
  children,
  className,
  columnSizerClassName,
  gutterSizerClassName,
}: FeaturedWorkMasonryProps) {
  const masonryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = masonryRef.current;

    if (!container) {
      return;
    }

    let isotope: Isotope | undefined;
    let cleanupImagesLoaded: (() => void) | undefined;
    let cancelled = false;

    async function initMasonry(masonryElement: HTMLDivElement) {
      const [{ default: IsotopeLayout }, { default: imagesLoaded }] =
        await Promise.all([
          import("isotope-layout"),
          import("imagesloaded"),
        ]);

      if (cancelled) {
        return;
      }

      isotope = new IsotopeLayout(masonryElement, {
        itemSelector: "[data-featured-work-item]",
        layoutMode: "masonry",
        percentPosition: true,
        transitionDuration: "260ms",
        masonry: {
          columnWidth: `.${columnSizerClassName}`,
          gutter: `.${gutterSizerClassName}`,
        },
      });

      const tracker = imagesLoaded(masonryElement);
      const handleProgress = () => isotope?.layout();
      const handleAlways = () => isotope?.layout();

      tracker.on("progress", handleProgress);
      tracker.on("always", handleAlways);

      cleanupImagesLoaded = () => {
        tracker.off("progress", handleProgress);
        tracker.off("always", handleAlways);
      };
    }

    void initMasonry(container);

    return () => {
      cancelled = true;
      cleanupImagesLoaded?.();
      isotope?.destroy();
    };
  }, [columnSizerClassName, gutterSizerClassName]);

  return (
    <div className={className} ref={masonryRef}>
      <div className={columnSizerClassName} aria-hidden="true" />
      <div className={gutterSizerClassName} aria-hidden="true" />
      {children}
    </div>
  );
}
