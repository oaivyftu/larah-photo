import Image from "next/image";
import Link from "next/link";
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
  return (
    <article
      className={`${styles["work-card"]} ${styles[`work-card--${variant}`]} ${
        className ?? ""
      }`}
      data-work-category={project.category}
    >
      <Link
        className={styles["work-card__link"]}
        data-transition-label={project.title}
        href={`/work/${project.slug}`}
      >
        <span className={styles["work-card__media"]}>
          <Image
            className={styles["work-card__image"]}
            src={project.image}
            alt={project.alt}
            width={project.width}
            height={project.height}
            sizes={
              variant === "homepage"
                ? "(max-width: 720px) calc(100vw - 48px), (max-width: 1100px) 45vw, 42vw"
                : "(max-width: 720px) calc(100vw - 48px), (max-width: 1080px) 50vw, 31vw"
            }
          />
        </span>
        <span className={styles["work-card__title"]}>
          {project.title}
          {titleSuffix}
        </span>
        <span className={styles["work-card__meta"]}>{project.meta}</span>
      </Link>
    </article>
  );
}
