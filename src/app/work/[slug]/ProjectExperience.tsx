"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getProjectGalleryImages } from "@/components/work/WorkProjectGallery/WorkProjectGallery";
import { formatWorkCategory } from "@/data/work";
import type { Project } from "@/types/project";
import styles from "./project.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ProjectExperienceProps = {
  project: Project;
};

export function ProjectExperience({ project }: ProjectExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const images = getProjectGalleryImages(project);
  const heroImage = images[0];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const intro = gsap.timeline({ paused: true });

      intro
        .from("[data-project-meta]", {
          y: 20,
          opacity: 0,
          duration: 0.58,
          ease: "power3.out",
        })
        .from(
          "[data-project-title]",
          {
            yPercent: 18,
            opacity: 0,
            duration: 0.82,
            ease: "power4.out",
          },
          "-=0.28",
        )
        .from(
          "[data-project-image]",
          {
            scale: 1.08,
            duration: 1,
            ease: "power3.out",
          },
          "-=0.78",
        );

      const playIntro = () => intro.play(0);

      if (document.documentElement.dataset.pageTransition === "ready") {
        requestAnimationFrame(playIntro);
      } else {
        window.addEventListener("larah:page-ready", playIntro, { once: true });
      }

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: "[data-project-hero]",
              start: "top top",
              end: "+=110%",
              pin: true,
              scrub: 1,
            },
          })
          .fromTo("[data-project-image]", { scale: 1.18 }, { scale: 1, ease: "none" }, 0)
          .to("[data-project-title]", { yPercent: -18, scale: 0.88, ease: "none" }, 0)
          .to("[data-project-meta]", { y: -40, opacity: 0.2, ease: "none" }, 0);

        gsap.utils.toArray<HTMLElement>("[data-project-frame]").forEach((frame) => {
          const image = frame.querySelector<HTMLElement>("img");

          gsap
            .timeline({
              scrollTrigger: {
                trigger: frame,
                start: "top 80%",
                end: "bottom 20%",
                scrub: 0.8,
              },
            })
            .fromTo(frame, { y: 80, rotate: -2, opacity: 0.28 }, { y: 0, rotate: 0, opacity: 1 }, 0)
            .fromTo(image, { scale: 1.16 }, { scale: 1.02 }, 0);
        });
      });

      return () => {
        window.removeEventListener("larah:page-ready", playIntro);
        intro.kill();
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <main className={styles["project"]} ref={rootRef}>
      <section className={styles["project__hero"]} data-project-hero>
        <div className={styles["project__hero-copy"]}>
          <p className={styles["project__eyebrow"]} data-project-meta>
            {formatWorkCategory(project.category)} / {project.year}
          </p>
          <h1 className={styles["project__title"]} data-project-title>
            {project.title}
          </h1>
        </div>
        <div className={styles["project__hero-media"]}>
          <Image
            data-project-image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            loading="eager"
            sizes="100vw"
          />
        </div>
      </section>

      <section className={styles["project__details"]}>
        <dl>
          <div>
            <dt>Location</dt>
            <dd>{project.location}</dd>
          </div>
          <div>
            <dt>Subject</dt>
            <dd>{project.clientSubject}</dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>{project.serviceCategory}</dd>
          </div>
        </dl>
        <p>{project.description}</p>
      </section>

      <section className={styles["project__frames"]} aria-label={`${project.title} images`}>
        {images.map((image, index) => (
          <figure
            className={`${styles["project-frame"]} ${
              styles[`project-frame--${image.height > image.width ? "portrait" : "landscape"}`]
            }`}
            data-project-frame
            key={`${image.src}-${index}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 760px) calc(100vw - 32px), 58vw"
            />
          </figure>
        ))}
      </section>

      <nav className={styles["project__nav"]} aria-label="Project navigation">
        <Link data-transition-label="Work" href="/work">
          Back to Work
        </Link>
        <Link data-transition-label="Contact" href="/contact">
          Book a Session
        </Link>
      </nav>
    </main>
  );
}
