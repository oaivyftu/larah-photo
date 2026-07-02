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
          WE BELIEVE IN THE POWER OF DIGITAL, AND WE LOVE COLLABORATING WITH BRANDS THAT FEEL THE SAME. LET&apos;S CONNECT.
        </p>
        <address className={styles["site-footer__contact"]}>
          <span className={styles["site-footer__label"]}>BUSINESS ENQUIRIES</span>
          <a href="mailto:hoanglanmotor@gmail.com">hoanglanmotor@gmail.com</a>
          <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>
            {settings.phone}
          </a>
        </address>
        <address className={styles["site-footer__contact"]}>
          <span className={styles["site-footer__label"]}>BUSINESS ENQUIRIES</span>
          <span>680 Wonderland Road North</span>
          <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
            Larahatelier.photography
          </a>
        </address>
      </div>
      <div className={styles["site-footer__bar"]}>
        <span>DASHDIGITAL® ©2026</span>
        <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
          DRIBBBLE
        </a>
        <Link href="/contact#book">DRIBBBLE</Link>
        <Link href="/work">DRIBBBLE</Link>
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
