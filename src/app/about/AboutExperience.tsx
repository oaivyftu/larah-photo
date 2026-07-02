"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AboutPageContent } from "@/types/site";
import styles from "./about.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type AboutExperienceProps = {
  content: AboutPageContent;
};

export function AboutExperience({ content }: AboutExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-about-word]", {
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
              trigger: "[data-about-pin]",
              start: "top top",
              end: "+=160%",
              pin: true,
              scrub: 1,
            },
          })
          .to("[data-about-large]", { xPercent: -16, scale: 0.92, ease: "none" }, 0)
          .to("[data-about-portrait='one']", { yPercent: -16, rotate: -5, ease: "none" }, 0)
          .to("[data-about-portrait='two']", { yPercent: 20, rotate: 6, ease: "none" }, 0)
          .fromTo("[data-about-note]", { opacity: 0.15 }, { opacity: 1, stagger: 0.18 }, 0.15);
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <main className={styles["about"]} ref={rootRef}>
      <section className={styles["about__hero"]}>
        <p className={styles["about__eyebrow"]}>{content.eyebrow}</p>
        <h1 className={styles["about__title"]}>
          {content.titleWords.map((word) => (
            <span key={word}>
              <span data-about-word>{word}</span>
            </span>
          ))}
        </h1>
      </section>

      <section className={styles["about__pin"]} data-about-pin>
        <p className={styles["about__large"]} data-about-large>
          {content.largeText}
        </p>
        <div className={styles["about__portrait-one"]} data-about-portrait="one">
          <Image
            src={content.portraitOne.src}
            alt={content.portraitOne.alt}
            fill
            sizes="(max-width: 760px) 72vw, 28vw"
          />
        </div>
        <div className={styles["about__portrait-two"]} data-about-portrait="two">
          <Image
            src={content.portraitTwo.src}
            alt={content.portraitTwo.alt}
            fill
            sizes="(max-width: 760px) 52vw, 18vw"
          />
        </div>
        <div className={styles["about__notes"]}>
          {content.notes.map((note) => (
            <p data-about-note key={note}>
              {note}
            </p>
          ))}
        </div>
      </section>

      <section className={styles["about__story"]}>
        {content.story.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </main>
  );
}
