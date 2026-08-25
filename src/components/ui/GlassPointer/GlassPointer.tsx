"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  getPointerLabel,
  getServerPointerLabel,
  subscribePointerLabel,
} from "./pointerLabelStore";
import styles from "./GlassPointer.module.scss";

/**
 * Single glass label pill that trails the mouse. Targets opt in with
 * `usePointerLabel`; the pointer itself keeps its native cursor (`zoom-in` /
 * `zoom-out` on image surfaces), so this only ever carries the label.
 */
export function GlassPointer() {
  const pathname = usePathname();
  const pillRef = useRef<HTMLDivElement>(null);
  const isActiveRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const startAnimationRef = useRef<() => void>(() => undefined);
  const positionRef = useRef({
    currentX: 0,
    currentY: 0,
    isPositioned: false,
    targetX: 0,
    targetY: 0,
  });
  const label = useSyncExternalStore(
    subscribePointerLabel,
    getPointerLabel,
    getServerPointerLabel,
  );

  useEffect(() => {
    const position = positionRef.current;
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    function paintPosition() {
      const pill = pillRef.current;

      if (!pill) {
        return;
      }

      pill.style.setProperty("--x", `${position.currentX.toFixed(3)}px`);
      pill.style.setProperty("--y", `${position.currentY.toFixed(3)}px`);
    }

    function animatePosition(time: number) {
      const previousTime = previousTimeRef.current ?? time;
      const elapsedFrames = Math.min((time - previousTime) / (1000 / 60), 4);
      const smoothing = 1 - Math.pow(1 - 0.14, elapsedFrames);

      previousTimeRef.current = time;
      position.currentX += (position.targetX - position.currentX) * smoothing;
      position.currentY += (position.targetY - position.currentY) * smoothing;
      paintPosition();

      const distance =
        Math.abs(position.targetX - position.currentX) +
        Math.abs(position.targetY - position.currentY);

      if (isActiveRef.current || distance > 0.05) {
        frameRef.current = window.requestAnimationFrame(animatePosition);
      } else {
        frameRef.current = null;
        previousTimeRef.current = null;
      }
    }

    function startAnimation() {
      if (!prefersReducedMotionRef.current && frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(animatePosition);
      }
    }

    startAnimationRef.current = startAnimation;

    function handleMotionPreferenceChange() {
      prefersReducedMotionRef.current = motionPreference.matches;

      if (!motionPreference.matches) {
        return;
      }

      position.currentX = position.targetX;
      position.currentY = position.targetY;
      paintPosition();

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        previousTimeRef.current = null;
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") {
        return;
      }

      position.targetX = event.clientX;
      position.targetY = event.clientY;

      if (!position.isPositioned) {
        position.currentX = event.clientX;
        position.currentY = event.clientY;
        position.isPositioned = true;
        paintPosition();
      }

      if (prefersReducedMotionRef.current) {
        position.currentX = event.clientX;
        position.currentY = event.clientY;
        paintPosition();
        return;
      }

      if (isActiveRef.current) {
        startAnimation();
      }
    }

    handleMotionPreferenceChange();
    motionPreference.addEventListener("change", handleMotionPreferenceChange);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      motionPreference.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
      window.removeEventListener("pointermove", handlePointerMove);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      startAnimationRef.current = () => undefined;
    };
  }, []);

  useEffect(() => {
    isActiveRef.current = label !== null;

    if (label !== null) {
      startAnimationRef.current();
    }
  }, [label]);

  if (pathname.startsWith("/studio")) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={styles["glass-pointer"]}
        data-active={label === null ? undefined : ""}
        ref={pillRef}
      >
        <span className={styles["glass-pointer__tint"]} />
        <span className={styles["glass-pointer__shine"]} />
        <span className={styles["glass-pointer__text"]}>{label}</span>
      </div>

      <svg aria-hidden="true" className={styles["glass-pointer__defs"]}>
        <filter
          id="glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0015 0.006"
            numOctaves={1}
            seed={24}
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
            <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
            <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation={8} result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale={5}
            specularConstant={1}
            specularExponent={100}
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x={-200} y={-200} z={200} />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1={0}
            k2={1}
            k3={1}
            k4={0}
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale={72}
            xChannelSelector="R"
            yChannelSelector="A"
            result="disp1"
          />
          <feOffset in="softMap" dx={0.35} dy={0} result="softMapCA" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMapCA"
            scale={72}
            xChannelSelector="R"
            yChannelSelector="A"
            result="dispCA"
          />
          <feColorMatrix
            in="dispCA"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="caRed"
          />
          <feColorMatrix
            in="dispCA"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="caGreen"
          />
          <feColorMatrix
            in="dispCA"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="caBlue"
          />
          <feOffset in="caRed" dx={1.1} dy={0} result="caRedOffset" />
          <feOffset in="caGreen" dx={-1} dy={0} result="caGreenOffset" />
          <feOffset in="caBlue" dx={-1.1} dy={0} result="caBlueOffset" />
          <feBlend
            in="caRedOffset"
            in2="caGreenOffset"
            mode="screen"
            result="caMix1"
          />
          <feBlend
            in="caMix1"
            in2="caBlueOffset"
            mode="screen"
            result="caFinal"
          />
          <feGaussianBlur in="caFinal" stdDeviation={0.25} result="caSoft" />
          <feComposite
            in="caSoft"
            in2="SourceGraphic"
            operator="in"
            result="caClipped"
          />
          <feBlend
            in="disp1"
            in2="caClipped"
            mode="lighten"
            result="finalGlass"
          />
        </filter>
      </svg>
    </>
  );
}
