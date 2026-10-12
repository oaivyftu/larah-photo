import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  RESERVED_ROOT_SEGMENTS,
  isReservedRootSegment,
} from "./reservedRoutes";

const appDir = path.resolve(__dirname, "../app");

/**
 * The real top-level URL segments: directory names under `src/app` and under
 * the `(site)` route group, minus route groups, parallel slots, dynamic
 * segments, private folders and plain files.
 */
function topLevelSegments(): string[] {
  const names = [appDir, path.join(appDir, "(site)")].flatMap((dir) =>
    readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  );

  return names.filter(
    (name) =>
      !name.startsWith("(") &&
      !name.startsWith("@") &&
      !name.startsWith("[") &&
      !name.startsWith("_"),
  );
}

describe("RESERVED_ROOT_SEGMENTS", () => {
  const discovered = topLevelSegments();

  it("is read from the real route tree, not nothing", () => {
    // A filter matching nothing would let the drift check pass vacuously.
    expect(discovered.length).toBeGreaterThan(0);
    expect(discovered).toContain("work");
  });

  it("covers every static top-level route", () => {
    const missing = discovered.filter((name) => !isReservedRootSegment(name));

    expect(
      missing,
      "a new top-level route exists that an editor could claim as a landing-page slug and never see",
    ).toEqual([]);
  });

  it("keeps the studio and the api, which live at the app root", () => {
    expect(RESERVED_ROOT_SEGMENTS).toContain("studio");
    expect(RESERVED_ROOT_SEGMENTS).toContain("api");
  });
});
