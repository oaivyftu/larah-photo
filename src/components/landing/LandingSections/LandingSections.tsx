import type { LandingSection } from "@/types/landing";
import styles from "./LandingSections.module.scss";

type LandingSectionsProps = {
  sections: LandingSection[];
};

/**
 * The page's own explanation, in the editor's words: one `h2` and its
 * paragraphs per section. No `h1` here — the page's single title is composed
 * by the route (spec 014 FR-035). Each section carries `data-landing-section`
 * so the page's entry animation can find it.
 */
export function LandingSections({ sections }: LandingSectionsProps) {
  return (
    <div className={styles["landing-sections"]}>
      {sections.map((section) => (
        <section
          className={styles["landing-section"]}
          data-landing-section
          key={section.heading}
        >
          <h2 className={styles["landing-section__heading"]}>
            {section.heading}
          </h2>
          <div className={styles["landing-section__body"]}>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
