#!/usr/bin/env node
// Reports where component stylesheets bypass the design system.
//
// The rule, per specs/010-design-system-compliance/spec.md SC-001..SC-003 and
// contracts/token-naming.md: every colour, type size and spacing value in a
// component stylesheet resolves through src/styles/. There is no use-count
// threshold and no comment that excuses a literal -- a value used once is
// still a design decision, and a stylesheet is not where design decisions are
// recorded.
//
// The report still separates them, because they are not equally urgent:
//   (b) a literal used 2+ times -- already drifting; fix first.
//   (c) a literal used once     -- not yet drifting, but equally not owned.
//   (d) a component-local custom property holding a raw value -- a private
//       token, the anti-pattern Principle VII exists to replace. The first
//       version of this script skipped every `--` declaration outright and
//       so could not see these at all.
//   (a) totals, for context.
//
// Exits non-zero when (b) or (c) is non-empty.
//
// Node rather than shell: the project already requires Node, so this adds no
// dependency, and the script has to join multi-line declarations before
// parsing -- every linear-gradient and multi-shadow box-shadow in this
// codebase spans several lines, and a line-by-line scan silently misses the
// continuation lines where most raw rgba() values actually live.

import { readFileSync, globSync } from "node:fs";

const FILES = globSync("src/**/*.module.scss").sort();

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)/g;
const SPACING_PROPS =
  /^(gap|row-gap|column-gap|padding|margin|padding-(top|right|bottom|left)|margin-(top|right|bottom|left))$/;

// Keywords, not values. `font-size: inherit` states no size of its own, and
// `margin: auto` is a layout instruction rather than a spacing step.
const KEYWORDS = new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "normal",
  "auto",
  "0",
  "0s",
  "0ms",
]);

// Zero is the absence of motion rather than a speed: a reduced-motion
// override setting a duration to zero is not a violation (spec 011 FR-010),
// which is why 0s and 0ms sit in KEYWORDS above.
const DURATION = /(?<![\w.-])\d+(?:\.\d+)?m?s(?![\w-])/g;
const EASING = /cubic-bezier\([^)]*\)/g;
const MOTION_PROPS =
  /^(transition|animation|(transition|animation)-(duration|timing-function))$/;

// A raw length, or a clamp() of them. Decides whether a component-local
// custom property is holding a design decision that belongs in src/styles/.
const RAW_VALUE = /^(-?[\d.]+(px|rem|em|vw|vh|%)|clamp\([^)]*\))$/;

const found = new Map();

function record(kind, value, file, line) {
  const key = kind + " " + value;
  if (!found.has(key)) found.set(key, { kind, value, uses: [] });
  found.get(key).uses.push({ file, line });
}

// A spacing shorthand holds several independent values. Keyed on the whole
// declaration, `1rem` and `1rem 0` read as two unrelated things and a
// clamp() inside a shorthand never matches the same clamp() standing alone --
// which hid 7 genuinely repeated values in the first version of this script.
// Split on top-level whitespace, keeping bracketed calls intact.
function splitValues(value) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === " " && depth === 0) {
      if (current.trim()) out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

for (const file of FILES) {
  const lines = readFileSync(file, "utf8").split("\n");
  let inBlockComment = false;

  let buffer = "";
  let bufferStart = 0;

  const flush = () => {
    const decl = buffer.trim();
    buffer = "";
    if (!decl) return;

    const colon = decl.indexOf(":");
    if (colon === -1) return;

    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (!value || prop.includes("{") || prop.includes("}")) return;

    // A component-local custom property holding a raw value is not the token
    // layer -- it is a private token, which is the thing Principle VII exists
    // to prevent. Only src/styles/ defines tokens, and this scan never looks
    // there. So these are audited like any other declaration.
    const isLocalToken = prop.startsWith("--");
    if (isLocalToken && RAW_VALUE.test(value)) {
      record("local-token", prop + ": " + value, file, bufferStart);
    }

    for (const match of value.match(COLOUR) ?? []) {
      record("colour", match, file, bufferStart);
    }

    if (isLocalToken) return;

    // A shorthand that mixes a token with a literal is the easiest place for
    // a literal to hide: `padding: 0 var(--page-gutter) clamp(4rem, 9vw, 7rem)`
    // is two thirds compliant and wholly uncaught if the declaration is
    // skipped for containing a var(). Judge each value on its own instead.
    if (
      prop === "font-size" &&
      !KEYWORDS.has(value) &&
      !value.includes("var(--")
    ) {
      record("type-size", value, file, bufferStart);
    }
    for (const name of ["line-height", "font-weight", "letter-spacing"]) {
      if (prop === name && !KEYWORDS.has(value) && !value.includes("var(--")) {
        record(name, value, file, bufferStart);
      }
    }

    // Durations and curves hide inside shorthands, and one declaration may
    // carry several: `transition: opacity 180ms ease, transform 220ms ease`
    // holds two of each kind. So scan the value rather than judge it whole.
    if (MOTION_PROPS.test(prop)) {
      for (const match of value.match(DURATION) ?? []) {
        if (!KEYWORDS.has(match)) record("duration", match, file, bufferStart);
      }
      for (const match of value.match(EASING) ?? []) {
        record("easing", match, file, bufferStart);
      }
    }
    if (SPACING_PROPS.test(prop)) {
      for (const part of splitValues(value)) {
        if (!KEYWORDS.has(part) && !part.includes("var(--")) {
          record("spacing", part, file, bufferStart);
        }
      }
    }
  };

  lines.forEach((raw, i) => {
    let line = raw;

    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end === -1) return;
      inBlockComment = false;
      line = line.slice(end + 2);
    }

    const blockStart = line.indexOf("/*");
    if (blockStart !== -1) {
      const end = line.indexOf("*/", blockStart + 2);
      if (end === -1) {
        inBlockComment = true;
        line = line.slice(0, blockStart);
      } else {
        line = line.slice(0, blockStart) + line.slice(end + 2);
      }
    }
    const lineComment = line.indexOf("//");
    if (lineComment !== -1) line = line.slice(0, lineComment);

    if (!line.trim()) return;

    for (const char of line) {
      if (char === "{" || char === "}") {
        buffer = "";
        continue;
      }
      if (char === ";") {
        flush();
        bufferStart = i + 2;
        continue;
      }
      if (!buffer.trim()) bufferStart = i + 1;
      buffer += char;
    }
  });

  flush();
}

