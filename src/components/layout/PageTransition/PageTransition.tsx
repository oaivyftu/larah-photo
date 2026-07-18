"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./PageTransition.module.scss";

const TRANSITION_DURATION = 780;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function getInternalLink(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<HTMLAnchorElement>("a[href]");
}

export function PageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const isStudioRoute = pathname.startsWith("/studio");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [state, setState] = useState<"idle" | "leaving" | "entering">("idle");

  useEffect(() => {
    document.documentElement.dataset.pageTransition = "entering";
    const enterTimeout = setTimeout(() => setState("entering"), 0);
    const idleTimeout = setTimeout(() => {
      document.documentElement.dataset.pageTransition = "ready";
      setState("idle");
      window.dispatchEvent(new CustomEvent("larah:page-ready"));
    }, TRANSITION_DURATION);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(idleTimeout);
    };
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) {
        return;
      }

      const link = getInternalLink(event.target);

      if (!link || link.target || link.hasAttribute("download")) {
        return;
      }

      const url = new URL(link.href, window.location.href);

      if (url.origin !== window.location.origin) {
        return;
      }

      const destination = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (
        pathname.startsWith("/studio") ||
        url.pathname.startsWith("/studio") ||
        destination === current ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash.startsWith("#"))
      ) {
        return;
      }

      event.preventDefault();
      clearTimeout(timeoutRef.current);
      document.documentElement.dataset.pageTransition = "leaving";
      setState("leaving");

      timeoutRef.current = setTimeout(() => {
        router.push(destination);
      }, TRANSITION_DURATION - 260);
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      clearTimeout(timeoutRef.current);
    };
  }, [pathname, router]);

  if (isStudioRoute) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`${styles["page-transition"]} ${
        state === "leaving" ? styles["page-transition--leaving"] : ""
      } ${state === "entering" ? styles["page-transition--entering"] : ""}`}
    >
      <div className={styles["page-transition__curtain"]} />
      <div className={styles["page-transition__accent"]} />
      <Image
        className={styles["page-transition__logo"]}
        src="/logos/logo-larah.svg"
        alt=""
        width={220}
        height={74}
        priority
      />
    </div>
  );
}
