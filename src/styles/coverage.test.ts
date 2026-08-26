import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { COVERAGE, KINDS } from "../../scripts/audit-design-system.mjs";

// Feature 010's compliance check inspected three property groups. Nothing
// said so — the list lived only inside the script's regexes — so nothing
// could notice that line height, font weight, letter spacing and motion sat
// outside the rule while the check reported success. Four categories drifted
// in the gap between what the rule claimed and what the code looked at.
//
// COVERAGE closes that by writing the scope down. This holds the writing to
// the code, because a declaration nothing verifies is the same failure with
// better manners (feature 011 spec FR-008).

const SCRIPT = resolve(process.cwd(), "scripts/audit-design-system.mjs");

// Every kind the script actually records, read out of its own source. Reading
// the code rather than a second constant is the point: a `record("radius", …)`
// added without touching KINDS would otherwise slip past both.
function recordedKinds(): string[] {
  const source = readFileSync(SCRIPT, "utf8");
  const found = new Set<string>();
  for (const [, kind] of source.matchAll(/record\(\s*"([\w-]+)"/g)) {
    found.add(kind);
  }
  for (const [, list] of source.matchAll(
    /for \(const name of \[([^\]]+)\]\)/g,
  )) {
    for (const [, name] of list.matchAll(/"([\w-]+)"/g)) found.add(name);
  }
  return [...found].sort();
}

describe("audit coverage declaration", () => {
  it("finds the kinds the script records", () => {
    // Guards the parser: a regex matching nothing would make every assertion
    // below vacuously pass.
    expect(recordedKinds().length).toBeGreaterThan(0);
  });

  it.each(recordedKinds())("declares that it inspects %s", (kind) => {
    expect(
      COVERAGE.inspects,
      `the audit records "${kind}" but COVERAGE.inspects does not mention it — a category cannot be scanned silently`,
    ).toContain(kind);
  });

  it.each(COVERAGE.inspects)("actually inspects the declared %s", (kind) => {
    expect(
      recordedKinds(),
      `COVERAGE.inspects claims "${kind}" but nothing in the script records it — the declaration promises more than it delivers`,
    ).toContain(kind);
  });

  it("reports every inspected kind", () => {
    expect([...KINDS].sort()).toEqual([...COVERAGE.inspects].sort());
  });

  it.each(COVERAGE.excludes)(
    "gives a reason for excluding $group",
    ({ reason }) => {
      // An exclusion with no recorded reason is indistinguishable from an
      // oversight, which is precisely what this file exists to prevent.
      expect(reason.trim().length).toBeGreaterThan(40);
    },
  );

  it("does not exclude anything it also inspects", () => {
    const excluded = COVERAGE.excludes.map(({ group }) => group);
    for (const kind of COVERAGE.inspects) expect(excluded).not.toContain(kind);
  });
});
