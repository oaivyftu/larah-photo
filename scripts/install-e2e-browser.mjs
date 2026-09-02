// Fetches the one browser the end-to-end suite drives, as a `postinstall` step.
//
// Why a script rather than `"postinstall": "playwright install chromium"`:
// `npm install --omit=dev` and `npm ci --omit=dev` still run root lifecycle
// scripts, but do not install dev-only packages -- so the bare command exits
// with "playwright: not found" and takes the whole production install down with
// it. A deploy that installs production dependencies must not fail because a
// test tool is missing; that is precisely when it is *supposed* to be missing.
//
// So: resolve @playwright/test first, and if it is not there, say so and exit 0.
// The suite is a manual command (specs/012-browser-e2e-tests/contracts/run-location.md);
// nothing about an environment without it is broken.

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);

function skip(reason) {
  console.log(`Skipping the end-to-end browser download: ${reason}.`);
  process.exit(0);
}

// Playwright's own opt-out, honoured here too so one variable covers both the
// download and this wrapper (README: "Quality gates").
if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD) {
  skip("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is set");
}

try {
  require.resolve("@playwright/test");
} catch {
  skip("@playwright/test is not installed (a production install, most likely)");
}

const result = spawnSync("npx", ["playwright", "install", "chromium"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

// A genuine download failure still fails, deliberately. The guard above is for
// "the tool is absent by design", not for "the tool is here and broke".
process.exit(result.status ?? 1);
