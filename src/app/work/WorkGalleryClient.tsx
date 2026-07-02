"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatWorkCategory } from "@/data/work";
import type { Project } from "@/types/project";
import type { WorkPageContent } from "@/types/site";
import styles from "./work.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type WorkGalleryClientProps = {
  content: WorkPageContent;
  projects: Project[];
};

export function WorkGalleryClient({ content, projects }: WorkGalleryClientProps) {
  const rootRef = useRef<HTMLElement>(null);
  const featuredProjects = projects.slice(0, 9);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-work-title] span", {
          yPercent: 110,
          opacity: 0,
          rotate: 4,
          duration: 1,
          stagger: 0.07,
          ease: "power4.out",
        });

        const rows = gsap.utils.toArray<HTMLElement>("[data-work-row]");

        rows.forEach((row) => {
          const image = row.querySelector<HTMLElement>("[data-work-preview]");
          const title = row.querySelector<HTMLElement>("[data-work-row-title]");

          gsap
            .timeline({
              scrollTrigger: {
                trigger: row,
                start: "top 82%",
                end: "bottom 18%",
                scrub: 0.8,
              },
            })
            .fromTo(
              row,
              { opacity: 0.28 },
              { opacity: 1, duration: 0.32, ease: "none" },
              0,
            )
            .fromTo(
              image,
              { clipPath: "inset(42% 0 42% 0)", scale: 1.16, rotate: -2 },
              { clipPath: "inset(0% 0 0% 0)", scale: 1, rotate: 0, duration: 0.58 },
              0,
            )
            .to(image, { yPercent: -10, scale: 0.94, duration: 0.42 }, 0.58)
            .fromTo(title, { xPercent: -5 }, { xPercent: 5, duration: 1 }, 0);
        });

        gsap.to("[data-work-index]", {
          yPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section className={styles["work-page"]} ref={rootRef} aria-labelledby="work-title">
      <div className={styles["work-page__hero"]}>
        <p className={styles["work-page__eyebrow"]}>{content.eyebrow}</p>
        <h1 className={styles["work-page__title"]} data-work-title id="work-title">
          {content.titleWords.map((word) => (
            <span key={word}>
              <span>{word}</span>
            </span>
          ))}
        </h1>
      </div>

      <div className={styles["work-page__index"]} data-work-index aria-hidden="true">
        {content.indexLabel}
      </div>

      <div className={styles["work-page__list"]}>
        {featuredProjects.map((project, index) => (
          <Link
            className={styles["work-row"]}
            data-transition-label={project.title}
            data-work-row
            href={`/work/${project.slug}`}
            key={project.id}
          >
            <span className={styles["work-row__count"]}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className={styles["work-row__preview"]}>
              <Image
                data-work-preview
                src={project.image}
                alt={project.alt}
                width={project.width}
                height={project.height}
                sizes="(max-width: 760px) calc(100vw - 32px), 32vw"
              />
            </span>
            <span className={styles["work-row__body"]}>
              <span className={styles["work-row__meta"]}>
                {formatWorkCategory(project.category)} / {project.year}
              </span>
              <strong data-work-row-title>{project.title}</strong>
              <span className={styles["work-row__location"]}>{project.location}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
