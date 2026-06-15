import { instagramUrl } from "@/data/social";
import styles from "./InstagramBookingCard.module.scss";

export function InstagramBookingCard() {
  return (
    <aside
      className={styles["instagram-booking-card"]}
      aria-labelledby="instagram-booking-title"
    >
      <div className={styles["instagram-booking-card__copy"]}>
        <h2
          className={styles["instagram-booking-card__title"]}
          id="instagram-booking-title"
        >
          Ready to book your session?
        </h2>
        <p className={styles["instagram-booking-card__description"]}>
          The fastest way to reach me is through Instagram. Send me a message
          and let&apos;s start planning your session.
        </p>
      </div>
      <a
        className={styles["instagram-booking-card__button"]}
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Message on Instagram
      </a>
    </aside>
  );
}
