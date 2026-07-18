"use client";

import Image from "next/image";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type Flickity from "flickity";
import "flickity/css/flickity.css";
import "flickity-fade/flickity-fade.css";
import { icons } from "@/constants/icons";
import { Icon } from "@/components/ui/Icon/Icon";
import type { Project, ProjectImage } from "@/types/project";
import styles from "./WorkProjectGallery.module.scss";

const CONTROLS_IDLE_DELAY = 1600;
const AUTO_HIDE_MEDIA =
  "(hover: hover) and (pointer: fine) and (min-width: 761px)";

type WorkProjectGalleryClientProps = {
  images: ProjectImage[];
  isModal: boolean;
  onClose?: () => void;
  project: Project;
};

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

type GalleryFloatNavProps = {
  currentIndex: number;
  isModal: boolean;
  isVisible: boolean;
  onClose?: () => void;
  onControlsBlur: () => void;
  onControlsFocus: () => void;
  onControlsPointerEnter: () => void;
  onControlsPointerLeave: () => void;
  onNext: () => void;
  onPrevious: () => void;
  total: number;
};

function GalleryFloatNav({
  currentIndex,
  isModal,
  isVisible,
  onClose,
  onControlsBlur,
  onControlsFocus,
  onControlsPointerEnter,
  onControlsPointerLeave,
  onNext,
  onPrevious,
  total,
}: GalleryFloatNavProps) {
  const currentLabel = String(currentIndex + 1).padStart(2, "0");
  const totalLabel = String(total).padStart(2, "0");
  const hasMultipleSlides = total > 1;

  return (
    <nav
      aria-label="Gallery controls"
      className={`${styles["work-project-gallery__float-nav"]} ${
        isVisible
          ? styles["work-project-gallery__float-nav--visible"]
          : ""
      }`}
      onFocusCapture={onControlsFocus}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onControlsBlur();
        }
      }}
      onPointerEnter={onControlsPointerEnter}
      onPointerLeave={onControlsPointerLeave}
    >
      {isModal && onClose ? (
        <button
          aria-label="Close gallery"
          className={styles["work-project-gallery__float-close"]}
          onClick={onClose}
          type="button"
        >
          <Icon decorative icon={icons.close} />
        </button>
      ) : null}

      <div className={styles["work-project-gallery__float-controls"]}>
        <p
          aria-atomic="true"
          aria-live="polite"
          className={styles["work-project-gallery__float-counter"]}
        >
          <span aria-hidden="true">{currentLabel}</span>
          <span
            aria-hidden="true"
            className={styles["work-project-gallery__float-separator"]}
          >
            -
          </span>
          <span aria-hidden="true">{totalLabel}</span>
          <span className={styles["work-project-gallery__sr-only"]}>
            Image {currentIndex + 1} of {total}
          </span>
        </p>

        <button
          aria-label="Previous image"
          className={styles["work-project-gallery__float-button"]}
          disabled={!hasMultipleSlides}
          onClick={onPrevious}
          type="button"
        >
          <Icon decorative icon={icons.chevronLeft} />
        </button>
        <button
          aria-label="Next image"
          className={styles["work-project-gallery__float-button"]}
          disabled={!hasMultipleSlides}
          onClick={onNext}
          type="button"
        >
          <Icon decorative icon={icons.chevronRight} />
        </button>
      </div>
    </nav>
  );
}

