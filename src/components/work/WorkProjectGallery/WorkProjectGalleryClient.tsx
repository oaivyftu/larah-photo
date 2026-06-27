"use client";

import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type Flickity from "flickity";
import "flickity/css/flickity.css";
import type { Project, ProjectImage } from "@/types/project";
import styles from "./WorkProjectGallery.module.scss";

type WorkProjectGalleryClientProps = {
  images: ProjectImage[];
  isModal: boolean;
  project: Project;
};

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

const GallerySlide = memo(function GallerySlide({
  image,
  index,
  slideId,
  total,
}: {
  image: ProjectImage;
  index: number;
  slideId: string;
  total: number;
}) {
  const orientation = image.height > image.width ? "portrait" : "landscape";

  return (
    <figure
      aria-label={`${index + 1} of ${total}: ${image.alt}`}
      className={`${styles["work-project-gallery__slide"]} ${
        styles[`work-project-gallery__slide--${orientation}`]
      }`}
      id={slideId}
    >
      <Image
        alt={image.alt}
        className={styles["work-project-gallery__image"]}
        draggable={false}
        height={image.height}
        priority={index < 2}
        sizes="(max-width: 760px) 86vw, 74vw"
        src={image.src}
        width={image.width}
      />
    </figure>
  );
});

export function WorkProjectGalleryClient({
  images,
  isModal,
  project,
}: WorkProjectGalleryClientProps) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const flickityRef = useRef<Flickity | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const totalLabel = String(images.length).padStart(2, "0");
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const slideIds = useMemo(
    () =>
      images.map(
        (image, index) => `${project.slug}-slide-${index}-${image.src}`,
      ),
    [images, project.slug],
  );

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    let cancelled = false;
    let instance: Flickity | null = null;
    const handleSelect = (index: number) => setActiveIndex(index);

    const initializeFlickity = async () => {
      const { default: FlickityConstructor } = await import("flickity");

      if (cancelled) {
        return;
      }

      instance = new FlickityConstructor(carousel, {
        adaptiveHeight: false,
        cellAlign: "center",
        contain: true,
        dragThreshold: 10,
        draggable: true,
        friction: 0.35,
        imagesLoaded: true,
        pageDots: true,
        percentPosition: true,
        prevNextButtons: true,
        selectedAttraction: 0.04,
        setGallerySize: false,
      });
      flickityRef.current = instance;

      instance.on("select", handleSelect);
      setActiveIndex(instance.selectedIndex);

      if (cancelled) {
        instance.off("select", handleSelect);
        instance.destroy();
        instance = null;
        flickityRef.current = null;
      }
    };

    void initializeFlickity();

    return () => {
      cancelled = true;

      if (instance) {
        instance.off("select", handleSelect);
        instance.destroy();
        instance = null;
      }

      flickityRef.current = null;
    };
  }, [images]);

  useEffect(() => {
    if (!isModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isModal]);

  return (
    <section
      aria-labelledby="work-gallery-title"
      className={`${styles["work-project-gallery"]} ${
        isModal
          ? styles["work-project-gallery--modal"]
          : styles["work-project-gallery--page"]
      }`}
      onClick={isModal ? handleClose : undefined}
    >
      <div
        aria-labelledby={isModal ? "work-gallery-title" : undefined}
        aria-modal={isModal ? true : undefined}
        className={styles["work-project-gallery__panel"]}
        onClick={isModal ? (event) => event.stopPropagation() : undefined}
        role={isModal ? "dialog" : undefined}
      >
        <header className={styles["work-project-gallery__header"]}>
          <p
            aria-label={`Image ${activeIndex + 1} of ${images.length}`}
            aria-live="polite"
            className={styles["work-project-gallery__counter"]}
          >
            <span>{formatIndex(activeIndex)}</span>
            <span aria-hidden="true">-</span>
            <span>{totalLabel}</span>
          </p>
          <div className={styles["work-project-gallery__title-block"]}>
            <p className={styles["work-project-gallery__meta"]}>
              {project.serviceCategory}
            </p>
            <h1
              className={styles["work-project-gallery__title"]}
              id="work-gallery-title"
            >
              {project.title}
            </h1>
          </div>
          {isModal ? (
            <button
              className={styles["work-project-gallery__close"]}
              onClick={handleClose}
              type="button"
            >
              Close
            </button>
          ) : null}
        </header>

        <div
          aria-label={`${project.title} image gallery`}
          className={styles["work-project-gallery__carousel"]}
          onDragStart={(event) => event.preventDefault()}
          ref={carouselRef}
        >
          {images.map((image, index) => (
            <GallerySlide
              image={image}
              index={index}
              key={slideIds[index]}
              slideId={slideIds[index]}
              total={images.length}
            />
          ))}
        </div>

        <footer className={styles["work-project-gallery__footer"]}>
          <dl className={styles["work-project-gallery__details"]}>
            <div className={styles["work-project-gallery__detail"]}>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div className={styles["work-project-gallery__detail"]}>
              <dt>Location</dt>
              <dd>{project.location}</dd>
            </div>
            <div className={styles["work-project-gallery__detail"]}>
              <dt>Client / Subject</dt>
              <dd>{project.clientSubject}</dd>
            </div>
            <div className={styles["work-project-gallery__detail"]}>
              <dt>Service / Category</dt>
              <dd>{project.serviceCategory}</dd>
            </div>
          </dl>
          <div className={styles["work-project-gallery__summary"]}>
            <p className={styles["work-project-gallery__description"]}>
              {project.description}
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
