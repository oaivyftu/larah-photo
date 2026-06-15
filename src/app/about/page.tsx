import Image from "next/image";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import styles from "./about.module.scss";

export default function AboutPage() {
  return (
    <PageShell variant="about">
      <section className={styles["about-page"]} aria-labelledby="about-title">
        <div className={styles["about-page__copy"]}>
          <h1 className={styles["about-page__title"]} id="about-title">
            A little intro <span>— About me</span>
          </h1>
          <div className={styles["about-page__body"]}>
            <p>
              LARAH is a photographer dedicated to capturing honest moments,
              meaningful connections, and timeless visual stories.
            </p>
            <p>
              Every session is unique. Rather than simply taking photographs, I
              focus on creating images that reflect genuine emotions,
              personality, and atmosphere. Through a thoughtful and natural
              approach, each story is documented with authenticity and care.
            </p>
            <p>
              I believe that beautiful photography comes from trust, attention
              to detail, and a deep understanding of the people in front of the
              camera. My goal is to provide not only refined imagery, but also
              an experience that feels comfortable, personal, and memorable.
            </p>
            <p>Based in London, ON, Canada.</p>
          </div>
        </div>
        <div className={styles["about-page__media"]}>
          <div className={styles["about-page__image-frame"]}>
            <Image
              className={styles["about-page__image"]}
              src="/images/figma/source/larah-about.png"
              alt="Larah portrait in warm sunset light"
              fill
              loading="eager"
              sizes="(max-width: 720px) calc(100vw - 48px), (max-width: 1180px) 82vw, 591px"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
