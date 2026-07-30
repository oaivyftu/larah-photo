"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type Flickity from "flickity";
import "flickity/css/flickity.css";
import "flickity-fade/flickity-fade.css";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { icons } from "@/constants/icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { usePointerLabel } from "@/components/ui/GlassPointer/usePointerLabel";
import type { Project, ProjectImage } from "@/types/project";
import styles from "./WorkProjectGallery.module.scss";

const CONTROLS_IDLE_DELAY = 1600;
// Resting on the controls earns a longer grace period, but never an exemption:
// after clicking next/previous the cursor sits on the nav, so an exemption
// would keep it on screen forever.
const CONTROLS_HOVER_IDLE_DELAY = 2600;
const AUTO_HIDE_MEDIA =
  "(hover: hover) and (pointer: fine) and (min-width: 761px)";
const DRAGGABLE_MEDIA =
  "(max-width: 760px), (hover: none), (pointer: coarse)";

type WorkProjectGalleryClientProps = {
  images: ProjectImage[];
  initialIndex: number;
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
      <LarahImage
        alt={image.alt}
        blurDataURL={image.blurDataURL}
        className={styles["work-project-gallery__image"]}
        draggable={false}
        height={image.height}
        sizes="(max-width: 760px) 86vw, 74vw"
        src={image.src}
        width={image.width}
        style={{
          objectFit: "contain",
          objectPosition: "center",
        }}
      />
    </figure>
  );
});

type GalleryFloatNavProps = {
  currentIndex: number;
  isModal: boolean;
  isVisible: boolean;
  navRef: RefObject<HTMLElement | null>;
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
  navRef,
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
      ref={navRef}
      onFocusCapture={onControlsFocus}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onControlsBlur();
        }
      }}
      onPointerEnter={onControlsPointerEnter}
      onPointerLeave={onControlsPointerLeave}
      onPointerMove={onControlsPointerEnter}
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
  initialIndex,
  isModal,
  onClose,
  project,
}: WorkProjectGalleryClientProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const flickityRef = useRef<Flickity | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const controlsFocusedRef = useRef(false);
  const controlsHoveredRef = useRef(false);
  const canAutoHideControlsRef = useRef(false);
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const {
    hidePointerLabel: hideCloseHint,
    pointerLabelHandlers: closeHintHandlers,
  } = usePointerLabel<HTMLDivElement>("Close");

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

    // Keyboard focus is the only thing that pins the controls open — a focused
    // button that fades out would strand the user mid-tab-order.
    if (!canAutoHideControlsRef.current || controlsFocusedRef.current) {
      return;
    }

    controlsTimerRef.current = window.setTimeout(
      () => {
        setAreControlsVisible(false);
        controlsTimerRef.current = null;
      },
      controlsHoveredRef.current
        ? CONTROLS_HOVER_IDLE_DELAY
        : CONTROLS_IDLE_DELAY,
    );
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
    hideCloseHint();
    keepControlsVisible();
  }, [hideCloseHint, keepControlsVisible]);

  const handleControlsBlur = useCallback(() => {
    controlsFocusedRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handleControlsPointerEnter = useCallback(() => {
    controlsHoveredRef.current = true;
    hideCloseHint();
    revealControls();
  }, [hideCloseHint, revealControls]);

  const handleControlsPointerLeave = useCallback(() => {
    controlsHoveredRef.current = false;
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const handlePrevious = useCallback(() => {
    revealControls();
    flickityRef.current?.previous(true);
  }, [revealControls]);

  const handleNext = useCallback(() => {
    revealControls();
    flickityRef.current?.next(true);
  }, [revealControls]);

  const handleCarouselClick = useCallback(() => {
    if (!isModal || !window.matchMedia(AUTO_HIDE_MEDIA).matches) {
      return;
    }

    handleClose();
  }, [handleClose, isModal]);

  const isPointerOverControls = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const controls = controlsRef.current;

      // A hidden nav is not a surface — the "Close" hint should still show over
      // the space it used to occupy.
      if (!controls || !areControlsVisible) {
        return false;
      }

      const bounds = controls.getBoundingClientRect();

      return (
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom
      );
    },
    [areControlsVisible],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(AUTO_HIDE_MEDIA);

    const syncAutoHide = () => {
      canAutoHideControlsRef.current = isModal && mediaQuery.matches;
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
  }, [clearControlsTimer, isModal, scheduleControlsHide]);

  useEffect(() => {
    if (!isModal) {
      return;
    }

    const handlePointerActivity = (event: PointerEvent) => {
      const last = lastPointerPositionRef.current;

      // Hiding the nav flips it to `pointer-events: none`, which can hand the
      // cursor to the carousel underneath and fire enter events even though
      // nothing moved. Only real movement counts as activity, otherwise the
      // controls flicker back on the moment they hide.
      if (last && last.x === event.clientX && last.y === event.clientY) {
        return;
      }

      lastPointerPositionRef.current = { x: event.clientX, y: event.clientY };
      revealControls();
    };

    window.addEventListener("pointermove", handlePointerActivity, {
      passive: true,
    });

    return () => {
      lastPointerPositionRef.current = null;
      window.removeEventListener("pointermove", handlePointerActivity);
    };
  }, [isModal, revealControls]);

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
        cellAlign: "left",
        contain: true,
        dragThreshold: 10,
        draggable: window.matchMedia(DRAGGABLE_MEDIA).matches,
        // friction: 1,
        // selectedAttraction: 0.5,
        imagesLoaded: true,
        initialIndex,
        pageDots: false,
        percentPosition: true,
        prevNextButtons: false,
        setGallerySize: false,
        freeScroll: true,
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
  }, [images, initialIndex]);

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
          onClick={handleCarouselClick}
          onDragStart={(event) => event.preventDefault()}
          onPointerEnter={(event) => {
            if (isModal) {
              if (isPointerOverControls(event)) {
                hideCloseHint();
              } else {
                closeHintHandlers.onPointerEnter(event);
              }
            }
          }}
          onPointerLeave={(event) => {
            if (isModal) {
              closeHintHandlers.onPointerLeave(event);
            }
          }}
          onPointerMove={(event) => {
            if (isModal) {
              if (isPointerOverControls(event)) {
                hideCloseHint();
              } else {
                closeHintHandlers.onPointerMove(event);
              }
            }
          }}
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
          navRef={controlsRef}
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
