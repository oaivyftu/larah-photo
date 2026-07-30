"use client";

import Link from "next/link";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import {
  PointerHint,
  usePointerHint,
} from "@/components/ui/PointerHint/PointerHint";
import type { Project } from "@/types/project";
import styles from "./WorkCard.module.scss";

type WorkCardProps = {
  className?: string;
  project: Project;
  titleSuffix?: string;
  variant?: "homepage" | "work";
};

export function WorkCard({
  className,
  project,
  titleSuffix = "",
  variant = "work",
}: WorkCardProps) {
  const { hidePointerHint, hintRef, isActive, pointerHintHandlers } =
    usePointerHint<HTMLSpanElement>();
  const content = (
    <>
      <span
        className={styles["work-card__media"]}
        {...pointerHintHandlers}
      >
        <LarahImage
          className={styles["work-card__image"]}
          src={project.image}
          alt={project.alt}
          blurDataURL={project.imageBlurDataURL}
          width={project.width}
          height={project.height}
          sizes={
            variant === "homepage"
              ? "(max-width: 720px) calc(100vw - 48px), (max-width: 1100px) 45vw, 42vw"
              : "(max-width: 720px) calc(100vw - 48px), (max-width: 1080px) 50vw, 31vw"
          }
        />
        <PointerHint
          active={isActive}
          hintRef={hintRef}
          label="View"
          variant="zoom"
        />
      </span>
      <span className={styles["work-card__title"]}>
        {project.title}
        {titleSuffix}
      </span>
      <span className={styles["work-card__meta"]}>{project.meta}</span>
    </>
  );

  return (
    <article
      className={`${styles["work-card"]} ${styles[`work-card--${variant}`]} ${
        className ?? ""
      }`}
      data-work-card
      data-work-category={project.category}
    >
      <Link
        className={styles["work-card__link"]}
        href={`/work/${encodeURIComponent(project.slug)}`}
        onClick={hidePointerHint}
      >
        {content}
      </Link>
    </article>
  );
}
