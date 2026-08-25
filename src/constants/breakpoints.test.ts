import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as breakpoints from "./breakpoints";

// SCSS variables cannot be imported into JavaScript, so this file's constants
// are a hand-written mirror of src/styles/_breakpoints.scss. That is the kind
// of duplication that drifts silently: layout and behaviour then disagree only
// at one viewport width, which nothing else here would catch.
//
// Read the SCSS as text and hold the mirror to it. Only the values that are
// actually mirrored are checked -- adding a breakpoint to the SCSS does not
// oblige this file to mirror it, but changing one that IS mirrored fails here.

// Resolved from the project root rather than import.meta.url: under the
// jsdom environment that is not a file: URL.
const SCSS_PATH = resolve(process.cwd(), "src/styles/_breakpoints.scss");

function scssBreakpoints(): Map<string, number> {
  const source = readFileSync(SCSS_PATH, "utf8");
  const found = new Map<string, number>();
  for (const [, name, value] of source.matchAll(
    /^\$breakpoint-([\w-]+):\s*(\d+)px;/gm,
  )) {
    found.set(name, Number(value));
  }
  return found;
}

// BREAKPOINT_PHONE_LG mirrors $breakpoint-phone-lg, and so on.
function scssNameFor(constant: string): string {
  return constant
    .replace(/^BREAKPOINT_/, "")
    .toLowerCase()
    .replace(/_/g, "-");
}

describe("breakpoint mirror", () => {
  const scss = scssBreakpoints();

  it("finds the breakpoint scale in the stylesheet", () => {
    // Guards the parser itself: a regex that silently matches nothing would
    // make every assertion below vacuously pass.
    expect(scss.size).toBeGreaterThan(0);
  });

  const mirrored = Object.entries(breakpoints).filter(([name]) =>
    name.startsWith("BREAKPOINT_"),
  );

  it("mirrors at least one breakpoint", () => {
    expect(mirrored.length).toBeGreaterThan(0);
  });

  it.each(mirrored)("%s matches the stylesheet", (name, value) => {
    const scssName = scssNameFor(name);
    expect(
      scss.has(scssName),
      `${name} claims to mirror $breakpoint-${scssName}, which _breakpoints.scss does not define`,
    ).toBe(true);
    expect(
      value,
      `${name} is ${value}px but $breakpoint-${scssName} is ${scss.get(scssName)}px`,
    ).toBe(scss.get(scssName));
  });
});
