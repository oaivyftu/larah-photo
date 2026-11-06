"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { NavigationItem } from "@/types/navigation";
import styles from "./MainNav.module.scss";

type MainNavProps = {
  activeHref?: string;
  items: NavigationItem[];
};

export function MainNav({ activeHref, items }: MainNavProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  // Escape closes the phone menu, the way any disclosure panel does.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <nav className={styles["main-nav"]} aria-label="Primary">
      {/* Only shown at phone widths, where the links collapse into a panel.
          `display: none` above that, so it is also out of the a11y tree. */}
      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className={styles["main-nav__toggle"]}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className={styles["main-nav__toggle-icon"]}
          focusable="false"
          viewBox="0 0 24 14"
        >
          {open ? (
            <path
              d="M3 1l18 12M21 1L3 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          ) : (
            <path
              d="M0 1h24M0 7h24M0 13h24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          )}
        </svg>
      </button>
      <ul
        className={styles["main-nav__list"]}
        data-open={open ? "true" : undefined}
        id={listId}
      >
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
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
