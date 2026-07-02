"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InquiryForm } from "@/components/contact/InquiryForm/InquiryForm";
import type { ContactPageContent, SiteSettings } from "@/types/site";
import styles from "./contact.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ContactExperienceProps = {
  content: ContactPageContent;
  settings: SiteSettings;
};

export function ContactExperience({ content, settings }: ContactExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-contact-word]", {
          yPercent: 110,
          opacity: 0,
          rotate: 4,
          duration: 1,
          stagger: 0.08,
          ease: "power4.out",
        });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: "[data-contact-pin]",
              start: "top top",
              end: "+=130%",
              pin: true,
              scrub: 1,
            },
          })
          .to("[data-contact-card='one']", { yPercent: -20, rotate: -4, ease: "none" }, 0)
          .to("[data-contact-card='two']", { yPercent: 16, rotate: 5, ease: "none" }, 0)
          .to("[data-contact-large]", { xPercent: -18, ease: "none" }, 0);
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <main className={styles["contact"]} ref={rootRef}>
      <section className={styles["contact__hero"]}>
        <p className={styles["contact__eyebrow"]}>{content.eyebrow}</p>
        <h1 className={styles["contact__title"]}>
          {content.titleWords.map((word) => (
            <span key={word}>
              <span data-contact-word>{word}</span>
            </span>
          ))}
        </h1>
      </section>

      <section className={styles["contact__pin"]} data-contact-pin>
        <p className={styles["contact__large"]} data-contact-large>
          {content.largeText}
        </p>
        <a
          className={`${styles["contact-card"]} ${styles["contact-card--primary"]}`}
          data-contact-card="one"
          href={settings.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{content.fastestRouteLabel}</span>
          <strong>{content.fastestRouteTitle}</strong>
          <small>{settings.instagramDisplayUrl}</small>
        </a>
        <div className={styles["contact-card"]} data-contact-card="two">
          <span>{content.locationLabel}</span>
          <strong>{content.locationTitle}</strong>
          <small>{content.locationDescription}</small>
        </div>
        <div className={styles["contact__image"]}>
          <Image
            src={content.image.src}
            alt={content.image.alt}
            fill
            sizes="(max-width: 760px) 82vw, 32vw"
          />
        </div>
      </section>

      <section className={styles["contact__form-section"]} id="book">
        <div className={styles["contact__form-copy"]}>
          <p className={styles["contact__eyebrow"]}>{content.formEyebrow}</p>
          <h2>{content.formTitle}</h2>
          <p>{content.formCopy}</p>
        </div>
        <div className={styles["contact__form-panel"]}>
          <InquiryForm />
        </div>
      </section>
    </main>
  );
}
