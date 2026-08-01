"use client";

import Link from "next/link";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { usePointerLabel } from "@/components/ui/GlassPointer/usePointerLabel";
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
  const { hidePointerLabel, pointerLabelHandlers } =
    usePointerLabel<HTMLSpanElement>("View");
  const content = (
    <>
      <span
        className={styles["work-card__media"]}
        {...pointerLabelHandlers}
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
              : "(max-width: 767px) 47vw, (max-width: 1023px) 31vw, 23vw"
          }
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
        data-modal-route
        href={`/work/${encodeURIComponent(project.slug)}`}
        onClick={hidePointerLabel}
        scroll={false}
      >
        {content}
      </Link>
    </article>
  );
}
