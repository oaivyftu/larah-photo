"use client";

import { usePageIntro } from "@/utils/usePageIntro";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import type { ServicePackage } from "@/types/service";
import type { ServicePageContent } from "@/types/site";
import styles from "./service.module.scss";

type ServiceExperienceProps = {
  content: ServicePageContent;
  services: ServicePackage[];
};

export function ServiceExperience({
  content,
  services,
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

            <h2 className={styles["service-row__title"]}>{service.title}</h2>

            {/* One block so the features follow the description directly, as
                they do in Figma, whatever height the title runs to. On a
                phone the wrapper dissolves and its children join the row's
                own grid. */}
            <div className={styles["service-row__body"]}>
              <p className={styles["service-row__description"]}>
                {service.description}
              </p>

              <ul className={styles["service-row__features"]}>
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className={styles["service-row__price"]}>
              <span>STARTING FROM</span>
              <strong>${service.price}</strong>
            </div>

            <div className={styles["service-row__media"]}>
              <LarahImage
                src={service.image}
                alt={service.imageAlt}
                blurDataURL={service.imageBlurDataURL}
                fill
                sizes="(max-width: 900px) calc(100vw - 40px), 29vw"
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
