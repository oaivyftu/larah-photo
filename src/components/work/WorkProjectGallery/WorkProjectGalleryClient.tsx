"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type RefObject,
} from "react";
import type Flickity from "flickity";
import "flickity/css/flickity.css";
import "flickity-fade/flickity-fade.css";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
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
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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

function NavCloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles["work-project-gallery__float-close-icon"]}
      viewBox="0 0 24 24"
    >
      <path d="M5,5l14,14" />
      <path d="M19,5L5,19" />
    </svg>
  );
}

function NavArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden="true"
      className={styles["work-project-gallery__float-arrow-icon"]}
      viewBox="0 0 16 16"
    >
      {direction === "previous" ? (
        <>
          <path d="M3,8h10" />
          <path d="M6,5l-3,3" />
          <path d="M3,8l3,3" />
        </>
      ) : (
        <>
          <path d="M13,8H3" />
          <path d="M10,5l3,3" />
          <path d="M10,11l3-3" />
        </>
      )}
    </svg>
  );
}

type GalleryFloatNavProps = {
  currentImage: ProjectImage | undefined;
  currentIndex: number;
  isModal: boolean;
  isVisible: boolean;
  navRef: RefObject<HTMLElement | null>;
  onClose?: () => void;
  onControlsBlur: () => void;
  onControlsFocus: (event: ReactFocusEvent<HTMLElement>) => void;
  onControlsPointerEnter: () => void;
  onControlsPointerLeave: () => void;
  onNext: () => void;
  onPrevious: () => void;
  subLabel: string;
  total: number;
};

