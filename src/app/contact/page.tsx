import { PageShell } from "@/components/layout/PageShell/PageShell";
import { InquiryForm } from "@/components/contact/InquiryForm/InquiryForm";
import { InstagramBookingCard } from "@/components/contact/InstagramBookingCard/InstagramBookingCard";
import styles from "./contact.module.scss";

export default function ContactPage() {
  return (
    <PageShell variant="contact">
      <section
        className={styles["contact-page"]}
        id="book"
        aria-labelledby="contact-title"
      >
        <div className={styles["contact-page__intro"]}>
          <h1 className={styles["contact-page__title"]} id="contact-title">
            Let&apos;s create something <span>meaningful together.</span>
          </h1>
          <p className={styles["contact-page__statement"]}>
            Instagram is the quickest way to plan a session. The inquiry form is
            still here if email feels better.
          </p>
        </div>
        <div className={styles["contact-page__booking"]}>
          <InstagramBookingCard />
          <div
            className={styles["contact-page__form-intro"]}
            aria-labelledby="email-inquiry-title"
          >
            <h2
              className={styles["contact-page__form-title"]}
              id="email-inquiry-title"
            >
              Prefer email?
            </h2>
            <p className={styles["contact-page__form-description"]}>
              You can also send an inquiry using the form below.
            </p>
          </div>
          <InquiryForm />
        </div>
      </section>
    </PageShell>
  );
}
