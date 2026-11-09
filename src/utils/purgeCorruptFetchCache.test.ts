import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  corruptionIn,
  purgeCorruptEntries,
} from "../../scripts/purge-corrupt-fetch-cache.mjs";

// What a Next fetch-cache file looks like: JSON wrapping the response, with
// the body as base64. Built here so the tests do not depend on a real cache.
function entry(body: string, contentType = "application/json; charset=utf-8") {
  return JSON.stringify({
    kind: "FETCH",
    data: {
      headers: { "content-type": contentType },
      body: Buffer.from(body, "utf8").toString("base64"),
      status: 200,
      url: "https://example.test/query",
    },
    revalidate: 3600,
    tags: ["sanity"],
  });
}

const GOOD_BODY = JSON.stringify({
  result: [{ lqip: "data:image/jpeg;base64,AAAA" }],
});

describe("corruptionIn", () => {
  it("passes a sound JSON entry", () => {
    expect(corruptionIn(entry(GOOD_BODY))).toBeNull();
  });

  it("flags a body cut off mid-string", () => {
    expect(corruptionIn(entry(GOOD_BODY.slice(0, 30)))).toMatch(
      /body is not valid JSON/,
    );
  });

  it("flags a body that turns to noise partway, as the Sanity entry did", () => {
    // Valid text up to an offset, then bytes that decode to control characters:
    // the shape of two writes of different header lengths interleaving.
    const noisy = `${GOOD_BODY.slice(0, 20)}\u0019\u0018\u001c�${GOOD_BODY.slice(24)}`;

    expect(corruptionIn(entry(noisy))).toMatch(/body is not valid JSON/);
  });

  it("flags a cache file with a tail past its end", () => {
    // A complete entry followed by the leftover of a longer one.
    const withTail = `${entry(GOOD_BODY)}"}],"revalidate":3600}`;

    expect(corruptionIn(withTail)).toMatch(/cache file is not valid JSON/);
  });

  it("flags a cache file that is not JSON at all", () => {
    expect(corruptionIn("")).toMatch(/cache file is not valid JSON/);
    expect(corruptionIn("not json")).toMatch(/cache file is not valid JSON/);
  });

  it("leaves a non-JSON response alone, however it parses", () => {
    // An image or a page has no parse to fail; guessing would delete good
    // entries.
    expect(corruptionIn(entry("<html>", "text/html"))).toBeNull();
    expect(corruptionIn(entry("\u0000\u0001", "image/jpeg"))).toBeNull();
  });

  it("leaves an entry with no body alone", () => {
    expect(
      corruptionIn(JSON.stringify({ kind: "FETCH", data: {} })),
    ).toBeNull();
    expect(corruptionIn(JSON.stringify({ kind: "REDIRECT" }))).toBeNull();
  });
});

describe("purgeCorruptEntries", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "fetch-cache-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("removes the corrupt entries, keeps the sound ones, and says which went", () => {
    writeFileSync(join(dir, "good00000001"), entry(GOOD_BODY));
    writeFileSync(join(dir, "badbody00002"), entry(GOOD_BODY.slice(0, 30)));
    writeFileSync(join(dir, "badfile00003"), `${entry(GOOD_BODY)}garbage`);
    writeFileSync(join(dir, "image0000004"), entry("\u0000", "image/jpeg"));

    const removed = purgeCorruptEntries(dir);

    expect(removed.map((item) => item.name).sort()).toEqual([
      "badbody00002",
      "badfile00003",
    ]);
    expect(readdirSync(dir).sort()).toEqual(["good00000001", "image0000004"]);
  });

  it("does nothing when there is no cache yet", () => {
    expect(purgeCorruptEntries(join(dir, "missing"))).toEqual([]);
  });

  it("is idempotent", () => {
    writeFileSync(join(dir, "badbody00002"), entry(GOOD_BODY.slice(0, 30)));

    expect(purgeCorruptEntries(dir)).toHaveLength(1);
    expect(purgeCorruptEntries(dir)).toHaveLength(0);
  });
});
