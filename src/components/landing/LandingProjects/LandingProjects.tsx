import { WorkCard } from "@/components/work/WorkCard/WorkCard";
import type { Project } from "@/types/project";
import styles from "./LandingProjects.module.scss";

type LandingProjectsProps = {
  heading: string;
  projects: Project[];
};

/**
 * The published projects in this page's category. A plain grid of the work
 * page's own card — not `WorkMasonryGrid`, which brings Isotope and the work
 * filter's classes this page has no use for. Nothing at all when the category
 * has no projects: a thin or empty category is a valid state, and a heading
 * over an empty frame would not be (spec 014 FR-015).
 */
export function LandingProjects({ heading, projects }: LandingProjectsProps) {
  if (!projects.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="landing-projects-heading"
      className={styles["landing-projects"]}
    >
      <h2
        className={styles["landing-projects__heading"]}
        id="landing-projects-heading"
      >
        {heading}
      </h2>
      <ul className={styles["landing-projects__grid"]}>
        {projects.map((project) => (
          <li key={project.id}>
            <WorkCard project={project} variant="work" />
          </li>
        ))}
      </ul>
    </section>
  );
}
