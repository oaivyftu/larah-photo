// Registers Testing Library's DOM matchers (toBeInTheDocument, toHaveAttribute,
// ...) with Vitest's expect. Without this the component tests can only assert
// on raw nodes.
import "@testing-library/jest-dom/vitest";

// jsdom implements no media queries, and GSAP calls `matchMedia` as soon as a
// timeline is built. Without this any component with a page intro throws
// "matchMedia is not a function" before its own behaviour is reached.
// Non-matching by default, which is also what `prefers-reduced-motion:
// no-preference` should report in a headless environment.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
