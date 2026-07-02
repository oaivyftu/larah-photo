import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/navigation/MainNav/MainNav";
import type { SiteSettings } from "@/types/site";
import styles from "./SiteHeader.module.scss";

type SiteHeaderProps = {
  activeHref?: string;
  hideBrand?: boolean;
  settings: SiteSettings;
};

export function SiteHeader({ activeHref, hideBrand = false, settings }: SiteHeaderProps) {
  return (
    <header className={styles["site-header"]}>
      {hideBrand ? (
        <span
          className={`${styles["site-header__brand"]} ${styles["site-header__brand--hidden"]}`}
          aria-hidden="true"
        />
      ) : (
        <Link className={styles["site-header__brand"]} href="/">
          <Image
            className={styles["site-header__logo"]}
            src="/logos/logo-larah.svg"
            alt="Larah"
            width={96}
            height={32}
            loading="eager"
          />
        </Link>
      )}
      <MainNav activeHref={activeHref} />
      <a
        className={styles["site-header__cta"]}
        href={settings.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Message on Instagram
      </a>
    </header>
  );
}
