import type { FullConfig } from "@playwright/test";

/**
 * Refuse to start rather than fail nine journeys anonymously.
 *
 * These journeys need a rendering site, which needs a content source
 * (constitution Principle I). Without one, every assertion times out against a
 * page that never had anything on it -- the ambiguous failure spec 012 FR-005
 * forbids. The content-failure path itself is already covered without a browser
 * in `src/sanity/fetchers.test.ts`, so this does not duplicate it; it just says
 * what is wrong and stops.
 *
 * Playwright starts `webServer` before this runs, so the site is up by the time
 * the fetch below happens.
 */

// Dataset is not required here: src/sanity/env.ts falls back to "production"
// when it is omitted, which is a valid configuration the app runs on.
const REQUIRED_ENV = ["NEXT_PUBLIC_SANITY_PROJECT_ID"] as const;

function setupError(problem: string, fix: string) {
  return new Error(
    [
      "",
      "  Browser end-to-end tests cannot start.",
      "",
      `  ${problem}`,
      `  ${fix}`,
      "",
      "  See specs/012-browser-e2e-tests/quickstart.md for the full setup.",
      "",
    ].join("\n"),
  );
}

export default async function globalSetup(config: FullConfig) {
  // Next loads .env.local into the server it starts; this process is a separate
  // Node program and gets nothing. Load it here too so the check below can name
  // the missing variable instead of reporting every variable as missing.
  // Guarded: an environment that exports the variables directly has no file,
  // and that is a valid setup rather than an error.
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local. The check below decides whether that matters.
  }

  const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw setupError(
      `Missing Sanity configuration: ${missing.join(", ")}.`,
      "Copy .env.example to .env.local and fill in the Sanity values.",
    );
  }

  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3000";
  const workIndex = new URL("/work", baseURL);

  const response = await fetch(workIndex).catch((cause: unknown) => {
    throw setupError(
      `The site did not answer at ${workIndex}.`,
      `Start it with \`npm run dev\`, or let Playwright build it. (${String(cause)})`,
    );
  });

  if (!response.ok) {
    throw setupError(
      `${workIndex} returned ${response.status}.`,
      "The work index must render before any journey can run.",
    );
  }

  const html = await response.text();

  // The card hook rather than a project name: every title on this site is
  // editor-owned, and asserting on one would break when an editor renames it.
  if (!html.includes("data-work-card")) {
    throw setupError(
      "The work index rendered no project cards.",
      "These journeys need at least one project in the Sanity dataset.",
    );
  }
}
