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
  const label = useSyncExternalStore(
    subscribePointerLabel,
    getPointerLabel,
    getServerPointerLabel,
  );

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const pill = pillRef.current;

      if (!pill || event.pointerType !== "mouse") {
        return;
      }

      pill.style.setProperty("--x", `${event.clientX}px`);
      pill.style.setProperty("--y", `${event.clientY}px`);
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

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
          <feBlend in="disp1" in2="caClipped" mode="lighten" result="finalGlass" />
        </filter>
      </svg>
    </>
  );
}
