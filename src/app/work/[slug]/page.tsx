import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import {
  formatWorkCategory,
  getAdjacentWorkProjects,
  getWorkProject,
  workProjects,
} from "@/data/work";
import styles from "./project.module.scss";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return workProjects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getWorkProject(slug);

  if (!project) {
    notFound();
  }

  return {
    title: `${project.title} | Work | Larah Photo`,
    description:
      project.description ||
      `${formatWorkCategory(project.category)} photography in ${project.location}.`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getWorkProject(slug);

  if (!project) {
    notFound();
  }

  const { previousProject, nextProject } = getAdjacentWorkProjects(project.slug);

  return (
    <PageShell variant="project">
      <article className={styles["project-page"]} aria-labelledby="project-title">
        <div className={styles["project-page__hero"]}>
          <Image
            className={styles["project-page__hero-image"]}
            src={project.heroImage.src}
            alt={project.heroImage.alt}
            width={project.heroImage.width}
            height={project.heroImage.height}
            sizes="100vw"
            priority
          />
        </div>

        <header className={styles["project-page__intro"]}>
          <div className={styles["project-page__title-block"]}>
            <p className={styles["project-page__eyebrow"]}>
              {formatWorkCategory(project.category)}
            </p>
            <h1 className={styles["project-page__title"]} id="project-title">
              {project.title}
            </h1>
          </div>

          <div className={styles["project-page__details"]} aria-label="Project details">
            <dl className={styles["project-page__metadata"]}>
              <div className={styles["project-page__metadata-item"]}>
                <dt>Year</dt>
                <dd>{project.year}</dd>
              </div>
              <div className={styles["project-page__metadata-item"]}>
                <dt>Client / Subject</dt>
                <dd>{project.client}</dd>
              </div>
              <div className={styles["project-page__metadata-item"]}>
                <dt>Location</dt>
                <dd>{project.location}</dd>
              </div>
              <div className={styles["project-page__metadata-item"]}>
                <dt>Service / Category</dt>
                <dd>{project.service}</dd>
              </div>
            </dl>
            <p className={styles["project-page__description"]}>
              {project.description}
            </p>
          </div>
        </header>

        <section
          className={styles["project-page__gallery"]}
          aria-label={`${project.title} image gallery`}
        >
          {project.images.map((image, index) => (
            <figure
              className={`${styles["project-page__gallery-item"]} ${
                image.layout === "half"
                  ? styles["project-page__gallery-item--half"]
                  : styles["project-page__gallery-item--full"]
              }`}
              key={`${image.src}-${index}`}
            >
              <Image
                className={styles["project-page__gallery-image"]}
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes={
                  image.layout === "half"
                    ? "(max-width: 760px) 100vw, 50vw"
                    : "100vw"
                }
              />
            </figure>
          ))}
        </section>

        <nav
          className={styles["project-page__nav"]}
          aria-label="Project navigation"
        >
          {previousProject ? (
            <Link
              className={styles["project-page__nav-link"]}
              href={`/work/${previousProject.slug}`}
            >
              <span>Previous Project</span>
              <strong>{previousProject.title}</strong>
            </Link>
          ) : null}
          {nextProject ? (
            <Link
              className={`${styles["project-page__nav-link"]} ${styles["project-page__nav-link--next"]}`}
              href={`/work/${nextProject.slug}`}
            >
              <span>Next Project</span>
              <strong>{nextProject.title}</strong>
            </Link>
          ) : null}
        </nav>
      </article>
    </PageShell>
  );
}
