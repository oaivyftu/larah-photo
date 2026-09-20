import { Button } from "@/components/ui/Button/Button";
import type { JournalPageContent } from "@/types/journal";
import styles from "./JournalCta.module.scss";

type JournalCtaProps = {
  cta: JournalPageContent["cta"];
};

/**
 * The end of every post: the way on to the contact page and the work
 * (spec 013 FR-011). The wording is the editor's, from Journal page settings;
 * only the two destinations are structural and live here.
 */
export function JournalCta({ cta }: JournalCtaProps) {
  return (
    <section
      aria-labelledby="journal-cta-heading"
      className={styles["journal-cta"]}
      data-journal-cta
    >
      <h2 className={styles["journal-cta__heading"]} id="journal-cta-heading">
        {cta.heading}
      </h2>
      <p className={styles["journal-cta__body"]}>{cta.body}</p>
      <div className={styles["journal-cta__actions"]}>
        <Button href="/contact" size="medium" withIcon>
          {cta.contactLabel}
        </Button>
        <Button href="/work" size="medium" variant="secondary">
          {cta.workLabel}
        </Button>
      </div>
    </section>
  );
}
