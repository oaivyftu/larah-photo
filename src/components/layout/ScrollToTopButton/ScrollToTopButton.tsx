"use client";

import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import { useScrollToTopVisibility } from "@/utils/useScrollToTopVisibility";
import styles from "./ScrollToTopButton.module.scss";

/**
 * Floating, icon-only button that returns the reader to the top of the page.
 * It stays mounted and is hidden with `visibility`, which also takes it out of
 * the tab order and the accessibility tree while there is nowhere to go back to.
 */
export function ScrollToTopButton() {
  const visible = useScrollToTopVisibility();

  const handleClick = () => {
    window.scrollTo({ top: 0 });
    // PageShell's #top is a programmatic focus target: without this the page
    // scrolls but keyboard focus stays stranded where the button was.
    document.getElementById("top")?.focus({ preventScroll: true });
  };

  return (
    <button
      aria-label="Back to top"
      className={styles["scroll-to-top"]}
      data-visible={visible ? "true" : undefined}
      onClick={handleClick}
      type="button"
    >
      <Icon
        className={styles["scroll-to-top__icon"]}
        decorative
        icon={icons.arrowUp}
      />
    </button>
  );
}
