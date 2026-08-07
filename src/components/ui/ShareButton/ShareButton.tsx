"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ShareButton.module.scss";

/** How long the result label holds before the button returns to "Share". */
const FEEDBACK_DURATION = 2400;

type ShareStatus = "idle" | "copied" | "failed";

const STATUS_LABEL: Record<ShareStatus, string> = {
  idle: "Share",
  copied: "Copied to clipboard",
  failed: "Copy failed",
};

type ShareButtonProps = {
  className?: string;
  /** Site-relative, with a leading slash — e.g. `/work/summer-editorial`. */
  path: string;
  title: string;
};

export function ShareButton({ className, path, title }: ShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimeoutRef.current), []);

  const copyLink = useCallback(async () => {
    // Resolved against the origin the visitor is actually on, not against
    // `NEXT_PUBLIC_SITE_URL`. That variable only has to be right for metadata
    // built on the server; a deploy that forgot to set it would otherwise hand
    // out `localhost:3000` links to every person who pressed this button.
    const url = new URL(path, window.location.origin).toString();
    let next: Exclude<ShareStatus, "idle">;

    try {
      // `navigator.clipboard` is undefined on insecure origins, so the property
      // access belongs inside the `try` as well: it throws rather than
      // rejecting.
      await navigator.clipboard.writeText(url);
      next = "copied";
    } catch {
      next = "failed";
    }

    setStatus(next);
    clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(
      () => setStatus("idle"),
      FEEDBACK_DURATION,
    );
  }, [path]);

  return (
    <>
      <button
        aria-label={`Copy link to ${title}`}
        className={[styles["share-button"], className]
          .filter(Boolean)
          .join(" ")}
        data-status={status}
        onClick={() => void copyLink()}
        type="button"
      >
        {STATUS_LABEL[status]}
      </button>
      {/* The visible label already changes, but it is also the button's own
          text — a screen reader would only reach it by moving focus away and
          back. This announces the result where the user is. */}
      <span className={styles["share-button__status"]} role="status">
        {status === "idle" ? "" : STATUS_LABEL[status]}
      </span>
    </>
  );
}
