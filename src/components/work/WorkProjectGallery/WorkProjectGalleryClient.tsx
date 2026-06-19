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

type DragState = {
  currentX: number;
  isDragging: boolean;
  lastClientX: number;
  lastTime: number;
  pointerId: number;
  startClientX: number;
  startX: number;
  velocity: number;
};

const SELECTED_ATTRACTION = 0.04;
const FRICTION = 0.35;
const DRAG_THRESHOLD = 10;
const WHEEL_SETTLE_DELAY = 120;

function formatIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function getClosestIndex(positions: number[], x: number) {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  positions.forEach((position, index) => {
    const distance = Math.abs(position - x);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
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
  const orientation =
    image.height > image.width ? "portrait" : "landscape";

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
        fill
        priority={index === 0}
        sizes="(max-width: 760px) 86vw, 74vw"
        src={image.src}
      />
    </figure>
  );
});

export function WorkProjectGalleryClient({
  closeHref = "/work",
  images,
  isModal,
  project,
  showFullStoryLink,
}: WorkProjectGalleryClientProps) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef(0);
  const wheelSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef(0);
  const dragRef = useRef<DragState>({
    currentX: 0,
    isDragging: false,
    lastClientX: 0,
    lastTime: 0,
    pointerId: 0,
    startClientX: 0,
    startX: 0,
    velocity: 0,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const totalLabel = String(images.length).padStart(2, "0");

  const slideIds = useMemo(
    () =>
      images.map(
        (image, index) => `${project.slug}-slide-${index}-${image.src}`,
      ),
    [images, project.slug],
  );

  const setTrackPosition = useCallback((x: number) => {
    const track = trackRef.current;

    dragRef.current.currentX = x;

    if (track) {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }
  }, []);

  const scheduleTrackPosition = useCallback(
    (x: number) => {
      pendingPositionRef.current = x;

      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = requestAnimationFrame(() => {
        setTrackPosition(pendingPositionRef.current);
        dragFrameRef.current = null;
      });
    },
    [setTrackPosition],
  );

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const commitActiveIndex = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex((currentIndex) =>
      currentIndex === index ? currentIndex : index,
    );
  }, []);

  const animateToIndex = useCallback(
    (nextIndex: number, immediate = false) => {
      const positions = positionsRef.current;
      const target = positions[nextIndex];

      if (target === undefined) {
        return;
      }

      cancelAnimation();
      commitActiveIndex(nextIndex);

      if (immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setTrackPosition(target);
        return;
      }

      let velocity = dragRef.current.velocity * 16;

      const tick = () => {
        const current = dragRef.current.currentX;
        const distance = target - current;

        velocity += distance * SELECTED_ATTRACTION;
        velocity *= 1 - FRICTION;

        if (Math.abs(distance) < 0.25 && Math.abs(velocity) < 0.25) {
          setTrackPosition(target);
          animationFrameRef.current = null;
          return;
        }

        setTrackPosition(current + velocity);
        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [cancelAnimation, commitActiveIndex, setTrackPosition],
  );

  const settleToClosestSlide = useCallback(
    (projectedX = dragRef.current.currentX) => {
      const positions = positionsRef.current;

      if (positions.length === 0) {
        return;
      }

      animateToIndex(getClosestIndex(positions, projectedX));
    },
    [animateToIndex],
  );

  const goToPrevious = useCallback(() => {
    const nextIndex =
      (activeIndexRef.current - 1 + images.length) % images.length;
    dragRef.current.velocity = 0;
    animateToIndex(nextIndex);
  }, [animateToIndex, images.length]);

  const goToNext = useCallback(() => {
    const nextIndex = (activeIndexRef.current + 1) % images.length;
    dragRef.current.velocity = 0;
    animateToIndex(nextIndex);
  }, [animateToIndex, images.length]);

  const finishDrag = useCallback(
    (pointerId?: number) => {
      const viewport = viewportRef.current;
      const drag = dragRef.current;

      if (!drag.isDragging) {
        return;
      }

      drag.isDragging = false;
      viewport?.classList.remove(
        styles["work-project-gallery__viewport--dragging"],
      );

      if (
        pointerId !== undefined &&
        viewport?.hasPointerCapture(pointerId)
      ) {
        viewport.releasePointerCapture(pointerId);
      }

      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
        setTrackPosition(pendingPositionRef.current);
      }

      const dragDistance = drag.lastClientX - drag.startClientX;
      const projectedX =
        drag.currentX + (Math.abs(dragDistance) >= DRAG_THRESHOLD ? drag.velocity * 180 : 0);

      settleToClosestSlide(projectedX);
    },
    [setTrackPosition, settleToClosestSlide],
  );

  const closeGallery = useCallback(() => {
    if (isModal) {
      router.back();
      return;
    }

    router.push(closeHref);
  }, [closeHref, isModal, router]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) {
      return;
    }

    const measure = () => {
      const viewportWidth = viewport.clientWidth;
      const slides = Array.from(track.children) as HTMLElement[];

      positionsRef.current = slides.map(
        (slide) => viewportWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2),
      );
      animateToIndex(activeIndexRef.current, true);
      track.classList.add(styles["work-project-gallery__track--ready"]);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);

    return () => resizeObserver.disconnect();
  }, [animateToIndex, images.length]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (dragRef.current.isDragging) {
        return;
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (delta === 0) {
        return;
      }

      event.preventDefault();
      cancelAnimation();

      const positions = positionsRef.current;
      const firstPosition = positions[0];
      const lastPosition = positions[positions.length - 1];

      if (firstPosition === undefined || lastPosition === undefined) {
        return;
      }

      const currentX =
        dragFrameRef.current === null
          ? dragRef.current.currentX
          : pendingPositionRef.current;
      const nextX = Math.min(
        firstPosition,
        Math.max(lastPosition, currentX - delta),
      );

      scheduleTrackPosition(nextX);

      if (wheelSettleTimerRef.current) {
        clearTimeout(wheelSettleTimerRef.current);
      }

      wheelSettleTimerRef.current = setTimeout(() => {
        dragRef.current.velocity = 0;
        settleToClosestSlide();
      }, WHEEL_SETTLE_DELAY);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [cancelAnimation, scheduleTrackPosition, settleToClosestSlide]);

  useEffect(
    () => () => {
      cancelAnimation();

      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }

      if (wheelSettleTimerRef.current) {
        clearTimeout(wheelSettleTimerRef.current);
      }
    },
    [cancelAnimation],
  );

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
            aria-live="polite"
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
          className={styles["work-project-gallery__viewport"]}
          onDragStart={(event) => event.preventDefault()}
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
          onPointerCancel={(event) => finishDrag(event.pointerId)}
          onPointerDown={(event) => {
            const viewport = viewportRef.current;

            if (!viewport || event.button !== 0) {
              return;
            }

            cancelAnimation();

            const now = performance.now();
            dragRef.current = {
              currentX: dragRef.current.currentX,
              isDragging: true,
              lastClientX: event.clientX,
              lastTime: now,
              pointerId: event.pointerId,
              startClientX: event.clientX,
              startX: dragRef.current.currentX,
              velocity: 0,
            };
            viewport.setPointerCapture(event.pointerId);
            viewport.classList.add(
              styles["work-project-gallery__viewport--dragging"],
            );
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;

            if (!drag.isDragging || event.pointerId !== drag.pointerId) {
              return;
            }

            const now = performance.now();
            const elapsed = Math.max(1, now - drag.lastTime);
            const nextX = drag.startX + (event.clientX - drag.startClientX);

            drag.velocity = (event.clientX - drag.lastClientX) / elapsed;
            drag.lastClientX = event.clientX;
            drag.lastTime = now;

            scheduleTrackPosition(nextX);
          }}
          onPointerUp={(event) => finishDrag(event.pointerId)}
          ref={viewportRef}
          tabIndex={0}
        >
          <div
            className={styles["work-project-gallery__track"]}
            ref={trackRef}
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
