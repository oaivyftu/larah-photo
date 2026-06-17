import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import { services as servicePackages } from "@/data/services";
import { instagramUrl } from "@/data/social";
import { FeaturedWorkMasonry } from "./FeaturedWorkMasonry";
import styles from "./home.module.scss";

const featuredWorks = [
  {
    id: "forest-feature",
    image: "/images/figma/source/forest-session.png",
    alt: "Woman in an orange dress seated in a forest",
    title: "Forest Portraits",
    meta: "Editorial Session",
    className: "home-page__work-card--8",
    resolution: {
      width: 900,
      height: 600,
    }
  },
  {
    id: "blue-feature",
    image: "/images/figma/source/blue-sky-portrait.png",
    alt: "Two women seated in a green field below blue and white clouds",
    title: "Blue Sky",
    meta: "Creative Portraits",
    className: "home-page__work-card--4",
    resolution: {
      width: 440,
      height: 660,
    }
  },
  {
    id: "blue-secondary",
    image: "/images/figma/source/blue-sky-portrait.png",
    alt: "Two women seated in a green field below blue and white clouds",
    title: "Open Field",
    meta: "Lifestyle Story",
    className: "home-page__work-card--5",
    resolution: {
      width: 555,
      height: 833,
    }
  },
  {
    id: "forest-secondary",
    image: "/images/figma/source/forest-session.png",
    alt: "Woman in an orange dress seated in a forest",
    title: "Golden Hour",
    meta: "Brand Portraits",
    className: "home-page__work-card--7",
    resolution: {
      width: 786,
      height: 524,
    }
  },
  {
    id: "blue-small",
    image: "/images/figma/source/blue-sky-portrait.png",
    alt: "Two women seated in a green field below blue and white clouds",
    title: "Cloud Study",
    meta: "Fashion Portraits",
    className: "home-page__work-card--7",
    resolution: {
      width: 440,
      height: 660
    }
  },
  {
    id: "field-wide-large",
    image: "/images/figma/source/field-wide.png",
    alt: "Two people standing apart in a wide green field",
    title: "Meadow Walk",
    meta: "Couples Session",
    className: "home-page__work-card--5",
    resolution: {
      width: 900,
      height: 600,
    }
  },
  {
    id: "field-wide",
    image: "/images/figma/source/field-wide.png",
    alt: "Two people standing apart in a wide green field",
    title: "Meadow Walk",
    meta: "Couples Session",
    className: "home-page__work-card--12",
    resolution: {
      width: 1360,
      height: 907,
    }
  },
];

const serviceIcons: Record<string, (typeof icons)[keyof typeof icons]> = {
  "portrait-session": icons.portrait,
  "couples-session": icons.userGroup,
  "wedding-package": icons.ring,
};

export default function Home() {
  return (
    <PageShell variant="home">
      <section className={styles["home-page"]} aria-labelledby="home-title">
        <div className={styles["home-page__hero"]}>
          <div className={styles["home-page__brand-group"]}>
            <h1 className={styles["home-page__brand"]} id="home-title">
              <Image
                src="/logos/logo-larah.svg"
                alt="Larah"
                width={273}
                height={91}
                loading="eager"
              />
            </h1>
            <div className={styles["home-page__portrait-frame"]}>
              <Image
                className={styles["home-page__portrait"]}
                src="/images/figma/source/home-portrait.png"
                alt="Model is smiling at Ross Park"
                fill
                loading="eager"
                sizes="(max-width: 720px) 70vw, 326px"
              />
            </div>
          </div>
          <p className={styles["home-page__tagline"]}>
            VISUAL STORYTELLING FOR BRANDS, PEOPLE, AND MOMENTS.
          </p>
          <div className={styles["home-page__feature"]}>
            <div className={styles["home-page__feature-frame"]}>
              <Image
                className={styles["home-page__feature-image"]}
                src="/images/figma/source/larah-about.png"
                alt="Larah portrait in warm sunset light"
                fill
                loading="eager"
                sizes="(max-width: 720px) calc(100vw - 48px), (max-width: 1180px) 48vw, 591px"
              />
            </div>
          </div>
          <Link
            aria-label="Discover more about Larah"
            className={styles["home-page__intro-link"]}
            href="/about"
          >
            <span className={styles["home-page__intro-link-label"]}>
              <Icon
                className={styles["home-page__inline-icon"]}
                decorative
                icon={icons.chevronRight}
              />
              More
            </span>
            <span>Discover</span>
          </Link>
          <a
            className={styles["home-page__hero-cta"]}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message on Instagram
          </a>
        </div>

        <section className={styles["home-page__work"]} aria-label="Featured work">
          <FeaturedWorkMasonry
            className={styles["home-page__work-grid"]}
            columnSizerClassName={styles["home-page__work-column-sizer"]}
            gutterSizerClassName={styles["home-page__work-gutter-sizer"]}
          >
            {featuredWorks.map((work) => (
              <article
                className={`${styles["home-page__work-card"]} ${styles[work.className]}`}
                data-featured-work-item
                key={work.id}
              >
                <Link href="/work">
                  <span className={styles["home-page__work-media"]}>
                    <Image
                      className={styles["home-page__work-image"]}
                      src={work.image}
                      alt={work.alt}
                      {...work.resolution}
                      sizes="(max-width: 720px) calc(100vw - 48px), (max-width: 1100px) 45vw, 42vw"
                    />
                  </span>
                  <span className={styles["home-page__work-title"]}>
                    {work.title}
                  </span>
                  <span className={styles["home-page__work-meta"]}>
                    {work.meta}
                  </span>
                </Link>
              </article>
            ))}
          </FeaturedWorkMasonry>
          <Link className={styles["home-page__view-all"]} href="/work">
            VIEW ALL WORK
            <Icon
              className={styles["home-page__inline-icon"]}
              decorative
              icon={icons.arrowRight}
            />
          </Link>
        </section>

        <section
          className={styles["home-page__services"]}
          aria-labelledby="home-services-title"
        >
          <h2 className={styles["home-page__services-title"]} id="home-services-title">
            SERVICE
          </h2>
          <Icon
            className={styles["home-page__services-caret"]}
            decorative
            icon={icons.chevronDown}
          />
          <div className={styles["home-page__services-grid"]}>
            {servicePackages.map((service) => (
              <article className={styles["home-page__service"]} key={service.title}>
                <Icon
                  className={styles["home-page__service-icon"]}
                  decorative
                  icon={serviceIcons[service.id]}
                />
                <h3 className={styles["home-page__service-title"]}>
                  {service.title}
                </h3>
                <p className={styles["home-page__service-description"]}>
                  {service.description}
                </p>
                <ul className={styles["home-page__service-list"]}>
                  {service.features.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <div className={styles["home-page__service-footer"]}>
                  <span>FROM ${service.price}</span>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>BOOK NOW</span>
                    <Icon
                      className={styles["home-page__inline-icon"]}
                      decorative
                      icon={icons.arrowRight}
                    />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className={styles["home-page__services-note"]}>
            CUSTOM PHOTOGRAPHY AVAILABLE
            <span>Please contact for more information</span>
          </p>
        </section>
      </section>
    </PageShell>
  );
}
