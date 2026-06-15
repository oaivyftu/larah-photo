import { PageShell } from "@/components/layout/PageShell/PageShell";
import { ServiceCard } from "@/components/services/ServiceCard/ServiceCard";
import { services } from "@/data/services";
import styles from "./service.module.scss";

export default function ServicePage() {
  return (
    <PageShell variant="service">
      <section className={styles["service-page"]} aria-labelledby="service-title">
        <h1 className={styles["service-page__title"]} id="service-title">
          Service <span>— Enjoy!</span>
        </h1>
        <div className={styles["service-page__list"]}>
          {services.map((service, index) => (
            <ServiceCard
              isPriority={index < 2}
              key={service.id}
              service={service}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
