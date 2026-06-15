import Image from "next/image";
import { instagramHandle, instagramUrl } from "@/data/social";
import styles from "./SocialMarquee.module.scss";

const marqueeItems = [
  {
    label: "Follow the stories on Instagram",
    image: "/images/figma/optimized/forest-session.avif",
    imageAlt: "Editorial portrait from a forest photography session",
  },
  {
    label: "Behind the scenes",
    image: "/images/figma/optimized/home-portrait.avif",
    imageAlt: "Portrait session detail",
  },
  {
    label: "Latest sessions",
    image: "/images/figma/optimized/blue-sky-portrait.avif",
    imageAlt: "Outdoor portrait session under a blue sky",
  },
  {
    label: instagramHandle,
    image: "/images/figma/optimized/field-wide.avif",
    imageAlt: "Wide outdoor photography session in a field",
  },
];

function MarqueeGroup({ isDuplicate = false }: { isDuplicate?: boolean }) {
  return (
    <div
      className={styles["social-marquee__group"]}
      aria-hidden={isDuplicate ? "true" : undefined}
    >
      {marqueeItems.map((item) => (
        <a
          className={styles["social-marquee__item"]}
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${item.label} - open Instagram in a new tab`}
          tabIndex={isDuplicate ? -1 : undefined}
          key={item.label}
        >
          <span className={styles["social-marquee__thumb"]} aria-hidden="true">
            <Image
              className={styles["social-marquee__image"]}
              src={item.image}
              alt=""
              width={72}
              height={72}
              sizes="72px"
            />
          </span>
          <span className={styles["social-marquee__label"]}>{item.label}</span>
        </a>
      ))}
    </div>
  );
}

export function SocialMarquee() {
  return (
    <aside className={styles["social-marquee"]} aria-label="Instagram updates">
      <div className={styles["social-marquee__viewport"]}>
        <div className={styles["social-marquee__track"]}>
          <MarqueeGroup />
          <MarqueeGroup isDuplicate />
        </div>
      </div>
    </aside>
  );
}
