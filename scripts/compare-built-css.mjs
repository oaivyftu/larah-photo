#!/usr/bin/env node
// Diffs the rendered CSS of the working tree against a build of HEAD.
//
// Written for feature 010, whose whole safety argument is that 168 value
// substitutions changed nothing visible. "Compare by eye at three widths" was
// the plan; this is stronger and repeatable -- it compares what the browser
// actually receives, every declaration of it, not the handful a screenshot
// happens to show.
//
// It resolves custom properties on both sides, so `padding: var(--space-md)`
// and `padding: 1rem` compare equal. It then normalises three things the CSS
// minifier does differently once a var() is present, none of which change
// rendering:
//
//   - an omitted zero blur radius: `0 1px #c` == `0 1px 0 #c`
//   - a dropped default gradient angle: `linear-gradient(180deg, …)`
//   - the gap shorthand: `gap: A B` == `row-gap: A; column-gap: B`
//
// Usage: node scripts/compare-built-css.mjs
// Exits 0 when the rendered CSS is identical, 1 when it is not.
//
// It stashes, builds, and restores, so commit or stash deliberately first if
// the tree is in a state you care about.

import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const run = (cmd) => execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] });

function builtCss() {
  const dir = ".next/static/chunks";
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .sort()
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
}

// Inline every custom property that has exactly one definition. Applied
// identically to both sides, so a scoped token resolves wrongly but *equally*
// and the comparison stays valid.
function resolve(css) {
  const seen = new Map();
  for (const [, name, value] of css.matchAll(/(--[\w-]+):\s*([^;}]+)/g)) {
    const set = seen.get(name) ?? new Set();
    set.add(value.trim());
    seen.set(name, set);
  }
  const unique = new Map(
    [...seen].filter(([, v]) => v.size === 1).map(([k, v]) => [k, [...v][0]]),
  );
  for (let i = 0; i < 6; i += 1) {
    const next = css.replace(
      /var\((--[\w-]+)\)/g,
      (whole, name) => unique.get(name) ?? whole,
    );
    if (next === css) break;
    css = next;
  }
  return css;
}

const LENGTH = String.raw`-?[\d.]+(?:px)?`;

function normalise(decl) {
  return decl
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim()
    .replace("linear-gradient(180deg,", "linear-gradient(")
    .replace(new RegExp(`(${LENGTH}) (${LENGTH}) 0 (#|rgb)`, "g"), "$1 $2 $3");
}

function declarations(css) {
  const out = [];
  for (const [, body] of resolve(css).matchAll(/\{([^{}]*)\}/g)) {
    for (const raw of body.split(";")) {
      const decl = normalise(raw);
      if (!decl || decl.startsWith("--")) continue;
      const gap = decl.match(/^gap:(\S+) (\S+)$/);
      if (gap) out.push(`row-gap:${gap[1]}`, `column-gap:${gap[2]}`);
      else out.push(decl);
    }
  }
  return out.sort();
}

run("npm run build");
const after = declarations(builtCss());

run("git stash --include-untracked");
try {
  run("npm run build");
  var before = declarations(builtCss());
} finally {
  run("git stash pop");
}

const count = (list) => {
  const m = new Map();
  for (const d of list) m.set(d, (m.get(d) ?? 0) + 1);
  return m;
};
const [b, a] = [count(before), count(after)];
const changed = [...new Set([...b.keys(), ...a.keys()])]
  .filter((d) => (b.get(d) ?? 0) !== (a.get(d) ?? 0))
  .sort();

console.log(`${before.length} declarations before / ${after.length} after`);
if (changed.length === 0) {
  console.log("RENDERED CSS IDENTICAL");
  process.exit(0);
}
for (const d of changed.slice(0, 40)) {
  console.log(`  ${b.get(d) ?? 0} -> ${a.get(d) ?? 0}  ${d.slice(0, 150)}`);
}
console.log(`\n${changed.length} declarations differ`);
process.exit(1);
