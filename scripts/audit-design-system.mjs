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
  "auto",
  "0",
]);

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

    for (const match of value.match(COLOUR) ?? []) {
      record("colour", match, file, bufferStart);
    }

    // A value mixing a token with a literal still hides the literal, so the
    // colour scan above runs regardless. But the declaration as a whole is
    // already partly compliant -- do not also judge it on size or spacing.
    if (value.includes("var(--") || isLocalToken) return;

    if (prop === "font-size" && !KEYWORDS.has(value)) {
      record("type-size", value, file, bufferStart);
    }
    if (SPACING_PROPS.test(prop)) {
      for (const part of splitValues(value)) {
        if (!KEYWORDS.has(part)) record("spacing", part, file, bufferStart);
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
const KINDS = ["colour", "type-size", "spacing"];
const rule = (n) => "-".repeat(n);

const out = [];
out.push("DESIGN SYSTEM AUDIT");
out.push(rule(72));
out.push("Scanned " + FILES.length + " component stylesheets.");
out.push("Every value below must resolve through src/styles/. Use count sets");
out.push("the order to fix them in, not whether they must be fixed.");
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
