"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { instagramUrl } from "@/data/social";
import { formatWorkCategory } from "@/data/work";
import type { Project } from "@/types/project";
import type { ServicePackage } from "@/types/service";
import styles from "./home.module.scss";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type HomeExperienceProps = {
  projects: Project[];
  services: ServicePackage[];
};

export function HomeExperience({ projects, services }: HomeExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const heroProject = projects[0];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
        gsap.set("[data-manifesto-copy]", { opacity: 0, y: 32 });

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
          .to("[data-manifesto-image='two']", { yPercent: 18, rotate: 5 }, 0)
          .to("[data-manifesto-copy]", { opacity: 1, y: 0 }, 0.18);

        const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
        const stackTl = gsap.timeline({
          scrollTrigger: {
            trigger: "[data-stack-section]",
            start: "top top",
            end: () => `+=${window.innerHeight * cards.length}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        gsap.set(cards, {
          yPercent: 112,
          scale: 0.86,
          opacity: 0,
          rotate: (index) => (index % 2 === 0 ? -3 : 3),
        });

        cards.forEach((card, index) => {
          const image = card.querySelector<HTMLElement>("[data-stack-image]");
          const number = card.querySelector<HTMLElement>("[data-stack-number]");
          const at = index * 1.18;

          stackTl
            .to(
              card,
              {
                yPercent: 0,
                scale: 1,
                opacity: 1,
                rotate: 0,
                duration: 0.82,
                ease: "power3.out",
              },
              at,
            )
            .fromTo(
              image,
              { scale: 1.2 },
              { scale: 1.02, duration: 1.1, ease: "power2.out" },
              at,
            )
            .to(number, { yPercent: -130, duration: 0.7, ease: "power2.inOut" }, at + 0.2);

          if (index < cards.length - 1) {
            stackTl.to(
              card,
              {
                yPercent: -22,
                scale: 0.84,
                opacity: 0.28,
                rotate: index % 2 === 0 ? 1.4 : -1.4,
                duration: 0.62,
                ease: "power2.in",
              },
              at + 0.86,
            );
          }
        });

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

        gsap.fromTo(
          "[data-closing-image]",
          { scale: 1.18 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: "[data-closing]",
              start: "top bottom",
              end: "bottom bottom",
              scrub: 1,
            },
          },
        );

        return () => mm.revert();
      });
    },
    { scope: rootRef },
  );

  return (
    <main className={styles["home"]} ref={rootRef} aria-labelledby="home-title">
      <section className={styles["hero"]}>
        <div className={styles["hero__copy"]}>
          <p className={styles["eyebrow"]} data-hero-meta>
            Larah Photo / London, Ontario
          </p>
          <h1 className={styles["hero__title"]} id="home-title">
            {["Editorial", "photo", "stories", "with", "a", "pulse."].map(
              (word) => (
                <span className={styles["hero__word-wrap"]} key={word}>
                  <span data-hero-word>{word}</span>
                </span>
              ),
            )}
          </h1>
        </div>

        <Link
          className={styles["hero__media"]}
          data-hero-media
          data-transition-label={heroProject.title}
          href={`/work/${heroProject.slug}`}
        >
          <Image
            className={styles["hero__image"]}
            src="/images/figma/optimized/forest-session.avif"
            alt={heroProject.alt}
            fill
            loading="eager"
            priority
            sizes="(max-width: 760px) calc(100vw - 32px), 52vw"
          />
          <span className={styles["hero__caption"]} data-hero-meta>
            <span>{heroProject.title}</span>
            <span>{heroProject.meta}</span>
          </span>
        </Link>

        <div className={styles["hero__actions"]} data-hero-meta>
          <Link data-transition-label="Work" href="/work">
            Explore Work
          </Link>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            Book Session
          </a>
        </div>
      </section>

      <section className={styles["manifesto"]} data-manifesto>
        <div className={styles["manifesto__words"]} aria-hidden="true">
          <span data-manifesto-word="light">Light</span>
          <span data-manifesto-word="memory">Memory</span>
          <span data-manifesto-word="motion">Motion</span>
        </div>
        <div className={styles["manifesto__image-one"]} data-manifesto-image="one">
          <Image
            src="/images/figma/optimized/blue-sky-portrait.avif"
            alt="Two women seated in a green field below blue and white clouds"
            fill
            sizes="(max-width: 760px) 46vw, 24vw"
          />
        </div>
        <div className={styles["manifesto__image-two"]} data-manifesto-image="two">
          <Image
            src="/images/figma/optimized/home-portrait.avif"
            alt="Portrait session detail"
            fill
            sizes="(max-width: 760px) 42vw, 20vw"
          />
        </div>
        <p className={styles["manifesto__copy"]} data-manifesto-copy>
          Warm direction, cinematic framing, and images that feel alive after
          the moment has passed.
        </p>
      </section>

      <section className={styles["stack"]} data-stack-section aria-labelledby="stack-title">
        <div className={styles["stack__intro"]}>
          <p className={styles["eyebrow"]}>Selected Work</p>
          <h2 id="stack-title">Pinned frames that unfold like a story.</h2>
        </div>
        <div className={styles["stack__stage"]}>
          {projects.map((project, index) => (
            <article className={styles["stack-card"]} data-stack-card key={project.id}>
              <Link
                className={styles["stack-card__inner"]}
                data-transition-label={project.title}
                href={`/work/${project.slug}`}
              >
                <span className={styles["stack-card__number-mask"]}>
                  <span data-stack-number>{String(index + 1).padStart(2, "0")}</span>
                </span>
                <span className={styles["stack-card__media"]}>
                  <Image
                    className={styles["stack-card__image"]}
                    data-stack-image
                    src={project.image}
                    alt={project.alt}
                    width={project.width}
                    height={project.height}
                    sizes="(max-width: 760px) calc(100vw - 32px), 54vw"
                  />
                </span>
                <span className={styles["stack-card__copy"]}>
                  <span>{formatWorkCategory(project.category)}</span>
                  <strong>{project.title}</strong>
                  <span>{project.location}</span>
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles["services"]} data-services aria-labelledby="services-title">
        <div className={styles["services__header"]}>
          <p className={styles["eyebrow"]}>Services</p>
          <h2 id="services-title">Choose the way your story is held.</h2>
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

      <section className={styles["closing"]} data-closing>
        <div className={styles["closing__media"]}>
          <Image
            className={styles["closing__image"]}
            data-closing-image
            src="/images/figma/optimized/field-wide.avif"
            alt="Two people standing apart in a wide green field"
            fill
            sizes="100vw"
          />
        </div>
        <div className={styles["closing__copy"]}>
          <p className={styles["eyebrow"]}>Now Booking</p>
          <h2>Let&apos;s make the frame feel inevitable.</h2>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            Message on Instagram
          </a>
        </div>
      </section>
    </main>
  );
}
