import type { Metadata } from "next";
import { Button } from "@/components/ui/Button/Button";
import styles from "./not-found.module.scss";

/**
 * Next already answers with a 404 status, which is the part crawlers act on.
 * The `noindex` covers the other half: a soft-404 that a crawler reaches
 * through a stale link should not be filed under the title it happens to have.
 */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Deliberately free of CMS data. Every other route reads Sanity, so a CMS
 * outage is exactly when this page gets hit — it has to render without it.
 */
export default function NotFound() {
  return (
    <div className={styles["not-found"]}>
      <p className={styles["not-found__code"]}>Error 404</p>
      <h1 className={styles["not-found__title"]}>
        This page is no longer <em>here</em>
      </h1>
      <p className={styles["not-found__copy"]}>
        The link may be out of date, or the project it pointed to has been
        retired from the portfolio.
      </p>
      <div className={styles["not-found__actions"]}>
        <Button href="/" withIcon>
          Back to home
        </Button>
        <Button href="/work" variant="secondary" withIcon>
          Browse work
        </Button>
      </div>
    </div>
  );
}
