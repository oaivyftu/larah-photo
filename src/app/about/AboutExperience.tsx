"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./about.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const notes = [
  "Direction that feels calm, never staged.",
  "Warm textures, honest expressions, and space to breathe.",
  "A visual rhythm shaped around the person in front of the lens.",
];

export function AboutExperience() {
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
        <p className={styles["about__eyebrow"]}>About / Larah Photo</p>
        <h1 className={styles["about__title"]}>
          {["A", "camera", "with", "a", "quiet", "heart."].map((word) => (
            <span key={word}>
              <span data-about-word>{word}</span>
            </span>
          ))}
        </h1>
      </section>

      <section className={styles["about__pin"]} data-about-pin>
        <p className={styles["about__large"]} data-about-large>
          Presence before pose.
        </p>
        <div className={styles["about__portrait-one"]} data-about-portrait="one">
          <Image
            src="/images/figma/optimized/larah-about.avif"
            alt="Larah portrait in warm sunset light"
            fill
            sizes="(max-width: 760px) 72vw, 28vw"
          />
        </div>
        <div className={styles["about__portrait-two"]} data-about-portrait="two">
          <Image
            src="/images/figma/optimized/home-portrait.avif"
            alt="Portrait session detail"
            fill
            sizes="(max-width: 760px) 52vw, 18vw"
          />
        </div>
        <div className={styles["about__notes"]}>
          {notes.map((note) => (
            <p data-about-note key={note}>
              {note}
            </p>
          ))}
        </div>
      </section>

      <section className={styles["about__story"]}>
        <p>
          Larah is a photographer dedicated to honest moments, meaningful
          connection, and timeless visual stories. Every session is shaped with
          trust, attention, and enough softness for the subject to feel present.
        </p>
        <p>
          Based in London, Ontario, working with portraits, couples, graduation,
          editorial sessions, and wedding stories.
        </p>
      </section>
    </main>
  );
}
