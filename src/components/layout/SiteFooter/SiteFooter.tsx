import Link from "next/link";
import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import { instagramDisplayUrl, instagramUrl } from "@/data/social";
import styles from "./SiteFooter.module.scss";

export function SiteFooter() {
  return (
    <footer className={styles["site-footer"]}>
      <div className={styles["site-footer__inner"]}>
        <p className={styles["site-footer__statement"]}>
          READY TO PLAN SOMETHING BEAUTIFUL? INSTAGRAM IS THE FASTEST WAY TO
          START YOUR SESSION.
        </p>
        <div className={styles["site-footer__cta-group"]}>
          <span className={styles["site-footer__label"]}>BOOKING</span>
          <a
            className={styles["site-footer__cta"]}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message on Instagram
          </a>
        </div>
        <address className={styles["site-footer__contact"]}>
          <span className={styles["site-footer__label"]}>BUSINESS ENQUIRIES</span>
          <a href="mailto:hoanglanmotor@gmail.com">hoanglanmotor@gmail.com</a>
          <a href="tel:+12269772845">+1 (226) 977-2845</a>
        </address>
        <address className={styles["site-footer__contact"]}>
          <span className={styles["site-footer__label"]}>SOCIAL</span>
          <span>London, ON, Canada</span>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            {instagramDisplayUrl}
          </a>
        </address>
      </div>
      <div className={styles["site-footer__bar"]}>
        <span>LARAHPHOTO® ©2026</span>
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
          INSTAGRAM
        </a>
        <Link href="/contact#book">EMAIL INQUIRY</Link>
        <Link href="/work">WORK</Link>
        <a className={styles["site-footer__back-to-top"]} href="#top">
          <span>BACK TO TOP</span>
          <Icon
            className={styles["site-footer__back-to-top-icon"]}
            decorative
            icon={icons.arrowUp}
          />
        </a>
      </div>
    </footer>
  );
}
