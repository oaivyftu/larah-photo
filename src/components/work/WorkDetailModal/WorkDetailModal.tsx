"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/project";
import { formatWorkCategory } from "@/utils/formatWorkCategory";
import styles from "./WorkDetailModal.module.scss";

const CLOSE_DURATION = 360;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type WorkDetailModalProps = {
  children: ReactNode;
  project: Project;
};

export function WorkDetailModal({
  children,
  project,
}: WorkDetailModalProps) {
  const router = useRouter();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [isClosing, setIsClosing] = useState(false);

  const closeModal = useCallback(() => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    document.documentElement.dataset.modalNavigation = "true";
    closeTimeoutRef.current = setTimeout(() => {
      router.back();
    }, CLOSE_DURATION);
  }, [isClosing, router]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const markModalNavigation = () => {
      document.documentElement.dataset.modalNavigation = "true";
    };

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });
    window.addEventListener("popstate", markModalNavigation);

    return () => {
      clearTimeout(closeTimeoutRef.current);
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("popstate", markModalNavigation);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => element.getClientRects().length > 0);

    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function handleBackdropPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  return (
    <div
      className={`${styles["work-modal"]} ${
        isClosing ? styles["work-modal--closing"] : ""
      }`}
      data-work-modal
      onKeyDown={handleKeyDown}
      onPointerDown={handleBackdropPointerDown}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles["work-modal__dialog"]}
        role="dialog"
      >
        <div className={styles["work-modal__document"]}>
          <header className={styles["work-modal__bar"]}>
            <div className={styles["work-modal__identity"]}>
              <strong id={titleId}>{project.title}</strong>
              <span aria-hidden="true">/</span>
              <span>{formatWorkCategory(project.category)}</span>
            </div>
            <span className={styles["work-modal__hint"]}>
              Project preview
            </span>
          </header>
          {children}
        </div>
      </div>

      <button
        aria-label={`Close ${project.title} project preview`}
        className={styles["work-modal__close"]}
        onClick={closeModal}
        ref={closeButtonRef}
        type="button"
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}
