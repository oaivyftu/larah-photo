import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { ServicePackageDetails } from "@/components/service/ServicePackageDetails/ServicePackageDetails";
import { Button } from "@/components/ui/Button/Button";
import type { ServicePackage } from "@/types/service";
import styles from "./LandingPackage.module.scss";

type LandingPackageProps = {
  heading: string;
  servicePackage: ServicePackage;
  /** The booking button's wording: the settings field, never a literal here. */
  bookLabel: string;
};

/**
 * The package this page sells, from the same record and the same details block
 * the services page shows (spec 014 FR-016). A title, a description, what it
 * includes, what it costs and the way to book it — the one block on the page
 * that is not the editor's own text, kept deliberately small (FR-042).
 */
export function LandingPackage({
  heading,
  servicePackage,
  bookLabel,
}: LandingPackageProps) {
  return (
    <section
      aria-labelledby="landing-package-heading"
      className={styles["landing-package"]}
      data-landing-package
    >
      <h2
        className={styles["landing-package__heading"]}
        id="landing-package-heading"
      >
        {heading}
      </h2>
      <div className={styles["landing-package__content"]}>
        <div className={styles["landing-package__media"]}>
          <LarahImage
            alt={servicePackage.imageAlt}
            blurDataURL={servicePackage.imageBlurDataURL}
            fill
            loading="lazy"
            sizes="(max-width: 900px) calc(100vw - 48px), 44vw"
            src={servicePackage.image}
          />
        </div>
        <div className={styles["landing-package__copy"]}>
          <h3 className={styles["landing-package__title"]}>
            {servicePackage.title}
          </h3>
          <p>{servicePackage.description}</p>
          <ServicePackageDetails
            features={servicePackage.features}
            price={servicePackage.price}
          />
          <Button
            className={styles["landing-package__cta"]}
            href={servicePackage.ctaHref}
            size="small"
            variant="primary"
            withIcon
          >
            {bookLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
