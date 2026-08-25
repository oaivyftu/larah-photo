#!/usr/bin/env node
// Reports where component stylesheets bypass the design system.
//
// Three categories, per
// specs/010-design-system-compliance/contracts/token-naming.md:
//   (b) a literal used 2+ times -> MUST become a token. The hard rule.
//   (c) a literal used once with no explanatory comment -> MUST gain one,
//       or become a token.
//   (a) totals, reported for context only.
//
// Exits non-zero when (b) or (c) is non-empty.
//
// Node rather than shell: the project already requires Node, so this adds no
// dependency, and deciding whether a single-use literal carries an
// explanation means reading the line above it — awkward in awk, trivial here.

import { readFileSync, globSync } from "node:fs";

const FILES = globSync("src/**/*.module.scss").sort();

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)/g;
const SPACING_PROPS =
  /^(gap|row-gap|column-gap|padding|margin|padding-(top|right|bottom|left)|margin-(top|right|bottom|left))$/;

const found = new Map();

function record(kind, value, file, line, explained) {
  const key = kind + " " + value;
  if (!found.has(key)) found.set(key, { kind, value, uses: [] });
  found.get(key).uses.push({ file, line, explained });
}

for (const file of FILES) {
  const lines = readFileSync(file, "utf8").split("\n");
  let inBlockComment = false;

  // Declarations span multiple lines constantly in this codebase — every
  // linear-gradient and multi-shadow box-shadow does. Reading line by line
  // silently skips the continuation lines, which is where most of the raw
  // rgba() values in this project actually live. So accumulate whole
  // declarations, then parse.
  let buffer = "";
  let bufferStart = 0;
  let bufferHadComment = false;
  let previousWasComment = false;

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
    // layer — it is a private token, which is the thing Principle VII exists
    // to prevent. Only src/styles/ defines tokens, and this scan never looks
    // there. So these are audited like any other declaration.
    const isLocalToken = prop.startsWith("--");

    // "Explained" means the declaration carries a comment of its own or is
    // preceded by one: the reader's signal that a literal is deliberate.
    const explained = bufferHadComment || previousWasComment;

    if (value.includes("var(--")) {
      // Mixed values still hide literals, e.g. a gradient from a token to a
      // raw rgba. Fall through to the colour scan, but do not judge the
      // declaration as a whole on size or spacing.
      for (const match of value.match(COLOUR) ?? []) {
        record("colour", match, file, bufferStart, explained);
      }
      return;
    }

    for (const match of value.match(COLOUR) ?? []) {
      record("colour", match, file, bufferStart, explained);
    }
    if (isLocalToken) return;

    if (prop === "font-size") {
      record("type-size", value, file, bufferStart, explained);
    }
    if (SPACING_PROPS.test(prop) && !/^(0|auto|0 auto)$/.test(value)) {
      record("spacing", value, file, bufferStart, explained);
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

    // Strip comments before parsing, but remember that one was here.
    const blockStart = line.indexOf("/*");
    if (blockStart !== -1) {
      const end = line.indexOf("*/", blockStart + 2);
      if (end === -1) {
        inBlockComment = true;
        line = line.slice(0, blockStart);
      } else {
        line = line.slice(0, blockStart) + line.slice(end + 2);
      }
      bufferHadComment = true;
    }
    const lineComment = line.indexOf("//");
    if (lineComment !== -1) {
      line = line.slice(0, lineComment);
      bufferHadComment = true;
    }

    if (!line.trim()) {
      if (bufferHadComment && !buffer.trim()) previousWasComment = true;
      return;
    }

    for (const char of line) {
      if (char === "{" || char === "}") {
        buffer = "";
        bufferHadComment = false;
        previousWasComment = false;
        continue;
      }
      if (char === ";") {
        flush();
        previousWasComment = false;
        bufferHadComment = false;
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
const loneUnexplained = entries.filter(
  (e) => e.uses.length === 1 && !e.uses[0].explained,
);
const loneExplained = entries.filter(
  (e) => e.uses.length === 1 && e.uses[0].explained,
);

const short = (f) => f.replace(/^src\//, "").replace(/\.module\.scss$/, "");
const byKind = (list, kind) => list.filter((e) => e.kind === kind);
const KINDS = ["colour", "type-size", "spacing"];
const rule = (n) => "-".repeat(n);

const out = [];
out.push("DESIGN SYSTEM AUDIT");
out.push(rule(72));
out.push("Scanned " + FILES.length + " component stylesheets.");
out.push("");

out.push("(b) USED 2+ TIMES -- must become a token");
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

out.push("(c) USED ONCE, NO EXPLANATION -- must gain a comment or a token");
out.push(rule(72));
if (loneUnexplained.length === 0) {
  out.push("  none");
} else {
  for (const kind of KINDS) {
    const group = byKind(loneUnexplained, kind);
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
  const dup = byKind(duplicated, kind).reduce((n, e) => n + e.uses.length, 0);
  const dupVals = byKind(duplicated, kind).length;
  const lone = byKind(loneUnexplained, kind).length;
  const ok = byKind(loneExplained, kind).length;
  out.push(
    "  " +
      kind.padEnd(10) +
      String(dupVals).padStart(3) +
      " duplicated values / " +
      String(dup).padStart(3) +
      " uses, " +
      String(lone).padStart(3) +
      " unexplained single, " +
      String(ok).padStart(3) +
      " explained single",
  );
}

const fail = duplicated.length > 0 || loneUnexplained.length > 0;
out.push("");
out.push(rule(72));
out.push(fail ? "FAIL -- see (b) and (c) above" : "PASS");

console.log(out.join("\n"));
process.exit(fail ? 1 : 0);
