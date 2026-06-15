import Link from "next/link";
import { navigationItems } from "@/data/navigation";
import styles from "./MainNav.module.scss";

type MainNavProps = {
  activeHref?: string;
};

export function MainNav({ activeHref }: MainNavProps) {
  return (
    <nav className={styles["main-nav"]} aria-label="Primary">
      <ul className={styles["main-nav__list"]}>
        {navigationItems.map((item) => (
          <li className={styles["main-nav__item"]} key={item.href}>
            <Link
              className={[
                styles["main-nav__link"],
                item.href === activeHref ? styles["main-nav__link--active"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
