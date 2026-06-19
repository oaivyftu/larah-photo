"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, ProjectImage } from "@/types/project";
import styles from "./WorkProjectGallery.module.scss";

type WorkProjectGalleryClientProps = {
  closeHref?: string;
  images: ProjectImage[];
  isModal: boolean;
  project: Project;
  showFullStoryLink: boolean;
};

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function WorkProjectGalleryClient({
  closeHref = "/work",
  images,
  isModal,
  project,
  showFullStoryLink,
}: WorkProjectGalleryClientProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    isDragging: false,
    pointerId: 0,
    scrollLeft: 0,
    startX: 0,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const totalLabel = String(images.length).padStart(2, "0");

  const slideIds = useMemo(
    () => images.map((image, index) => `${project.slug}-slide-${index}-${image.src}`),
    [images, project.slug],
  );

  const updateActiveIndex = useCallback(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    Array.from(scroller.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const distance = Math.abs(scrollerCenter - childCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  const scrollToIndex = useCallback(
    (nextIndex: number) => {
      const scroller = scrollerRef.current;
      const slide = scroller?.children[nextIndex] as HTMLElement | undefined;

      if (!scroller || !slide) {
        return;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      const offset =
        slide.offsetLeft - (scrollerRect.width - slideRect.width) / 2;

      scroller.scrollTo({ behavior: "smooth", left: offset });
      setActiveIndex(nextIndex);
    },
    [],
  );

  const goToPrevious = useCallback(() => {
    scrollToIndex((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, scrollToIndex]);

  const goToNext = useCallback(() => {
    scrollToIndex((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, scrollToIndex]);

  const closeGallery = useCallback(() => {
    if (isModal) {
      router.back();
      return;
    }

    router.push(closeHref);
  }, [closeHref, isModal, router]);

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    updateActiveIndex();

    const handleScroll = () => updateActiveIndex();

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateActiveIndex]);

  return (
    <section
      aria-labelledby="work-gallery-title"
      className={`${styles["work-project-gallery"]} ${
        isModal
          ? styles["work-project-gallery--modal"]
          : styles["work-project-gallery--page"]
      }`}
    >
      <div
        aria-labelledby={isModal ? "work-gallery-title" : undefined}
        aria-modal={isModal ? true : undefined}
        className={styles["work-project-gallery__panel"]}
        role={isModal ? "dialog" : undefined}
      >
        <header className={styles["work-project-gallery__header"]}>
          <p
            aria-label={`Image ${activeIndex + 1} of ${images.length}`}
            className={styles["work-project-gallery__counter"]}
          >
            <span>{formatIndex(activeIndex)}</span>
            <span aria-hidden="true">-</span>
            <span>{totalLabel}</span>
          </p>
          <div className={styles["work-project-gallery__title-block"]}>
            <p className={styles["work-project-gallery__meta"]}>
              {project.service}
            </p>
            <h1
              className={styles["work-project-gallery__title"]}
              id="work-gallery-title"
            >
              {project.title}
            </h1>
          </div>
          <button
            className={styles["work-project-gallery__close"]}
            onClick={closeGallery}
            type="button"
          >
            Close
          </button>
        </header>

        <div
          className={`${styles["work-project-gallery__slider"]} ${
            isDragging ? styles["work-project-gallery__slider--dragging"] : ""
          }`}
          onPointerCancel={() => {
            dragRef.current.isDragging = false;
            setIsDragging(false);
          }}
          onPointerDown={(event) => {
            const scroller = scrollerRef.current;

            if (!scroller) {
              return;
            }

            dragRef.current = {
              isDragging: true,
              pointerId: event.pointerId,
              scrollLeft: scroller.scrollLeft,
              startX: event.clientX,
            };
            scroller.setPointerCapture(event.pointerId);
            setIsDragging(true);
          }}
          onPointerLeave={() => {
            dragRef.current.isDragging = false;
            setIsDragging(false);
          }}
          onPointerMove={(event) => {
            const scroller = scrollerRef.current;

            if (!scroller || !dragRef.current.isDragging) {
              return;
            }

            event.preventDefault();
            scroller.scrollLeft =
              dragRef.current.scrollLeft -
              (event.clientX - dragRef.current.startX);
          }}
          onPointerUp={(event) => {
            const scroller = scrollerRef.current;

            dragRef.current.isDragging = false;
            setIsDragging(false);
            scroller?.releasePointerCapture(event.pointerId);
          }}
          onWheel={(event) => {
            const scroller = scrollerRef.current;

            if (!scroller || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
              return;
            }

            scroller.scrollLeft += event.deltaY;
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goToPrevious();
            }

            if (event.key === "ArrowRight") {
              event.preventDefault();
              goToNext();
            }
          }}
          ref={scrollerRef}
          tabIndex={0}
        >
          {images.map((image, index) => (
            <figure
              aria-label={`${index + 1} of ${images.length}: ${image.alt}`}
              className={`${styles["work-project-gallery__slide"]} ${
                image.height > image.width
                  ? styles["work-project-gallery__slide--portrait"]
                  : styles["work-project-gallery__slide--landscape"]
              }`}
              id={slideIds[index]}
              key={slideIds[index]}
            >
              <Image
                alt={image.alt}
                className={styles["work-project-gallery__image"]}
                height={image.height}
                priority={index === 0}
                sizes="(max-width: 760px) 86vw, 74vw"
                src={image.src}
                width={image.width}
              />
            </figure>
          ))}
        </div>

        <footer className={styles["work-project-gallery__footer"]}>
          <div className={styles["work-project-gallery__actions"]}>
            <button
              className={styles["work-project-gallery__control"]}
              onClick={goToPrevious}
              type="button"
            >
              Previous
            </button>
            <button
              className={styles["work-project-gallery__control"]}
              onClick={goToNext}
              type="button"
            >
              Next
            </button>
          </div>
          {showFullStoryLink ? (
            <a
              className={styles["work-project-gallery__story-link"]}
              href={`/work/${project.slug}`}
            >
              View full story
            </a>
          ) : (
            <p className={styles["work-project-gallery__description"]}>
              {project.description}
            </p>
          )}
        </footer>
      </div>
    </section>
  );
}
