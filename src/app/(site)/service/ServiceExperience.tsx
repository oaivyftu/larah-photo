"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { playOnPageReady } from "@/utils/playOnPageReady";
import { Button } from "@/components/ui/Button/Button";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import type { ServicePackage } from "@/types/service";
import type { ServicePageContent } from "@/types/site";
import styles from "./service.module.scss";

gsap.registerPlugin(useGSAP);

type ServiceExperienceProps = {
  content: ServicePageContent;
  services: ServicePackage[];
};

export function ServiceExperience({
  content,
  services,
}: ServiceExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Under `reduce` the timeline is never built, so nothing is parked at
      // `opacity: 0` and the page renders at its natural state right away.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ paused: true });

        intro
          .from("[data-page-heading] > span", {
            yPercent: 115,
            opacity: 0,
            rotate: 2,
            duration: 0.82,
            stagger: 0.07,
            ease: "power4.out",
          })
          .from(
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

        const stopWaitingForPage = playOnPageReady(() => intro.play(0));

        return () => {
          stopWaitingForPage();
          intro.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

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

            <div className={styles["service-row__details"]}>
              <ul>
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div>
                <span>STARTING FROM</span>
                <strong>${service.price}</strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
