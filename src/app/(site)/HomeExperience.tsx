"use client";

import { useRef } from "react";
import Image from "next/image";
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
import {
  BREAKPOINT_PHONE_LG,
  BREAKPOINT_TABLET_LG,
} from "@/constants/breakpoints";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type HomeExperienceProps = {
  content: HomePageContent;
  projectCount: number;
  projects: Project[];
  services: ServicePackage[];
  siteName: string;
};

const serviceIcons: Record<string, typeof icons.portrait> = {
  "portrait-session": icons.portrait,
  "couple-session": icons.userGroup,
  "wedding-session": icons.ring,
  "family-session": icons.family,
  "graduation-session": icons.graduation,
};

export function HomeExperience({
  content,
  projectCount,
  projects,
  services,
  siteName,
}: HomeExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const taglineWords = content.heroTagline.split(/\s+/);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
        () => {
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
            .to(
              "[data-manifesto-word='light']",
              { xPercent: -16, scale: 1.12 },
              0,
            )
            .to(
              "[data-manifesto-word='memory']",
              { xPercent: 12, scale: 0.88 },
              0,
            )
            .to(
              "[data-manifesto-word='motion']",
              { xPercent: -8, scale: 1.05 },
              0,
            )
            .to(
              "[data-manifesto-image='one']",
              { yPercent: -16, rotate: -6 },
              0,
            )
            .to("[data-manifesto-image='two']", { yPercent: 18, rotate: 5 }, 0);
        },
      );

      // Below 901px the manifesto can't keep the desktop staging: pinning fights
      // the mobile URL bar (every toolbar resize re-measures the pin) and under
      // 620px the section stacks taller than the viewport, so there is nothing
      // left to hold still. The drift survives — it just scrubs against the
      // section's own pass through the viewport instead of a pinned scroll.
      const manifestoDrift = ({
        wordShift,
        wordScales,
        imageShift,
        imageRotate,
      }: {
        wordShift: number;
        wordScales: [number, number, number];
        imageShift: number;
        imageRotate: number;
      }) => {
        const manifesto =
          rootRef.current?.querySelector<HTMLElement>("[data-manifesto]");

        if (!manifesto) {
          return;
        }

        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: manifesto,
              start: "top 82%",
              once: true,
            },
          })
          .from("[data-manifesto-word]", {
            yPercent: 45,
            opacity: 0,
            duration: 0.85,
            stagger: 0.09,
          })
          .from(
            "[data-manifesto-image]",
            { opacity: 0, scale: 1.08, duration: 1, stagger: 0.14 },
            0.1,
          );

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: manifesto,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          })
          .fromTo(
            "[data-manifesto-word='light']",
            { xPercent: wordShift },
            { xPercent: -wordShift, scale: wordScales[0] },
            0,
          )
          .fromTo(
            "[data-manifesto-word='memory']",
            { xPercent: -wordShift },
            { xPercent: wordShift, scale: wordScales[1] },
            0,
          )
          .fromTo(
            "[data-manifesto-word='motion']",
            { xPercent: wordShift * 0.6 },
            { xPercent: wordShift * -0.6, scale: wordScales[2] },
            0,
          )
          // The photos start at rest and diverge, the way they do on desktop.
          // A symmetric drift would overlap them on phones, where the stacked
          // layout leaves the two frames only a hair apart.
          .to(
            "[data-manifesto-image='one']",
            { yPercent: -imageShift, rotate: -imageRotate },
            0,
          )
          .to(
            "[data-manifesto-image='two']",
            { yPercent: imageShift * 1.1, rotate: imageRotate * 0.9 },
            0,
          );
      };

      mm.add(
        `(min-width: ${BREAKPOINT_PHONE_LG + 1}px) and (max-width: ${BREAKPOINT_TABLET_LG}px) and (prefers-reduced-motion: no-preference)`,
        () => {
          // Tablets still get the desktop composition — centred words over
          // absolutely placed photos — so only the pin is missing here.
          manifestoDrift({
            wordShift: 9,
            wordScales: [1.08, 0.93, 1.04],
            imageShift: 12,
            imageRotate: 5,
          });
        },
      );

      mm.add(
        `(max-width: ${BREAKPOINT_PHONE_LG}px) and (prefers-reduced-motion: no-preference)`,
        () => {
          // Phones stack the words and photos into flow, so the same amplitudes
          // would read as a layout glitch rather than motion. Half measures.
          manifestoDrift({
            wordShift: 4,
            wordScales: [1.04, 0.97, 1.02],
            imageShift: 6,
            imageRotate: 3,
          });
        },
      );

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = rootRef.current;
        const servicesSection =
          root?.querySelector<HTMLElement>("[data-services]");
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

        window.addEventListener("scroll", checkServiceReveal, {
          passive: true,
        });
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
        <div className={styles["hero__intro"]}>
          <Image
            className={styles["hero__logo"]}
            src="/logos/logo-larah.svg"
            alt={siteName}
            width={273}
            height={91}
            loading="eager"
            priority
            data-hero-meta
          />

          <div className={styles["hero__intro-body"]}>
            <div className={styles["hero__portrait"]} data-hero-media>
              <LarahImage
                src={content.heroPortraitImage.src}
                alt={content.heroPortraitImage.alt}
                blurDataURL={content.heroPortraitImage.blurDataURL}
                fill
                loading="eager"
                priority
                sizes="(max-width: 620px) min(100vw, 20rem), (max-width: 900px) 46vw, 23vw"
              />
            </div>

            <h1 className={styles["hero__tagline"]} id="home-title">
              {taglineWords.map((word, index) => (
                <span className={styles["hero__word"]} key={`${word}-${index}`}>
                  <span data-hero-word>{word}</span>
                </span>
              ))}
            </h1>
          </div>
        </div>

        <div className={styles["hero__feature"]}>
          <div className={styles["hero__feature-frame"]}>
            <div className={styles["hero__feature-media"]} data-hero-media>
              <LarahImage
                src={content.heroImage.src}
                alt={content.heroImage.alt}
                blurDataURL={content.heroImage.blurDataURL}
                fill
                loading="eager"
                priority
                sizes="(max-width: 900px) 92vw, 41vw"
              />
            </div>
          </div>

          {/* The reveal drives the wrapper, not the button: `.button` carries a
              CSS opacity transition, and a `from()` tween reads its end value
              from the computed style — mid-transition that reads back as 0 and
              the link never fades in. */}
          <span className={styles["hero__cta"]} data-hero-meta>
            <Button
              href={content.heroCtaHref}
              size="medium"
              variant="secondary"
              withIcon
            >
              {content.heroCtaLabel}
            </Button>
          </span>
        </div>
      </section>

      <section className={styles["manifesto"]} data-manifesto>
        <div className={styles["manifesto__words"]} aria-hidden="true">
          <span data-manifesto-word="light">{content.manifestoWords[0]}</span>
          <span data-manifesto-word="memory">{content.manifestoWords[1]}</span>
          <span data-manifesto-word="motion">{content.manifestoWords[2]}</span>
        </div>
        <div
          className={styles["manifesto__image-one"]}
          data-manifesto-image="one"
        >
          <LarahImage
            src={content.manifestoImageOne.src}
            alt={content.manifestoImageOne.alt}
            blurDataURL={content.manifestoImageOne.blurDataURL}
            fill
            sizes="(max-width: 760px) 46vw, 24vw"
          />
        </div>
        <div
          className={styles["manifesto__image-two"]}
          data-manifesto-image="two"
        >
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
        <div className={styles["discover"]}>
          <h2 className={styles["discover__title"]}>
            {projectCount} {projectCount === 1 ? "Project" : "Projects"}
            <br />
            Discover more
          </h2>
          <span className={styles["section-marker"]} aria-hidden="true" />
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

      <section
        className={styles["services"]}
        data-services
        aria-labelledby="services-title"
      >
        <div className={styles["services__header"]} data-service-reveal>
          <p className={styles["services__eyebrow"]} id="services-title">
            {content.servicesEyebrow}
          </p>
          <span className={styles["section-marker"]} aria-hidden="true" />
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
