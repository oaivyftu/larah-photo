"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./PageTransition.module.scss";

const TRANSITION_DURATION = 780;

type TransitionState = "covered" | "covering" | "revealing" | "idle";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function getInternalLink(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<HTMLAnchorElement>("a[href]");
}

function isWorkDetailPath(pathname: string) {
  return /^\/work\/[^/]+\/?$/.test(pathname);
}

export function PageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const isStudioRoute = pathname.startsWith("/studio");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // The route this component last ran a reveal cycle for, or null before the
  // first. A navigation is a *change* of pathname — deliberately not "the
  // effect has run before", which is a different question with a different
  // answer under React Strict Mode (see the effect below).
  const revealedPathnameRef = useRef<string | null>(null);
  const [state, setState] = useState<TransitionState>("covered");
  const [routeAnnouncement, setRouteAnnouncement] = useState("");

  useEffect(() => {
    if (document.documentElement.dataset.modalNavigation === "true") {
      delete document.documentElement.dataset.modalNavigation;
      document.documentElement.dataset.pageTransition = "ready";
      // The modal owns focus and announces itself; the underlying page has not
      // actually changed, so this must not count as a navigation.
      return;
    }

    // Recorded synchronously, before any timer, and keyed on the pathname.
    //
    // Two failures shaped this, and each one rules out the other's fix:
    //
    //   - It used to be a boolean flipped *inside* the timeout below. A visitor
    //     who followed a link within TRANSITION_DURATION of the page loading
    //     cancelled that timeout on the way out, so the flag was still false
    //     when the next cycle checked it, and that navigation silently skipped
    //     both the focus move and the announcement. Reduced-motion visitors hit
    //     it most: their content is on screen immediately, so they click
    //     sooner — the bug fell hardest on the users Principle II exists for.
    //
    //   - Setting that boolean synchronously fixes the race but breaks under
    //     React Strict Mode, which replays effect setup and cleanup on the
    //     initial mount while preserving refs. The replay would see "we have
    //     run before", and announce the title over a screen reader already
    //     reading the page it just loaded.
    //
    // A pathname is immune to both. The replay carries the same one, so it is
    // not a navigation; a real navigation carries a different one, whether it
    // arrives in 200ms or 2s.
    const previousPathname = revealedPathnameRef.current;
    const isNavigation =
      previousPathname !== null && previousPathname !== pathname;
    revealedPathnameRef.current = pathname;

    document.documentElement.dataset.pageTransition = "revealing";
    const revealTimeout = setTimeout(() => setState("revealing"), 0);

    const idleTimeout = setTimeout(() => {
      document.documentElement.dataset.pageTransition = "ready";
      setState("idle");
      window.dispatchEvent(new CustomEvent("larah:page-ready"));

      if (isNavigation) {
        // Next.js leaves focus on <body> after a client-side navigation, so a
        // keyboard user would resume tabbing from the top of the document with
        // no signal that the page changed.
        document
          .querySelector<HTMLElement>("#main-content")
          ?.focus({ preventScroll: true });
        setRouteAnnouncement(document.title);
      }
    }, TRANSITION_DURATION);

    return () => {
      clearTimeout(revealTimeout);
      clearTimeout(idleTimeout);
    };
  }, [pathname]);

  useEffect(() => {
    function handlePopState() {
      const isGalleryContext = pathname === "/" || pathname === "/work";

      if (isGalleryContext && isWorkDetailPath(window.location.pathname)) {
        document.documentElement.dataset.modalNavigation = "true";
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        isModifiedClick(event)
      ) {
        return;
      }

      const link = getInternalLink(event.target);

      if (!link || link.target || link.hasAttribute("download")) {
        return;
      }

      if (link.hasAttribute("data-modal-route")) {
        document.documentElement.dataset.modalNavigation = "true";
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
      document.documentElement.dataset.pageTransition = "covering";
      setState("covering");

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
    <>
      <div
        aria-atomic="true"
        aria-live="polite"
        className={styles["page-transition__announcer"]}
        role="status"
      >
        {routeAnnouncement}
      </div>

      <div
        aria-hidden="true"
        className={`${styles["page-transition"]} ${styles[`page-transition--${state}`]}`}
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
    </>
  );
}
