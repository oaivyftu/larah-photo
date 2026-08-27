"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { claimPointerLabel, releasePointerLabel } from "./pointerLabelStore";

type PointerLabelHandlers<ElementType extends HTMLElement> = {
  onPointerEnter: (event: ReactPointerEvent<ElementType>) => void;
  onPointerLeave: (event: ReactPointerEvent<ElementType>) => void;
  onPointerMove: (event: ReactPointerEvent<ElementType>) => void;
};

function isMousePointer(event: ReactPointerEvent<HTMLElement>) {
  return event.pointerType === "mouse";
}

/**
 * Shows `label` in the global glass pointer follower while the mouse is over
 * the element the returned handlers are spread onto.
 */
export function usePointerLabel<ElementType extends HTMLElement>(
  label: string,
) {
  const token = useMemo(() => Symbol(label), [label]);

  const claim = useCallback(
    (event: ReactPointerEvent<ElementType>) => {
      if (!isMousePointer(event)) {
        return;
      }

      claimPointerLabel(token, label);
    },
    [label, token],
  );

  const release = useCallback(
    (event: ReactPointerEvent<ElementType>) => {
      if (!isMousePointer(event)) {
        return;
      }

      releasePointerLabel(token);
    },
    [token],
  );

  const hidePointerLabel = useCallback(() => {
    releasePointerLabel(token);
  }, [token]);

  useEffect(() => () => releasePointerLabel(token), [token]);

  return {
    hidePointerLabel,
    pointerLabelHandlers: {
      onPointerEnter: claim,
      onPointerLeave: release,
      onPointerMove: claim,
    } satisfies PointerLabelHandlers<ElementType>,
  };
}
