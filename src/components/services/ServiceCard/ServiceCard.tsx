import Image from "next/image";
import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import { instagramUrl } from "@/data/social";
import type { ServicePackage } from "@/types/service";
import styles from "./ServiceCard.module.scss";

type ServiceCardProps = {
  isPriority?: boolean;
  service: ServicePackage;
};

export function ServiceCard({ isPriority = false, service }: ServiceCardProps) {
  return (
    <article className={styles["service-card"]}>
      <span className={styles["service-card__index"]}>{service.index}</span>
      <div className={styles["service-card__body"]}>
        <div className={styles["service-card__content"]}>
          <div className={styles["service-card__copy"]}>
            <h2 className={styles["service-card__title"]}>{service.title}</h2>
            <p className={styles["service-card__description"]}>
              {service.description}
            </p>
          </div>
          <a
            className={styles["service-card__cta"]}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>BOOK NOW</span>
            <Icon
              className={styles["service-card__cta-icon"]}
              decorative
              icon={icons.arrowRight}
            />
          </a>
        </div>
        <div className={styles["service-card__media"]}>
          <Image
            className={styles["service-card__image"]}
            src={service.image}
            alt={service.imageAlt}
            fill
            loading={isPriority ? "eager" : "lazy"}
            sizes="(max-width: 720px) calc(100vw - 48px), (max-width: 1180px) 42vw, 440px"
          />
        </div>
        <div className={styles["service-card__details"]}>
          <ul className={styles["service-card__features"]}>
            {service.features.map((feature) => (
              <li className={styles["service-card__feature"]} key={feature}>
                {feature}
              </li>
            ))}
          </ul>
          <div className={styles["service-card__price"]}>
            <span className={styles["service-card__price-label"]}>
              STARTING FROM
            </span>
            <span className={styles["service-card__price-value"]}>
              ${service.price}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
