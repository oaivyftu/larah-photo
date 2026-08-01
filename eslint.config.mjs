import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // `core-web-vitals` enables only a handful of jsx-a11y rules. The full
  // recommended set is what catches the regressions this project has already
  // had to fix by hand — unlabelled controls, ARIA on the wrong element.
  // Only the rules are spread: `eslint-config-next` already registers the
  // plugin, and registering it twice is a config error.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Git worktrees live here, each with its own node_modules and build output.
    ".claude/**",
  ]),
]);

export default eslintConfig;
