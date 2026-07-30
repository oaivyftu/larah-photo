"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import { WorkMasonryGrid } from "@/components/work/WorkMasonryGrid/WorkMasonryGrid";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
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

const serviceIcons: Record<string, typeof icons.portrait> = {
  "portrait-session": icons.portrait,
  "couple-session": icons.userGroup,
  "wedding-session": icons.ring,
  "family-session": icons.family,
};

export function HomeExperience({
  content,
  projects,
  services,
}: HomeExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroImage = content.heroImage;

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

      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = rootRef.current;
        const servicesSection = root?.querySelector<HTMLElement>("[data-services]");
        const revealItems = gsap.utils.toArray<HTMLElement>(
          "[data-service-reveal]",
          root,
        );

        if (!servicesSection || !revealItems.length) {
          return undefined;
        }

        let hasPlayed = false;
        let revealTween: gsap.core.Tween | undefined;

        const playReveal = () => {
          if (hasPlayed) {
            return;
          }

          hasPlayed = true;
          revealTween = gsap.to(revealItems, {
            autoAlpha: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            stagger: 0.12,
          });
        };

        gsap.set(revealItems, {
          autoAlpha: 0,
          y: 42,
        });

        let revealFrame = 0;

        const checkServiceReveal = () => {
          window.cancelAnimationFrame(revealFrame);

          revealFrame = window.requestAnimationFrame(() => {
            const sectionBox = servicesSection.getBoundingClientRect();
            const isInRevealRange =
              sectionBox.top <= window.innerHeight * 0.82 &&
              sectionBox.bottom >= 0;

            if (isInRevealRange) {
              playReveal();
              window.removeEventListener("scroll", checkServiceReveal);
              window.removeEventListener("resize", checkServiceReveal);
            }
          });
        };

        window.addEventListener("scroll", checkServiceReveal, { passive: true });
        window.addEventListener("resize", checkServiceReveal);
        checkServiceReveal();

        return () => {
          window.cancelAnimationFrame(revealFrame);
          window.removeEventListener("scroll", checkServiceReveal);
          window.removeEventListener("resize", checkServiceReveal);
          revealTween?.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div className={styles["home"]} ref={rootRef}>
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
          <LarahImage
            className={styles["hero__image"]}
            src={heroImage.src}
            alt={heroImage.alt}
            blurDataURL={heroImage.blurDataURL}
            fill
            loading="eager"
            priority
            sizes="(max-width: 760px) calc(100vw - 32px), 52vw"
          />
        </div>

        <div className={styles["hero__actions"]} data-hero-meta>
          <Button
            data-transition-label="Work"
            href="/work"
            size="medium"
            variant="secondary"
            withIcon
          >
            Explore Work
          </Button>
        </div>
      </section>

      <section className={styles["manifesto"]} data-manifesto>
        <div className={styles["manifesto__words"]} aria-hidden="true">
          <span data-manifesto-word="light">{content.manifestoWords[0]}</span>
          <span data-manifesto-word="memory">{content.manifestoWords[1]}</span>
          <span data-manifesto-word="motion">{content.manifestoWords[2]}</span>
        </div>
        <div className={styles["manifesto__image-one"]} data-manifesto-image="one">
          <LarahImage
            src={content.manifestoImageOne.src}
            alt={content.manifestoImageOne.alt}
            blurDataURL={content.manifestoImageOne.blurDataURL}
            fill
            sizes="(max-width: 760px) 46vw, 24vw"
          />
        </div>
        <div className={styles["manifesto__image-two"]} data-manifesto-image="two">
          <LarahImage
            src={content.manifestoImageTwo.src}
            alt={content.manifestoImageTwo.alt}
            blurDataURL={content.manifestoImageTwo.blurDataURL}
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
          variant="homepage"
        />
        <div className={styles["stack__footer"]}>
          <Button
            data-transition-label="Work"
            href="/work"
            size="medium"
            variant="secondary"
            withIcon
          >
            View all work
          </Button>
        </div>
      </section>

      <section className={styles["services"]} data-services aria-labelledby="services-title">
        <div className={styles["services__header"]} data-service-reveal>
          <p className={styles["services__eyebrow"]} id="services-title">
            {content.servicesEyebrow}
          </p>
          <span className={styles["services__marker"]} aria-hidden="true" />
        </div>
        <div className={styles["services__track"]} data-service-track>
          {services.map((service) => (
            <article
              className={styles["service-card"]}
              data-service-reveal
              key={service.id}
            >
              <Icon
                className={styles["service-card__icon"]}
                decorative
                icon={serviceIcons[service.id] ?? icons.circle}
              />
              <h3>{service.title}</h3>
              <p className={styles["service-card__desc"]}>
                {service.description}
              </p>
              <ul>
                {service.features.slice(0, 5).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className={styles["service-card__price"]}>
                From ${service.price}
              </p>
              <Button
                className={styles["service-card__cta"]}
                data-transition-label="Contact"
                href={service.ctaHref}
                size="small"
                variant="primary"
                withIcon
              >
                Book now
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