const entries = [...found.values()];
const duplicated = entries.filter((e) => e.uses.length >= 2);
const lone = entries.filter((e) => e.uses.length === 1);

const short = (f) => f.replace(/^src\//, "").replace(/\.module\.scss$/, "");
const byKind = (list, kind) => list.filter((e) => e.kind === kind);
const KINDS = [
  "colour",
  "type-size",
  "line-height",
  "font-weight",
  "letter-spacing",
  "spacing",
  "duration",
  "easing",
  "local-token",
];
const rule = (n) => "-".repeat(n);

const out = [];
out.push("DESIGN SYSTEM AUDIT");
out.push(rule(72));
out.push("Scanned " + FILES.length + " component stylesheets.");
out.push("Every value below must resolve through src/styles/. Use count sets");
out.push("the order to fix them in, not whether they must be fixed.");
out.push("A local-token entry is a component-local custom property holding a");
out.push("raw value: a private token, the anti-pattern Principle VII names.");
out.push("");

out.push("(b) USED 2+ TIMES -- already drifting; fix first");
out.push(rule(72));
if (duplicated.length === 0) {
  out.push("  none");
} else {
  for (const kind of KINDS) {
    const group = byKind(duplicated, kind).sort(
      (a, b) => b.uses.length - a.uses.length,
    );
    if (!group.length) continue;
    const total = group.reduce((n, e) => n + e.uses.length, 0);
    out.push("");
    out.push("  " + kind + ": " + group.length + " values, " + total + " uses");
    for (const e of group) {
      const where = [...new Set(e.uses.map((u) => short(u.file)))].join(", ");
      out.push(
        "    " +
          e.value.padEnd(38) +
          " x" +
          e.uses.length +
          "  [" +
          where +
          "]",
      );
    }
  }
}
out.push("");

out.push("(c) USED ONCE -- not drifting yet, and equally not owned");
out.push(rule(72));
if (lone.length === 0) {
  out.push("  none");
} else {
  for (const kind of KINDS) {
    const group = byKind(lone, kind);
    if (!group.length) continue;
    out.push("");
    out.push("  " + kind + ": " + group.length);
    for (const e of group) {
      const u = e.uses[0];
      out.push(
        "    " + e.value.padEnd(38) + " " + short(u.file) + ":" + u.line,
      );
    }
  }
}
out.push("");

out.push("(a) TOTALS");
out.push(rule(72));
for (const kind of KINDS) {
  const dupVals = byKind(duplicated, kind).length;
  const dup = byKind(duplicated, kind).reduce((n, e) => n + e.uses.length, 0);
  const single = byKind(lone, kind).length;
  out.push(
    "  " +
      kind.padEnd(10) +
      String(dupVals + single).padStart(3) +
      " distinct values to tokenise (" +
      String(dupVals).padStart(2) +
      " repeated across " +
      String(dup).padStart(3) +
      " uses, " +
      String(single).padStart(3) +
      " used once)",
  );
}

const fail = duplicated.length > 0 || lone.length > 0;
out.push("");
out.push(rule(72));
out.push(fail ? "FAIL -- see (b) and (c) above" : "PASS");

console.log(out.join("\n"));
process.exit(fail ? 1 : 0);
