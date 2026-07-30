"use client";

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { icons } from "@/constants/icons";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./PointerHint.module.scss";

type PointerHintVariant = "close" | "zoom";

type PointerHintProps = {
  active: boolean;
  hintRef: React.RefObject<HTMLDivElement | null>;
  label: string;
  variant: PointerHintVariant;
};

type PointerHintHandlers<ElementType extends HTMLElement> = {
  onPointerEnter: (event: ReactPointerEvent<ElementType>) => void;
  onPointerLeave: (event: ReactPointerEvent<ElementType>) => void;
  onPointerMove: (event: ReactPointerEvent<ElementType>) => void;
};

function isMousePointer(event: ReactPointerEvent<HTMLElement>) {
  return event.pointerType === "mouse";
}

function positionHint(
  element: HTMLDivElement | null,
  clientX: number,
  clientY: number,
) {
  if (!element) {
    return;
  }

  element.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
}

export function usePointerHint<ElementType extends HTMLElement>() {
  const hintRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<ElementType>) => {
      if (!isMousePointer(event)) {
        return;
      }

      positionHint(hintRef.current, event.clientX, event.clientY);
      setIsActive(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<ElementType>) => {
      if (!isMousePointer(event)) {
        return;
      }

      positionHint(hintRef.current, event.clientX, event.clientY);
      setIsActive(true);
    },
    [],
  );

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent<ElementType>) => {
      if (!isMousePointer(event)) {
        return;
      }

      setIsActive(false);
    },
    [],
  );

  const hidePointerHint = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    hidePointerHint,
    hintRef,
    isActive,
    pointerHintHandlers: {
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
    } satisfies PointerHintHandlers<ElementType>,
  };
}

export function PointerHint({
  active,
  hintRef,
  label,
  variant,
}: PointerHintProps) {
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!isHydrated) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className={`${styles["pointer-hint"]} ${
        active ? styles["pointer-hint--active"] : ""
      }`}
      ref={hintRef}
    >
      <Icon
        className={styles["pointer-hint__icon"]}
        decorative
        icon={
          variant === "zoom"
            ? icons.magnifyingGlassPlus
            : icons.magnifyingGlassMinus
        }
      />
      <span>{label}</span>
    </div>,
    document.body,
  );
}
