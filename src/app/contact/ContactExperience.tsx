"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { InquiryForm } from "@/components/contact/InquiryForm/InquiryForm";
import type { ContactPageContent } from "@/types/site";
import styles from "./contact.module.scss";

gsap.registerPlugin(useGSAP);

type ContactExperienceProps = {
  content: ContactPageContent;
  sessionTypes: string[];
};

export function ContactExperience({
  content,
  sessionTypes,
}: ContactExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);

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
          "[data-contact-statement], [data-contact-form]",
          {
            y: 34,
            opacity: 0,
            duration: 0.78,
            stagger: 0.1,
            ease: "power3.out",
          },
          "-=0.42",
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
    <div className={styles["contact"]} ref={rootRef}>
      <section className={styles["contact__layout"]} aria-labelledby="contact-title">
        <div className={styles["contact__copy"]}>
          <h1 className={styles["contact__title"]} data-page-heading id="contact-title">
            {content.titleWords.map((word, index) => (
              <span key={`${word}-${index}`}>{word}</span>
            ))}
          </h1>
          <p data-contact-statement>{content.formCopy}</p>
        </div>
        <div className={styles["contact__form"]} data-contact-form id="book">
          <InquiryForm sessionTypes={sessionTypes} />
        </div>
      </section>
    </div>
  );
}
