"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ServicePackage } from "@/types/service";
import type { ServicePageContent } from "@/types/site";
import styles from "./service.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ServiceExperienceProps = {
  content: ServicePageContent;
  services: ServicePackage[];
};

export function ServiceExperience({ content, services }: ServiceExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-service-title] span", {
          yPercent: 110,
          opacity: 0,
          rotate: 4,
          duration: 1,
          stagger: 0.08,
          ease: "power4.out",
        });

        const track = document.querySelector<HTMLElement>("[data-service-track]");

        if (track) {
          const distance = () => track.scrollWidth - window.innerWidth;

          gsap.to(track, {
            x: () => -Math.max(distance(), 0),
            ease: "none",
            scrollTrigger: {
              trigger: "[data-service-pin]",
              start: "top top",
              end: () => `+=${Math.max(distance(), window.innerHeight * 1.4)}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }

        gsap.to("[data-service-image]", {
          scale: 1,
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-service-image]",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <main className={styles["service"]} ref={rootRef}>
      <section className={styles["service__hero"]}>
        <p className={styles["service__eyebrow"]}>{content.eyebrow}</p>
        <h1 className={styles["service__title"]} data-service-title>
          {content.titleWords.map((word) => (
            <span key={word}>
              <span>{word}</span>
            </span>
          ))}
        </h1>
      </section>

      <section className={styles["service__pin"]} data-service-pin>
        <div className={styles["service__track"]} data-service-track>
          {services.map((service) => (
            <article className={styles["service-card"]} key={service.id}>
              <span>{service.index}</span>
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <ul>
                {service.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link data-transition-label="Contact" href={service.ctaHref}>
                From ${service.price}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles["service__image-panel"]}>
        <Image
          data-service-image
          src={content.image.src}
          alt={content.image.alt}
          fill
          sizes="100vw"
        />
        <p>{content.imageCopy}</p>
      </section>
    </main>
  );
}
