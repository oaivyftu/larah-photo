import { defineConfig, devices } from "@playwright/test";

// Shape follows this pinned Next.js version's own guide --
// node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md -- rather
// than memorised Playwright conventions (constitution Principle VI), the same
// way vitest.config.mts follows the vitest.md beside it.
//
// Four deliberate departures from that guide, each reasoned in
// specs/012-browser-e2e-tests/research.md:
//
// 1. One browser, not three (research.md §3). The guide configures Chromium,
//    Firefox and WebKit. This suite runs on a developer's machine on demand,
//    and every extra second of a manual command is a reason not to run it.
//    Cross-engine coverage is a different goal with a different trigger -- a
//    library upgrade, not a feature change -- and it is the first thing to add
//    the day this project gains CI.
//
// 2. `reuseExistingServer` keyed on E2E_FRESH_BUILD, not on CI (research.md
//    §8). There is no CI, so the guide's `!process.env.CI` would mean never
//    reusing. Reuse is the right default for the common case -- a dev server
//    already up -- but it is wrong exactly when a run has to reflect a change
//    just made, above all the SC-007 demonstration that breaks a behaviour and
//    expects the suite to fail. Without the escape, a stale `next start` on
//    3000 serves the pre-break build and the suite passes.
//
// 3. `forbidOnly: true` unconditionally. The guide's default is
//    `!!process.env.CI`, which here means never. A forgotten `test.only` would
//    then run one test and report green while SC-004 claims eighteen.
//
// 4. One worker (see `workers` below).
// The site's port, overridable. `next start` reads PORT itself, so one variable
// moves the server and the baseURL together.
//
// This is not decoration. It was added after the suite spent a run passing
// against the wrong site: a `next dev` for a different checkout of this repo --
// a Git worktree -- was already holding 3000, `next start` failed with
// EADDRINUSE, and `reuseExistingServer` cheerfully pointed the browser at the
// other checkout. Six journeys went green while testing code that was not the
// code under change. Reuse is still the right default (research.md §8), but a
// developer who has a server up for something else needs a way out that is not
// "kill their server".
const port = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",

  // Serial, on purpose. Four of the nine journeys assert on animation and
  // timer state -- the gallery controls recede after 1.6s of pointer idle, the
  // page intro plays a real GSAP timeline -- and those are precisely the
  // assertions that go flaky when several browser contexts compete for the
  // machine. A flaky suite nobody trusts is the failure mode this whole
  // feature exists to avoid, and 18 serial tests still finish in about a
  // minute. Revisit if the journey count grows enough to hurt.
  workers: 1,
  fullyParallel: false,

  forbidOnly: true,
  // No retries. A journey that only passes on the second attempt is telling
  // you something, and a retry would hide it (research.md §12).
  retries: 0,

  // Above CONTROLS_HOVER_IDLE_DELAY (2600ms) in WorkProjectGalleryClient, so
  // J4 can wait for the controls to recede by asserting the end state rather
  // than sleeping for a guessed duration. Playwright's 5s default would leave
  // that assertion with under half a second of headroom.
  expect: { timeout: 10_000 },

  reporter: [["list"]],

  use: {
    baseURL,
    // FR-009: this suite asserts that behaviour happens, never that it looks
    // right. Screenshots and video are off so a failure cannot quietly turn
    // into a visual comparison.
    screenshot: "off",
    video: "off",
    trace: "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Production, not `next dev`. The curtain and the intro timelines are
    // sensitive to hydration timing, and Strict Mode's double render in dev is
    // exactly the difference that produces a suite passing on one and failing
    // on the other (research.md §8).
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.E2E_FRESH_BUILD,
    // A production build from cold is well past Playwright's 60s default.
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
