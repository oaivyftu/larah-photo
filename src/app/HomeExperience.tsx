"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WorkMasonryGrid } from "@/components/work/WorkMasonryGrid/WorkMasonryGrid";
import { WorkProjectGallery } from "@/components/work/WorkProjectGallery/WorkProjectGallery";
import type { Project } from "@/types/project";
import type { ServicePackage } from "@/types/service";
import type { HomePageContent } from "@/types/site";
import styles from "./home.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type HomeExperienceProps = {
  content: HomePageContent;
  projects: Project[];
  services: ServicePackage[];
};

export function HomeExperience({
  content,
  projects,
  services,
}: HomeExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const heroProject = projects[0];
  const heroImage =
    content.heroImage ??
    (heroProject
      ? {
          src: heroProject.image,
          alt: heroProject.alt,
          width: heroProject.width,
          height: heroProject.height,
        }
      : content.manifestoImageOne);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });

        heroTl
          .from("[data-hero-word]", {
            yPercent: 120,
            rotate: 4,
            opacity: 0,
            duration: 1.05,
            stagger: 0.08,
          })
          .from(
            "[data-hero-media]",
            {
              clipPath: "inset(44% 28% 44% 28%)",
              scale: 0.96,
              duration: 1.1,
            },
            0.12,
          )
          .from(
            "[data-hero-meta]",
            { y: 18, opacity: 0, duration: 0.65, stagger: 0.07 },
            0.52,
          );

        gsap
          .timeline({
            scrollTrigger: {
              trigger: "[data-manifesto]",
              start: "top top",
              end: "+=160%",
              pin: true,
              scrub: 1,
            },
          })
          .to("[data-manifesto-word='light']", { xPercent: -16, scale: 1.12 }, 0)
          .to("[data-manifesto-word='memory']", { xPercent: 12, scale: 0.88 }, 0)
          .to("[data-manifesto-word='motion']", { xPercent: -8, scale: 1.05 }, 0)
          .to("[data-manifesto-image='one']", { yPercent: -16, rotate: -6 }, 0)
          .to("[data-manifesto-image='two']", { yPercent: 18, rotate: 5 }, 0);

        const serviceTrack = document.querySelector<HTMLElement>("[data-service-track]");

        if (serviceTrack) {
          const distance = () => serviceTrack.scrollWidth - window.innerWidth;

          gsap.to(serviceTrack, {
            x: () => -Math.max(distance(), 0),
            ease: "none",
            scrollTrigger: {
              trigger: "[data-services]",
              start: "top top",
              end: () => `+=${Math.max(distance(), window.innerHeight)}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }

      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <main className={styles["home"]} ref={rootRef} aria-labelledby="home-title">
      <section className={styles["hero"]}>
        <div className={styles["hero__copy"]}>
          <p className={styles["eyebrow"]} data-hero-meta>
            {content.eyebrow}
          </p>
          <h1 className={styles["hero__title"]} id="home-title">
            {content.titleWords.map((word) => (
              <span className={styles["hero__word-wrap"]} key={word}>
                <span data-hero-word>{word}</span>
              </span>
            ))}
          </h1>
        </div>

        <div
          className={styles["hero__media"]}
          data-hero-media
        >
          <Image
            className={styles["hero__image"]}
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            loading="eager"
            priority
            sizes="(max-width: 760px) calc(100vw - 32px), 52vw"
          />
          <span className={styles["hero__caption"]} data-hero-meta>
            <span>{heroProject?.title ?? "Featured Work"}</span>
            <span>{heroProject?.meta ?? "Portfolio"}</span>
          </span>
        </div>

        <div className={styles["hero__actions"]} data-hero-meta>
          <Link data-transition-label="Work" href="/work">
            Explore Work
          </Link>
        </div>
      </section>

      <section className={styles["manifesto"]} data-manifesto>
        <div className={styles["manifesto__words"]} aria-hidden="true">
          <span data-manifesto-word="light">{content.manifestoWords[0]}</span>
          <span data-manifesto-word="memory">{content.manifestoWords[1]}</span>
          <span data-manifesto-word="motion">{content.manifestoWords[2]}</span>
        </div>
        <div className={styles["manifesto__image-one"]} data-manifesto-image="one">
          <Image
            src={content.manifestoImageOne.src}
            alt={content.manifestoImageOne.alt}
            fill
            sizes="(max-width: 760px) 46vw, 24vw"
          />
        </div>
        <div className={styles["manifesto__image-two"]} data-manifesto-image="two">
          <Image
            src={content.manifestoImageTwo.src}
            alt={content.manifestoImageTwo.alt}
            fill
            sizes="(max-width: 760px) 42vw, 20vw"
          />
        </div>
      </section>

      <section
        className={styles["stack"]}
        data-stack-section
        aria-label={content.selectedWorkEyebrow}
      >
        <div className={styles["stack__header"]}>
          <p className={styles["eyebrow"]}>{content.selectedWorkEyebrow}</p>
        </div>
        <WorkMasonryGrid
          className={styles["stack__grid"]}
          items={projects}
          onSelectProject={setSelectedProject}
          variant="homepage"
        />
        <div className={styles["stack__footer"]}>
          <Link data-transition-label="Work" href="/work">
            View all work
          </Link>
        </div>
      </section>

      <section className={styles["services"]} data-services aria-labelledby="services-title">
        <div className={styles["services__header"]}>
          <p className={styles["eyebrow"]}>{content.servicesEyebrow}</p>
          <h2 id="services-title">{content.servicesTitle}</h2>
        </div>
        <div className={styles["services__track"]} data-service-track>
          {services.map((service) => (
            <article className={styles["service-card"]} key={service.id}>
              <span>{service.index}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul>
                {service.features.slice(0, 4).map((feature) => (
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

      {selectedProject ? (
        <WorkProjectGallery
          isModal
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      ) : null}
    </main>
  );
}
