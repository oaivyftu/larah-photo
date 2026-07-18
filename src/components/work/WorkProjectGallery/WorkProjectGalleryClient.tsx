"use client";

import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type Flickity from "flickity";
import "flickity/css/flickity.css";
import "flickity-fade/flickity-fade.css";
import type { Project, ProjectImage } from "@/types/project";
import styles from "./WorkProjectGallery.module.scss";

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

export function WorkProjectGalleryClient({
  images,
  isModal,
  onClose,
  project,
}: WorkProjectGalleryClientProps) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const flickityRef = useRef<Flickity | null>(null);
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    router.back();
  }, [onClose, router]);

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
        pageDots: true,
        percentPosition: true,
        prevNextButtons: true,
        setGallerySize: false,
        freeScroll: false,
        lazyLoad: true,
        wrapAround: true,
        fade: true,
      } satisfies Flickity.Options & { fade: boolean };

      instance = new FlickityConstructor(carousel, flickityOptions);
      flickityRef.current = instance;

      if (cancelled) {
        instance.destroy();
        instance = null;
        flickityRef.current = null;
      }
    };

    void initializeFlickity();

    return () => {
      cancelled = true;

      if (instance) {
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
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
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
      </div>
    </section>
  );
}
