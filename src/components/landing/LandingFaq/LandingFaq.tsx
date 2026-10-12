import type { LandingFaq as LandingFaqItem } from "@/types/landing";
import styles from "./LandingFaq.module.scss";

type LandingFaqProps = {
  heading: string;
  faqs: LandingFaqItem[];
};

/**
 * Every question with its answer, always open. Not an accordion: a closed
 * `<details>` removes its answer from the accessibility tree, and a scripted
 * one adds state, a height animation to reconcile with reduced motion and an
 * element a keyboard user can miss — all to hide five short paragraphs
 * (spec 014 research.md §9). Plain-text answers are also the bytes in the
 * page's `FAQPage` data (FR-023, FR-025).
 */
export function LandingFaq({ heading, faqs }: LandingFaqProps) {
  return (
    <section
      aria-labelledby="landing-faq-heading"
      className={styles["landing-faq"]}
      data-landing-faq
    >
      <h2 className={styles["landing-faq__heading"]} id="landing-faq-heading">
        {heading}
      </h2>
      <div className={styles["landing-faq__list"]}>
        {faqs.map((faq) => (
          <div className={styles["landing-faq__item"]} key={faq.question}>
            <h3 className={styles["landing-faq__question"]}>{faq.question}</h3>
            <p className={styles["landing-faq__answer"]}>{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
