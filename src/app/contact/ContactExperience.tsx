"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PageHeading } from "@/components/ui/PageHeading/PageHeading";
import type { ContactPageContent, SiteSettings } from "@/types/site";
import styles from "./contact.module.scss";

gsap.registerPlugin(useGSAP);

type ContactExperienceProps = {
  contactDetails: Pick<SiteSettings, "email" | "instagramUrl" | "phone">;
  content: ContactPageContent;
};

function getInstagramLabel(instagramUrl: string) {
  try {
    const [username] = new URL(instagramUrl).pathname
      .split("/")
      .filter(Boolean);

    return username ? `@${username}` : "Instagram";
  } catch {
    return "Instagram";
  }
}

export function ContactExperience({
  contactDetails,
  content,
}: ContactExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const instagramLabel = getInstagramLabel(contactDetails.instagramUrl);
  const phoneHref = contactDetails.phone.replace(/[^\d+]/g, "");

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
          "[data-contact-direct]",
          {
            y: 34,
            opacity: 0,
            duration: 0.78,
            stagger: 0.1,
            ease: "power3.out",
          },
          "-=0.42",
        );

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
    <div className={styles["contact"]} ref={rootRef}>
      <section className={styles["contact__layout"]} aria-labelledby="contact-title">
        <div className={styles["contact__copy"]}>
          <PageHeading id="contact-title" words={content.titleWords} />
        </div>
        <section
          className={styles["contact__direct"]}
          data-contact-direct
          aria-label="Direct contact"
        >
          <address className={styles["contact__details"]}>
            <div className={styles["contact__detail"]}>
              <span className={styles["contact__detail-label"]}>Email</span>
              <a
                className={styles["contact__detail-value"]}
                href={`mailto:${contactDetails.email}`}
              >
                {contactDetails.email}
              </a>
            </div>
            <div className={styles["contact__detail"]}>
              <span className={styles["contact__detail-label"]}>Phone</span>
              <a
                className={styles["contact__detail-value"]}
                href={`tel:${phoneHref}`}
              >
                {contactDetails.phone}
              </a>
            </div>
            <div className={styles["contact__detail"]}>
              <span className={styles["contact__detail-label"]}>
                Instagram
              </span>
              <a
                className={styles["contact__detail-value"]}
                href={contactDetails.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {instagramLabel}
              </a>
            </div>
          </address>
        </section>
      </section>
    </div>
  );
}
