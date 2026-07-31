"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import type { AboutPageContent } from "@/types/site";
import styles from "./about.module.scss";

gsap.registerPlugin(useGSAP);

type AboutExperienceProps = {
  content: AboutPageContent;
};

export function AboutExperience({ content }: AboutExperienceProps) {
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
          "[data-about-copy] p, [data-about-media-visual]",
          {
            y: 34,
            opacity: 0,
            duration: 0.78,
            stagger: 0.08,
            ease: "power3.out",
          },
          "-=0.42",
        )
        .from(
          "[data-about-logo-motion]",
          {
            x: -34,
            opacity: 0,
            duration: 0.66,
            ease: "power3.out",
          },
          "-=0.48",
        )
        .set("[data-about-media-visual], [data-about-logo-motion]", {
          clearProps: "transform,opacity",
        });

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
    <div className={styles["about"]} ref={rootRef}>
      <section className={styles["about__intro"]} aria-labelledby="about-title">
        <div className={styles["about__copy"]} data-about-copy>
          <h1 className={styles["about__title"]} data-page-heading id="about-title">
            {content.titleWords.map((word, index) => (
              <span key={`${word}-${index}`}>{word}</span>
            ))}
          </h1>
          {content.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <figure className={styles["about__media"]} data-about-media>
          <div
            className={styles["about__media-visual"]}
            data-about-media-visual
          >
            <LarahImage
              preload
              src={content.portraitOne.src}
              alt={content.portraitOne.alt}
              placeholder="blur"
              blurDataURL={content.portraitOne.blurDataURL}
              width={content.portraitOne.width}
              height={content.portraitOne.height}
              sizes="(max-width: 900px) calc(100vw - 48px), 42vw"
            />
          </div>
          <figcaption data-about-logo>
            <span data-about-logo-motion>LARAH</span>
          </figcaption>
        </figure>
      </section>
    </div>
  );
}
