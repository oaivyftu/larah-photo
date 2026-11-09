"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useHeaderAutoHide } from "@/utils/useHeaderAutoHide";
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
  const { ref, height, floating, revealed } = useHeaderAutoHide<HTMLElement>();

  return (
    // Past the header's own height it leaves the flow to slide in and out; the
    // slot keeps its space so the page under it does not jump.
    <div
      className={styles["site-header-slot"]}
      style={floating && height ? { minHeight: `${height}px` } : undefined}
    >
      <header
        className={styles["site-header"]}
        data-floating={floating ? "true" : undefined}
        data-revealed={revealed ? "true" : undefined}
        ref={ref}
        style={{ "--site-header-height": `${height}px` } as CSSProperties}
      >
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
    </div>
  );
}