export function WorkProjectGalleryClient({
  images,
  isModal,
  onClose,
  project,
}: WorkProjectGalleryClientProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const flickityRef = useRef<Flickity | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const controlsFocusedRef = useRef(false);
  const controlsHoveredRef = useRef(false);
  const canAutoHideControlsRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  const handleClose = useCallback(() => {
    if (isModal) {
      onClose?.();
    }
  }, [isModal, onClose]);

  const clearControlsTimer = useCallback(() => {
    if (controlsTimerRef.current === null) {
      return;
    }

    window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = null;
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsTimer();

    if (
      !canAutoHideControlsRef.current ||
      controlsFocusedRef.current ||
      controlsHoveredRef.current
    ) {
      return;
    }

    controlsTimerRef.current = window.setTimeout(() => {
      setAreControlsVisible(false);
      controlsTimerRef.current = null;
    }, CONTROLS_IDLE_DELAY);
  }, [clearControlsTimer]);

  const revealControls = useCallback(() => {
    setAreControlsVisible(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const keepControlsVisible = useCallback(() => {
    clearControlsTimer();
    setAreControlsVisible(true);
  }, [clearControlsTimer]);

  const handleControlsFocus = useCallback(() => {
    controlsFocusedRef.current = true;
    keepControlsVisible();
  }, [keepControlsVisible]);

  const handleControlsBlur = useCallback(() => {
    controlsFocusedRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handleControlsPointerEnter = useCallback(() => {
    controlsHoveredRef.current = true;
    keepControlsVisible();
  }, [keepControlsVisible]);

  const handleControlsPointerLeave = useCallback(() => {
    controlsHoveredRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handlePrevious = useCallback(() => {
    flickityRef.current?.previous(true);
  }, []);

  const handleNext = useCallback(() => {
    flickityRef.current?.next(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(AUTO_HIDE_MEDIA);

    const syncAutoHide = () => {
      canAutoHideControlsRef.current = mediaQuery.matches;
      clearControlsTimer();
      setAreControlsVisible(true);
      scheduleControlsHide();
    };

    syncAutoHide();
    mediaQuery.addEventListener("change", syncAutoHide);

    return () => {
      mediaQuery.removeEventListener("change", syncAutoHide);
      clearControlsTimer();
    };
  }, [clearControlsTimer, scheduleControlsHide]);

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
    let handleChange: ((index: number) => void) | null = null;
    const initializeFlickity = async () => {
      const { default: FlickityConstructor } = await import("flickity");
      await import("flickity-fade");

      if (cancelled) {
        return;
      }

      const flickityOptions = {
        adaptiveHeight: false,
        cellAlign: "center",
        contain: true,
        dragThreshold: 10,
        draggable: true,
        // friction: 1,
        // selectedAttraction: 0.5,
        imagesLoaded: true,
        pageDots: false,
        percentPosition: true,
        prevNextButtons: false,
        setGallerySize: false,
        freeScroll: false,
        lazyLoad: true,
        wrapAround: true,
        fade: true,
      } satisfies Flickity.Options & { fade: boolean };

      instance = new FlickityConstructor(carousel, flickityOptions);
      flickityRef.current = instance;
      handleChange = (index) => setCurrentIndex(index);
      instance.on("change", handleChange);
      setCurrentIndex(instance.selectedIndex);

      if (cancelled) {
        instance.off("change", handleChange);
        instance.destroy();
        instance = null;
        flickityRef.current = null;
      }
    };

    void initializeFlickity();

    return () => {
      cancelled = true;

      if (instance) {
        if (handleChange) {
          instance.off("change", handleChange);
        }
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();

        return;
      }

      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      const activeElement = document.activeElement;
      const isCarouselFocused =
        activeElement instanceof Element &&
        Boolean(carouselRef.current?.contains(activeElement));

      if (isCarouselFocused || images.length <= 1) {
        return;
      }

      event.preventDefault();
      revealControls();

      if (event.key === "ArrowLeft") {
        handlePrevious();
      } else {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleClose,
    handleNext,
    handlePrevious,
    images.length,
    isModal,
    revealControls,
  ]);

  return (
    <section
      aria-labelledby={`work-gallery-title-${project.slug}`}
      className={`${styles["work-project-gallery"]} ${
        isModal
          ? styles["work-project-gallery--modal"]
          : styles["work-project-gallery--page"]
      }`}
      onKeyDown={revealControls}
      onClick={isModal ? handleClose : undefined}
      onPointerDown={revealControls}
      onPointerEnter={revealControls}
      onPointerMove={revealControls}
    >
      <div
        aria-labelledby={
          isModal ? `work-gallery-title-${project.slug}` : undefined
        }
        aria-modal={isModal ? true : undefined}
        className={styles["work-project-gallery__panel"]}
        onClick={isModal ? (event) => event.stopPropagation() : undefined}
        role={isModal ? "dialog" : undefined}
      >
        <h2
          className={styles["work-project-gallery__sr-only"]}
          id={`work-gallery-title-${project.slug}`}
        >
          {project.title} gallery
        </h2>

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

        <GalleryFloatNav
          currentIndex={currentIndex}
          isModal={isModal}
          isVisible={areControlsVisible}
          onClose={onClose ? handleClose : undefined}
          onControlsBlur={handleControlsBlur}
          onControlsFocus={handleControlsFocus}
          onControlsPointerEnter={handleControlsPointerEnter}
          onControlsPointerLeave={handleControlsPointerLeave}
          onNext={handleNext}
          onPrevious={handlePrevious}
          total={images.length}
        />
      </div>
    </section>
  );
}
