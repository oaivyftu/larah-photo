"use client";

import { usePageIntro } from "@/utils/usePageIntro";
import { Button } from "@/components/ui/Button/Button";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { ServicePackageDetails } from "@/components/service/ServicePackageDetails/ServicePackageDetails";
import type { ServicePackage } from "@/types/service";
import type { ServicePageContent } from "@/types/site";
import styles from "./service.module.scss";

type ServiceExperienceProps = {
  content: ServicePageContent;
  services: ServicePackage[];
  /**
   * A live landing page for a package, keyed by the package's id. `label` is
   * the page's own heading, never a generic "learn more". A package with no
   * entry renders exactly as it always did (spec 014 FR-027).
   */
  landingLinks?: Record<string, { href: string; label: string }>;
};

export function ServiceExperience({
  content,
  services,
  landingLinks = {},
}: ServiceExperienceProps) {
  const rootRef = usePageIntro<HTMLDivElement>((intro) => {
    intro.from(
      "[data-service-row]",
      {
        y: 38,
        opacity: 0,
        duration: 0.76,
        stagger: 0.12,
        ease: "power3.out",
      },
      "-=0.4",
    );
  });

  return (
    <div className={styles["service"]} ref={rootRef}>
      <section
        className={styles["service__header"]}
        aria-labelledby="service-title"
      >
        <PageHeading id="service-title" words={content.titleWords} />
      </section>

      <section
        className={styles["service__list"]}
        aria-label="Photography services"
      >
        {services.map((service) => (
          <article
            className={styles["service-row"]}
            data-service-row
            key={service.id}
          >
            <span className={styles["service-row__index"]}>
              {service.index}
            </span>

            <div className={styles["service-row__summary"]}>
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <Button
                className={styles["service-row__cta"]}
                data-transition-label="Contact"
                href={service.ctaHref}
                size="small"
                variant="primary"
                withIcon
              >
                Book now
              </Button>
              {landingLinks[service.id] ? (
                <Button
                  className={styles["service-row__landing"]}
                  data-landing-link
                  href={landingLinks[service.id]!.href}
                  size="small"
                  variant="secondary"
                  withIcon
                >
                  {landingLinks[service.id]!.label}
                </Button>
              ) : null}
            </div>

            <div className={styles["service-row__media"]}>
              <LarahImage
                src={service.image}
                alt={service.imageAlt}
                blurDataURL={service.imageBlurDataURL}
                fill
                sizes="(max-width: 900px) calc(100vw - 48px), 31vw"
              />
            </div>

            <ServicePackageDetails
              className={styles["service-row__details"]}
              features={service.features}
              price={service.price}
            />
          </article>
        ))}
      </section>
    </div>
  );
}
