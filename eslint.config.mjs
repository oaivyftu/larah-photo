import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // `core-web-vitals` enables only a handful of jsx-a11y rules. The full
  // recommended set is what catches the regressions this project has already
  // had to fix by hand — unlabelled controls, ARIA on the wrong element.
  // Only the rules are spread: `eslint-config-next` already registers the
  // plugin, and registering it twice is a config error.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  // Turns off only the ESLint rules that would fight Prettier over formatting.
  // Must come after every config that defines rules, so its "off" wins. It
  // disables no jsx-a11y rule — those are correctness rules, not formatting
  // ones (Principle II). `globalIgnores` below sets no rules, so it may follow.
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Git worktrees live here, each with its own node_modules and build output.
    ".claude/**",
    // Playwright's generated output. Both directories contain its own bundled
    // report JavaScript, so without these the next `npm run lint` fails the
    // push gate on code nobody in this project wrote. The e2e specs themselves
    // are deliberately NOT ignored -- the suite is excluded from the hooks,
    // not from the gates (specs/012-browser-e2e-tests/contracts/run-location.md).
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
