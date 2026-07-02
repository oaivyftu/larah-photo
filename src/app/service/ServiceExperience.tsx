"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ServicePackage } from "@/types/service";
import styles from "./service.module.scss";

gsap.registerPlugin(useGSAP);

type ServiceExperienceProps = {
  services: ServicePackage[];
};

export function ServiceExperience({ services }: ServiceExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
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

      const playIntro = () => intro.play(0);

      if (document.documentElement.dataset.pageTransition === "ready") {
        requestAnimationFrame(playIntro);
      } else {
        window.addEventListener("larah:page-ready", playIntro, { once: true });
      }

      return () => {
        window.removeEventListener("larah:page-ready", playIntro);
        intro.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <main className={styles["service"]} ref={rootRef}>
      <section className={styles["service__header"]} aria-labelledby="service-title">
        <h1 className={styles["service__title"]} data-page-heading id="service-title">
          <span>Service&nbsp;-</span>
          <span>Enjoy!</span>
        </h1>
      </section>

      <section className={styles["service__list"]} aria-label="Photography services">
        {services.map((service) => (
          <article className={styles["service-row"]} data-service-row key={service.id}>
            <span className={styles["service-row__index"]}>{service.index}</span>

            <div className={styles["service-row__summary"]}>
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <Link data-transition-label="Contact" href={service.ctaHref}>
                BOOK NOW <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>

            <div className={styles["service-row__media"]}>
              <Image
                src={service.image}
                alt={service.imageAlt}
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
    </main>
  );
}
