"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { NavigationItem } from "@/types/navigation";
import styles from "./MainNav.module.scss";

type MainNavProps = {
  activeHref?: string;
  items: NavigationItem[];
};

// What the open phone menu sits on top of. Made inert while it is open so Tab
// cannot wander into a page the backdrop is covering.
const COVERED_SELECTOR = "#main-content, [data-page-shell] > footer";

export function MainNav({ activeHref, items }: MainNavProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  // While the phone menu is open the page behind it is frozen: no scrolling,
  // no scrollbar, no tabbing into it. Closing (by any route) puts all of it back.
  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    // Hiding a classic scrollbar widens the page by its own width, which would
    // shove the layout sideways under the backdrop; pad the same amount back.
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth,
    );
    const covered = document.querySelectorAll<HTMLElement>(COVERED_SELECTOR);

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    covered.forEach((element) => element.setAttribute("inert", ""));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setOpen(false);
      // The list is about to be hidden; leave focus somewhere real.
      toggleRef.current?.focus({ preventScroll: true });
    };
    // Grown past the phone layout with the menu open (a rotated tablet, a
    // resized window): the toggle disappears, so the freeze must end with it.
    const onResize = () => {
      const toggle = toggleRef.current;
      if (toggle && getComputedStyle(toggle).display === "none") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      covered.forEach((element) => element.removeAttribute("inert"));
    };
  }, [open]);

  return (
    <nav className={styles["main-nav"]} aria-label="Primary">
      {/* Only shown at phone widths, where the links collapse into a panel.
          `display: none` above that, so it is also out of the a11y tree. The
          three bars are drawn in CSS so they can turn into a cross. */}
      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className={styles["main-nav__toggle"]}
        onClick={() => setOpen((value) => !value)}
        ref={toggleRef}
        type="button"
      >
        <span aria-hidden="true" className={styles["main-nav__toggle-icon"]}>
          <span
            className={`${styles["main-nav__toggle-bar"]} ${styles["main-nav__toggle-bar--top"]}`}
          />
          <span
            className={`${styles["main-nav__toggle-bar"]} ${styles["main-nav__toggle-bar--middle"]}`}
          />
          <span
            className={`${styles["main-nav__toggle-bar"]} ${styles["main-nav__toggle-bar--bottom"]}`}
          />
        </span>
      </button>
      <ul
        className={styles["main-nav__list"]}
        data-open={open ? "true" : undefined}
        id={listId}
      >
        {items.map((item, index) => (
          <li
            className={styles["main-nav__item"]}
            key={item.href}
            style={{ "--nav-item-index": index } as CSSProperties}
          >
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
      {/* The veil over the page. A sibling after the list so the open state can
          reach it with `~`. Purely visual and out of the a11y tree: Escape and
          the toggle are the keyboard's way out. */}
      <div
        aria-hidden="true"
        className={styles["main-nav__backdrop"]}
        onClick={() => setOpen(false)}
      />
    </nav>
  );
}
