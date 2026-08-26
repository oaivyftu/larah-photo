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
  return (
    decl
      .replace(/\s*,\s*/g, ",")
      .replace(/\s+/g, " ")
      .trim()
      .replace("linear-gradient(180deg,", "linear-gradient(")
      .replace(new RegExp(`(${LENGTH}) (${LENGTH}) 0 (#|rgb)`, "g"), "$1 $2 $3")
      // `ease` is the default timing function, so the minifier drops it when a
      // transition is all literals and keeps it once a var() appears. Guard
      // the boundaries: ease-in and ease-out are different functions.
      .replace(/(?<![-\w])ease(?![-\w])/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+,/g, ",")
      .trim()
  );
}

// The animation shorthand is order-independent apart from its two times, and
// the minifier reorders it only when every part is a literal. Sort the parts
// so `animation:<name> .42s both` and `animation:.42s both <name>` compare
// equal -- they set the same thing.
// The animation shorthand accepts its parts in almost any order, and the
// minifier moves the animation NAME when every part is a literal but cannot
// once a var() appears. Move the name to the end on both sides so the two
// forms compare equal.
//
// Only the name is moved. Sorting the whole layer would be wrong: the first
// time in the shorthand is the duration and the second is the delay, so
// `700ms 90ms` and `90ms 700ms` are different animations and must not compare
// equal.
const ANIMATION_KEYWORD =
  /^(normal|reverse|alternate|alternate-reverse|none|forwards|backwards|both|running|paused|infinite|linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end)$/;

function canonicalAnimation(decl) {
  const m = decl.match(/^animation:(.*)$/);
  if (!m) return decl;
  const layers = splitTopLevel(m[1], ",").map((layer) => {
    const parts = splitTopLevel(layer.trim(), " ").filter(Boolean);
    const isName = (part) =>
      !ANIMATION_KEYWORD.test(part) &&
      !/^-?[\d.]+m?s$/.test(part) &&
      !/^-?[\d.]+$/.test(part) &&
      !/^(cubic-bezier|steps|linear)\(/.test(part);
    // The two <time> values are positional -- the first is the duration and
    // the second is the delay -- so their order is preserved. Everything
    // else in the shorthand is order-free per spec, so it is sorted, which
    // is what makes `.7s linear 90ms` and `.7s 90ms linear` compare equal.
    const isTime = (part) => /^-?[\d.]+m?s$/.test(part);
    const times = parts.filter(isTime);
    const names = parts.filter((part) => !isTime(part) && isName(part));
    const rest = parts.filter((part) => !isTime(part) && !isName(part)).sort();
    return [...times, ...rest, ...names].join(" ");
  });
  return "animation:" + layers.join(",");
}

// Split on separators that are not inside brackets, so cubic-bezier(.7,0,.2,1)
// survives a comma split intact.
function splitTopLevel(value, sep) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === sep && depth === 0) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

function declarations(css) {
  const out = [];
  for (const [, body] of resolve(css).matchAll(/\{([^{}]*)\}/g)) {
    for (const raw of body.split(";")) {
      const decl = normalise(raw);
      if (!decl || decl.startsWith("--")) continue;
      const decl2 = canonicalAnimation(decl);
      if (decl2 !== decl) {
        out.push(decl2);
        continue;
      }
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
