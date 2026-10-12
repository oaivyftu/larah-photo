import { Button } from "@/components/ui/Button/Button";
import { CallToAction } from "@/components/ui/CallToAction/CallToAction";
import type { LandingPageSettings } from "@/types/landing";

type LandingCtaProps = {
  cta: LandingPageSettings["cta"];
};

/**
 * The end of every landing page: one way on to the contact page (spec 014
 * FR-018). The wording is the editor's, from the shared settings; only the
 * destination is structure and lives here.
 */
export function LandingCta({ cta }: LandingCtaProps) {
  return (
    <CallToAction
      body={cta.body}
      data-landing-cta
      heading={cta.heading}
      headingId="landing-cta-heading"
    >
      <Button href="/contact" size="medium" withIcon>
        {cta.contactLabel}
      </Button>
    </CallToAction>
  );
}
