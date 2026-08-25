// Registers Testing Library's DOM matchers (toBeInTheDocument, toHaveAttribute,
// ...) with Vitest's expect. Without this the component tests can only assert
// on raw nodes.
import "@testing-library/jest-dom/vitest";
