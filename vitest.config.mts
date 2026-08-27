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
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        // Sanity Studio schema definitions: declarative objects handed to
        // `defineType`/`defineField` that configure the Studio's editing UI.
        // None of it runs on the site, and a test over it could only assert
        // the object literal back at itself -- coverage that reads as
        // reassurance while proving nothing. Their real check is the Studio
        // loading and the fetchers validating what editors produce, which
        // fetchers.test.ts covers.
        "src/sanity/schemaTypes/**",
      ],
    },
  },
});
