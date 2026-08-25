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
import { ShareButton } from "@/components/ui/ShareButton/ShareButton";
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

export function WorkDetailModal({ children, project }: WorkDetailModalProps) {
  const router = useRouter();
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [isClosing, setIsClosing] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
    // The modal renders in the `modal` parallel slot, a sibling of the page
    // shell rather than a descendant — so the whole page behind it can be made
    // inert in one go without touching the dialog itself.
    const pageShell = document.querySelector<HTMLElement>("[data-page-shell]");
    const markModalNavigation = () => {
      document.documentElement.dataset.modalNavigation = "true";
    };

    document.body.style.overflow = "hidden";
    pageShell?.setAttribute("inert", "");
    closeButtonRef.current?.focus({ preventScroll: true });
    window.addEventListener("popstate", markModalNavigation);

    return () => {
      clearTimeout(closeTimeoutRef.current);
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("popstate", markModalNavigation);
      // Order matters: focus cannot land inside an inert subtree, so the page
      // has to be released before the trigger is restored.
      pageShell?.removeAttribute("inert");
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);

  // The lightbox stacks on top of this panel and renders its own close control.
  // While it owns the screen this button is faded out and click-blocked, but it
  // would still be tabbable and Enter-activatable — closing the wrong level.
  useEffect(() => {
    const root = document.documentElement;
    const syncLightboxState = () => {
      setIsLightboxOpen(root.dataset.imageLightbox === "true");
    };

    syncLightboxState();

    const observer = new MutationObserver(syncLightboxState);
    observer.observe(root, {
      attributeFilter: ["data-image-lightbox"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      // The image lightbox sits on top of this panel and owns Escape while it
      // is open — closing the panel underneath it would skip a level.
      if (document.documentElement.dataset.imageLightbox === "true") {
        return;
      }

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

  function handleBackdropPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  return (
    // `role="dialog"` sits on the outer wrapper rather than the sheet inside it
    // so that the close button — which is `position: fixed` and therefore
    // cannot be nested in the sheet without inheriting its slide animation —
    // still counts as part of the dialog.
    //
    // The rule reads `dialog` as non-interactive, but the handlers below are
    // exactly what a dialog owes its keyboard users: Escape to dismiss and a
    // Tab trap. Removing them is what would break accessibility.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      aria-labelledby={titleId}
      // The lightbox stacks its own `aria-modal` dialog on top. Two nested
      // modal dialogs leave assistive tech guessing which one confines the
      // user, so this one stands down while the lightbox is open.
      aria-modal={isLightboxOpen ? undefined : true}
      className={`${styles["work-modal"]} ${
        isClosing ? styles["work-modal--closing"] : ""
      }`}
      data-work-modal
      onKeyDown={handleKeyDown}
      onPointerDown={handleBackdropPointerDown}
      role="dialog"
    >
      <div className={styles["work-modal__dialog"]}>
        <div className={styles["work-modal__document"]}>
          <header className={styles["work-modal__bar"]}>
            <div className={styles["work-modal__identity"]}>
              <strong id={titleId}>{project.title}</strong>
              <span aria-hidden="true">/</span>
              <span>{formatWorkCategory(project.category)}</span>
            </div>
            <div className={styles["work-modal__actions"]}>
              <span className={styles["work-modal__hint"]}>
                Project preview
              </span>
              {/* The modal is an intercepted route: the address bar already
                  reads /work/<slug>, so this shares the same permalink the
                  standalone page would. */}
              <ShareButton
                path={`/work/${project.slug}`}
                title={project.title}
              />
            </div>
          </header>
          {children}
        </div>
      </div>

      <button
        aria-label={`Close ${project.title} project preview`}
        className={styles["work-modal__close"]}
        inert={isLightboxOpen}
        onClick={closeModal}
        ref={closeButtonRef}
        type="button"
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}
