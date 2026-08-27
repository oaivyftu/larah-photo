"use client";

import { usePageIntro } from "@/utils/usePageIntro";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import type { AboutPageContent } from "@/types/site";
import styles from "./about.module.scss";

type AboutExperienceProps = {
  content: AboutPageContent;
};

export function AboutExperience({ content }: AboutExperienceProps) {
  const rootRef = usePageIntro<HTMLDivElement>((intro) => {
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
      .set("[data-about-media-visual]", {
        clearProps: "transform,opacity",
      });
  });

  return (
    <div className={styles["about"]} ref={rootRef}>
      <section className={styles["about__intro"]} aria-labelledby="about-title">
        <div className={styles["about__copy"]} data-about-copy>
          <PageHeading
            className={styles["about__title"]}
            id="about-title"
            words={content.titleWords}
          />
          {content.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <figure className={styles["about__media"]} data-about-media>
          <div
            className={styles["about__media-visual"]}
            data-about-media-visual
          >
            {/* No `placeholder="blur"` here. `blurDataURL` is optional — a
                Sanity asset with no lqip metadata resolves it undefined — and
                next/image throws at render when told to blur with nothing to
                blur. LarahImage derives the placeholder from whether a
                blurDataURL actually arrived, which is what it is for;
                hardcoding it overrode exactly that safety. */}
            <LarahImage
              preload
              src={content.portraitOne.src}
              alt={content.portraitOne.alt}
              blurDataURL={content.portraitOne.blurDataURL}
              width={content.portraitOne.width}
              height={content.portraitOne.height}
              sizes="(max-width: 900px) calc(100vw - 48px), 42vw"
            />
          </div>
        </figure>
      </section>
    </div>
  );
}
