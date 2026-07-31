import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/navigation/MainNav/MainNav";
import { Button } from "@/components/ui/Button/Button";
import type { NavigationItem } from "@/types/navigation";
import styles from "./SiteHeader.module.scss";

type SiteHeaderProps = {
  activeHref?: string;
  hideBrand?: boolean;
  instagramUrl: string;
  navigationItems: NavigationItem[];
  siteName: string;
};

export function SiteHeader({
  activeHref,
  hideBrand = false,
  instagramUrl,
  navigationItems,
  siteName,
}: SiteHeaderProps) {
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
            alt={siteName}
            width={96}
            height={32}
            loading="eager"
          />
        </Link>
      )}
      <MainNav activeHref={activeHref} items={navigationItems} />
      <Button
        className={styles["site-header__cta"]}
        href={instagramUrl}
        rel="noopener noreferrer"
        size="medium"
        target="_blank"
        variant="primary"
      >
        Message on Instagram
      </Button>
    </header>
  );
}
