import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Shape follows this pinned Next.js version's own guide —
// node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md — rather than
// memorised Vitest conventions (constitution Principle VI).
//
// One deliberate departure: that guide lists `vite-tsconfig-paths` for `@/*`
// alias resolution. Vite 8 resolves tsconfig paths natively via
// `resolve.tsconfigPaths`, and the plugin now prints a notice saying so, so the
// extra dependency is not carried (Technology Constraints: no new dependency
// for a problem the stack already solves).
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // No `globals: true`: test files import `describe`/`it`/`expect` from
    // "vitest" explicitly, so `tsc` type-checks them without needing
    // "vitest/globals" added to tsconfig's `types`.
    // Colocated tests only. Async Server Components under src/app are not
    // testable here (research.md §2) and none of them get a .test file.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
