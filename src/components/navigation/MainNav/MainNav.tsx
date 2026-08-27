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
              // The active state was carried by weight and an underline alone,
              // which no assistive tech can read.
              aria-current={item.href === activeHref ? "page" : undefined}
              className={[
                styles["main-nav__link"],
                item.href === activeHref
                  ? styles["main-nav__link--active"]
                  : "",
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