function GalleryFloatNav({
  currentImage,
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
  subLabel,
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
      <div className={styles["work-project-gallery__float-container"]}>
        <div className={styles["work-project-gallery__float-body"]}>
          <span className={styles["work-project-gallery__float-thumb"]}>
            {currentImage ? (
              <LarahImage
                alt=""
                className={styles["work-project-gallery__float-thumb-image"]}
                draggable={false}
                fill
                key={currentIndex}
                sizes="70px"
                src={currentImage.src}
              />
            ) : null}
          </span>

          <p className={styles["work-project-gallery__float-main"]}>
            <span className={styles["work-project-gallery__float-sub-label"]}>
              {subLabel}
            </span>
            <span
              aria-hidden="true"
              className={styles["work-project-gallery__float-title"]}
            >
              {currentLabel} / {totalLabel}
            </span>
            <span
              aria-atomic="true"
              aria-live="polite"
              className={styles["work-project-gallery__sr-only"]}
            >
              Image {currentIndex + 1} of {total}
            </span>
          </p>

          {hasMultipleSlides ? (
            <span className={styles["work-project-gallery__float-actions"]}>
              <button
                aria-label="Previous image"
                className={styles["work-project-gallery__float-button"]}
                onClick={onPrevious}
                type="button"
              >
                <NavArrowIcon direction="previous" />
              </button>
              <button
                aria-label="Next image"
                className={styles["work-project-gallery__float-button"]}
                onClick={onNext}
                type="button"
              >
                <NavArrowIcon direction="next" />
              </button>
            </span>
          ) : null}
        </div>
      </div>

      {isModal && onClose ? (
        <button
          aria-label="Close gallery"
          className={styles["work-project-gallery__float-close"]}
          onClick={onClose}
          type="button"
        >
          <span className={styles["work-project-gallery__float-close-content"]}>
            <span
              aria-hidden="true"
              className={styles["work-project-gallery__float-close-label"]}
            >
              <span>Close</span>
            </span>
            <NavCloseIcon />
          </span>
        </button>
      ) : null}
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
  const panelRef = useRef<HTMLDivElement>(null);
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

  const handleControlsFocus = useCallback(
    (event: ReactFocusEvent<HTMLElement>) => {
      // Clicking next/previous also focuses the button. Treating that as
      // "pinned" would clear the idle timer for good, so only keyboard focus
      // (`:focus-visible`) keeps the controls on screen.
      const isKeyboardFocus =
        event.target instanceof HTMLElement &&
        event.target.matches(":focus-visible");

      controlsFocusedRef.current = isKeyboardFocus;
      hideCloseHint();

      if (isKeyboardFocus) {
        keepControlsVisible();
      } else {
        revealControls();
      }
    },
    [hideCloseHint, keepControlsVisible, revealControls],
  );

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

  // Focus containment lives in its own effect: the effect below re-runs
  // whenever `onClose` is re-created by the parent, which would otherwise yank
  // focus back to the panel on every render.
  useEffect(() => {
    if (!isModal) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Focusing the panel — rather than a control inside it — lets the dialog
    // announce its own name before the user starts tabbing.
    panelRef.current?.focus({ preventScroll: true });

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) {
        return;
      }

      const panel = panelRef.current;

      if (!panel) {
        return;
      }

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getClientRects().length > 0);

      if (!focusableElements.length) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // The lightbox mounts inside the work detail panel, so focus can legally
      // be sitting outside it when it opens — pull it back in on first Tab.
      if (
        !(activeElement instanceof HTMLElement) ||
        !panel.contains(activeElement)
      ) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleTabKey);

    return () => {
      document.removeEventListener("keydown", handleTabKey);

      if (!previouslyFocused?.isConnected) {
        return;
      }

      // The panel underneath marks its own close button `inert` while this
      // lightbox is open, and only clears that on a later render. Focusing a
      // still-`inert` element fails silently and drops focus to <body> — a real
      // path, since Safari does not focus a button on click, which leaves that
      // close button as the element to restore to. Clearing the attribute here
      // is safe: the lightbox is unmounting, so the next render clears it too.
      previouslyFocused.removeAttribute("inert");
      previouslyFocused.focus({ preventScroll: true });
    };
  }, [isModal]);

  useEffect(() => {
    if (!isModal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Lets any surrounding shell (the work detail panel) stand down while the
    // lightbox owns the screen — two competing close affordances read as one.
    document.documentElement.dataset.imageLightbox = "true";

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
      delete document.documentElement.dataset.imageLightbox;
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
    // Click-outside-to-dismiss and the pointer handlers that wake the controls
    // are mouse affordances layered on top of keyboard paths that already
    // exist (Escape closes, arrows page, the panel traps Tab) — there is no
    // keyboard-only user stranded here for the rule to protect.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      aria-labelledby={`work-gallery-title-${project.slug}`}
      className={`${styles["work-project-gallery"]} ${
        isModal
          ? styles["work-project-gallery--modal"]
          : styles["work-project-gallery--page"]
      }`}
      onKeyDown={revealControls}
      // Only a press that both starts and ends on the backdrop dismisses, so
      // the panel no longer needs a `stopPropagation` click handler of its own
      // — one that existed solely to cancel this one.
      onClick={
        isModal
          ? (event) => {
              if (event.target === event.currentTarget) {
                handleClose();
              }
            }
          : undefined
      }
      onPointerDown={revealControls}
    >
      <div
        aria-labelledby={
          isModal ? `work-gallery-title-${project.slug}` : undefined
        }
        aria-modal={isModal ? true : undefined}
        className={styles["work-project-gallery__panel"]}
        ref={panelRef}
        role={isModal ? "dialog" : undefined}
        tabIndex={isModal ? -1 : undefined}
      >
        <h2
          className={styles["work-project-gallery__sr-only"]}
          id={`work-gallery-title-${project.slug}`}
        >
          {project.title} gallery
        </h2>

        {/* Click-to-close and the pointer handlers driving the custom cursor
            label are mouse-only decoration; Escape is the keyboard path. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <div
          aria-label={`${project.title} image gallery`}
          // Flickity puts `tabindex="0"` on this element, so it takes focus —
          // but as a generic <div> it carried no role and its `aria-label` was
          // ignored, landing the user on an unnamed stop.
          aria-roledescription="carousel"
          className={styles["work-project-gallery__carousel"]}
          role="region"
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
          currentImage={images[currentIndex]}
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
          subLabel={project.title}
          total={images.length}
        />
      </div>
    </section>
  );
}
