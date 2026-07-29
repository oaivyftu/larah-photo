import Link from "next/link";
import type { NavigationItem } from "@/types/navigation";
import styles from "./MainNav.module.scss";

type MainNavProps = {
  activeHref?: string;
  items: NavigationItem[];
};

export function MainNav({ activeHref, items }: MainNavProps) {
  return (
    <nav className={styles["main-nav"]} aria-label="Primary">
      <ul className={styles["main-nav__list"]}>
        {items.map((item) => (
          <li className={styles["main-nav__item"]} key={item.href}>
            <Link
              className={[
                styles["main-nav__link"],
                item.href === activeHref ? styles["main-nav__link--active"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-transition-label={item.label}
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
