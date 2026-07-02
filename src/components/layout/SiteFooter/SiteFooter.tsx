import Link from "next/link";
import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import type { SiteSettings } from "@/types/site";
import styles from "./SiteFooter.module.scss";

type SiteFooterProps = {
  settings: SiteSettings;
};

export function SiteFooter({ settings }: SiteFooterProps) {
  return (
    <footer className={styles["site-footer"]}>
      <div className={styles["site-footer__inner"]}>
        <p className={styles["site-footer__statement"]}>
          {settings.footerStatement}
        </p>
        <div className={styles["site-footer__cta-group"]}>
          <span className={styles["site-footer__label"]}>BOOKING</span>
          <a
            className={styles["site-footer__cta"]}
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message on Instagram
          </a>
        </div>
        <address className={styles["site-footer__contact"]}>
          <span className={styles["site-footer__label"]}>BUSINESS ENQUIRIES</span>
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
          <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>
            {settings.phone}
          </a>
        </address>
        <address className={styles["site-footer__contact"]}>
          <span className={styles["site-footer__label"]}>SOCIAL</span>
          <span>{settings.location}</span>
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
            {settings.instagramDisplayUrl}
          </a>
        </address>
      </div>
      <div className={styles["site-footer__bar"]}>
        <span>LARAHPHOTO® ©2026</span>
        <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
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
