import { Button } from "@/components/ui/Button/Button";
import { CallToAction } from "@/components/ui/CallToAction/CallToAction";
import type { JournalPageContent } from "@/types/journal";
import styles from "./JournalCta.module.scss";

type JournalCtaProps = {
  cta: JournalPageContent["cta"];
};

/**
 * The end of every post: the way on to the contact page and the work
 * (spec 013 FR-011). The wording is the editor's, from Journal page settings;
 * only the two destinations are structural and live here. The block itself is
 * the shared `CallToAction`; this keeps the journal article's own width and
 * margin.
 */
export function JournalCta({ cta }: JournalCtaProps) {
  return (
    <CallToAction
      body={cta.body}
      className={styles["journal-cta"]}
      data-journal-cta
      heading={cta.heading}
      headingId="journal-cta-heading"
    >
      <Button href="/contact" size="medium" withIcon>
        {cta.contactLabel}
      </Button>
      <Button href="/work" size="medium" variant="secondary">
        {cta.workLabel}
      </Button>
    </CallToAction>
  );
}
