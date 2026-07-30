"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Isotope from "isotope-layout";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { Button } from "@/components/ui/Button/Button";
import { usePointerLabel } from "@/components/ui/GlassPointer/usePointerLabel";
import {
  getProjectGalleryImages,
  WorkProjectGallery,
} from "@/components/work/WorkProjectGallery/WorkProjectGallery";
import type { Project, ProjectImage } from "@/types/project";
import { formatWorkCategory } from "@/utils/formatWorkCategory";
import styles from "./WorkDetailGallery.module.scss";

const ITEM_SELECTOR = `.${styles["work-detail__item"]}`;
const COLUMN_SIZER_SELECTOR = `.${styles["work-detail__sizer"]}`;
const GUTTER_SIZER_SELECTOR = `.${styles["work-detail__gutter-sizer"]}`;

type WorkDetailGalleryProps = {
  presentation?: "modal" | "page";
  project: Project;
};

type GalleryItemProps = {
  image: ProjectImage;
  index: number;
  onImageLoad: () => void;
  onSelect: (index: number) => void;
};

function GalleryItem({
  image,
  index,
  onImageLoad,
  onSelect,
}: GalleryItemProps) {
  const { hidePointerLabel, pointerLabelHandlers } =
    usePointerLabel<HTMLButtonElement>("Zoom");
  const isWide = image.width / image.height >= 1.15;

  return (
    <article
      className={`${styles["work-detail__item"]} ${
        isWide ? styles["work-detail__item--wide"] : ""
      }`}
    >
      <button
        aria-label={`Open image ${index + 1}: ${image.alt}`}
        className={styles["work-detail__image-button"]}
        onClick={() => {
          hidePointerLabel();
          onSelect(index);
        }}
        type="button"
        {...pointerLabelHandlers}
      >
        <LarahImage
          alt={image.alt}
          blurDataURL={image.blurDataURL}
          className={styles["work-detail__image"]}
          height={image.height}
          onLoad={onImageLoad}
          sizes="(max-width: 620px) calc(100vw - 48px), (max-width: 900px) 100vw, 66vw"
          src={image.src}
          width={image.width}
        />
      </button>
    </article>
  );
}

export function WorkDetailGallery({
  presentation = "page",
  project,
}: WorkDetailGalleryProps) {
  const images = getProjectGalleryImages(project);
  const gridRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<Isotope | null>(null);
  const [isMasonryReady, setIsMasonryReady] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const relayout = useCallback(() => {
    window.requestAnimationFrame(() => layoutRef.current?.layout());
  }, []);

  useEffect(() => {
    const grid = gridRef.current;

    if (!grid) {
      return;
    }

    let cancelled = false;

    async function initializeMasonry(element: HTMLDivElement) {
      const { default: IsotopeLayout } = await import("isotope-layout");

      if (cancelled) {
        return;
      }

      const layout = new IsotopeLayout(element, {
        initLayout: true,
        itemSelector: ITEM_SELECTOR,
        layoutMode: "masonry",
        masonry: {
          columnWidth: COLUMN_SIZER_SELECTOR,
          gutter: GUTTER_SIZER_SELECTOR,
        },
        percentPosition: true,
        transitionDuration: "280ms",
      });

      layoutRef.current = layout;
      layout.once("layoutComplete", () => {
        if (!cancelled) {
          setIsMasonryReady(true);
        }
      });
      layout.layout();
    }

    void initializeMasonry(grid).catch(() => {
      if (!cancelled) {
        setIsMasonryReady(true);
      }
    });

    return () => {
      cancelled = true;
      layoutRef.current?.destroy();
      layoutRef.current = null;
    };
  }, []);

  return (
    <article
      className={`${styles["work-detail"]} ${
        presentation === "modal" ? styles["work-detail--modal"] : ""
      }`}
      aria-labelledby="work-detail-title"
    >
      <header className={styles["work-detail__header"]}>
        <div className={styles["work-detail__heading"]}>
          {presentation === "page" ? (
            <Button
              className={styles["work-detail__back"]}
              href="/work"
              size="small"
              variant="secondary"
            >
              All work
            </Button>
          ) : null}
          <p className={styles["work-detail__eyebrow"]}>
            {formatWorkCategory(project.category)}
          </p>
          <h1 className={styles["work-detail__title"]} id="work-detail-title">
            {project.title}
          </h1>
        </div>

        <p className={styles["work-detail__description"]}>
          {project.description}
        </p>

        <dl className={styles["work-detail__meta"]}>
          <div>
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{project.location}</dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>{project.serviceCategory}</dd>
          </div>
          <div>
            <dt>Images</dt>
            <dd>{String(images.length).padStart(2, "0")}</dd>
          </div>
        </dl>
      </header>

      <section
        aria-busy={!isMasonryReady}
        aria-label={`${project.title} album`}
        className={`${styles["work-detail__gallery"]} ${
          isMasonryReady ? styles["work-detail__gallery--ready"] : ""
        }`}
      >
        <div className={styles["work-detail__grid"]} ref={gridRef}>
          <div className={styles["work-detail__sizer"]} aria-hidden="true" />
          <div
            className={styles["work-detail__gutter-sizer"]}
            aria-hidden="true"
          />
          {images.map((image, index) => (
            <GalleryItem
              image={image}
              index={index}
              key={`${image.src}-${index}`}
              onImageLoad={relayout}
              onSelect={setSelectedImageIndex}
            />
          ))}
        </div>
      </section>

      {selectedImageIndex !== null ? (
        <WorkProjectGallery
          initialIndex={selectedImageIndex}
          isModal
          onClose={() => setSelectedImageIndex(null)}
          project={project}
        />
      ) : null}
    </article>
  );
}
