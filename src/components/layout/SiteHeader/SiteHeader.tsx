import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/navigation/MainNav/MainNav";
import type { NavigationItem } from "@/types/navigation";
import styles from "./SiteHeader.module.scss";

type SiteHeaderProps = {
  activeHref?: string;
  hideBrand?: boolean;
  navigationItems: NavigationItem[];
  siteName: string;
};

export function SiteHeader({
  activeHref,
  hideBrand = false,
  navigationItems,
  siteName,
}: SiteHeaderProps) {
  return (
    <header className={styles["site-header"]}>
      {/* Always the real link, even where the home hero makes it redundant:
          the stylesheet decides at which widths it shows, and `visibility`
          keeps a hidden brand out of the tab order and the a11y tree. */}
      <Link
        className={[
          styles["site-header__brand"],
          hideBrand ? styles["site-header__brand--hidden"] : "",
        ]
          .filter(Boolean)
          .join(" ")}
        href="/"
      >
        <Image
          className={styles["site-header__logo"]}
          src="/logos/logo-larah.svg"
          alt={siteName}
          width={96}
          height={32}
          loading="eager"
        />
      </Link>
      <MainNav activeHref={activeHref} items={navigationItems} />
    </header>
  );
}
