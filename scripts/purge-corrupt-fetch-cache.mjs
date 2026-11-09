#!/usr/bin/env node
// Deletes corrupt entries from Next.js's fetch cache before a build reads them.
//
// Why this exists. `next build` caches every `fetch` response under
// `.next/cache/fetch-cache/`, one file each, and generates pages with several
// workers at once. When more than one of them stores the same response at the
// same moment their writes interleave, and the file that survives is damaged
// in one of two ways, both seen here:
//
//   - the cache file is no longer JSON -- a complete entry followed by the
//     leftover tail of a longer one ("Unexpected non-whitespace character after
//     JSON"). Next treats that as a miss, so it costs a refetch and nothing
//     else; and
//   - the cache file is JSON but its base64 body is garbage past some offset,
//     because the two writes had headers of different lengths and the body
//     lands misaligned. That one is not a miss. Next hands the body to the
//     caller, the Sanity client calls `JSON.parse` on it, and every later build
//     dies with "Bad control character in string literal" at the same offset,
//     until someone finds and deletes the file. The first build that wrote it
//     passes, because it used the response from memory, so nothing flags it.
//
// The cause is not proven, only the best fit for those two shapes (a valid
// prefix, then bytes that decode to noise at a fixed offset; a cache file with
// a tail past its end). What is certain is the damage is detectable: an entry
// that claims to be JSON and does not parse. So this checks exactly that, and
// removes only what fails -- the rest of the cache stays, and builds stay fast.
//
// Run from `prebuild`, so the pre-push hook and the browser suite's own build
// get it too.

import fs from "node:fs";
import path from "node:path";

const DEFAULT_DIR = path.join(".next", "cache", "fetch-cache");

/**
 * Why a cache entry's text is corrupt, or `null` if it is not.
 *
 * Takes the text of one cache file. Only entries that declare a JSON response
 * have their body checked: an image or an HTML page has no parse to fail, and
 * guessing at those would delete good entries.
 */
export function corruptionIn(fileText) {
  let entry;

  try {
    entry = JSON.parse(fileText);
  } catch (error) {
    return `the cache file is not valid JSON (${error.message})`;
  }

  const data = entry?.data;

  if (!data || typeof data.body !== "string") {
    return null;
  }

  const contentType = data.headers?.["content-type"] ?? "";

  if (!contentType.includes("json")) {
    return null;
  }

  try {
    JSON.parse(Buffer.from(data.body, "base64").toString("utf8"));
  } catch (error) {
    return `the cached response body is not valid JSON (${error.message})`;
  }

  return null;
}

/** Removes every corrupt entry under `dir`; returns what it removed and why. */
export function purgeCorruptEntries(dir = DEFAULT_DIR) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const removed = [];

  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const reason = corruptionIn(fs.readFileSync(file, "utf8"));

    if (reason) {
      fs.rmSync(file);
      removed.push({ name, reason });
    }
  }

  return removed;
}

// Not on import: the test loads this file and must not delete anything.
const IS_ENTRY_POINT = process.argv[1]?.endsWith(
  "purge-corrupt-fetch-cache.mjs",
);

if (IS_ENTRY_POINT) {
  const removed = purgeCorruptEntries();

  for (const { name, reason } of removed) {
    console.log(
      `purged corrupt fetch-cache entry ${name.slice(0, 8)}: ${reason}`,
    );
  }
}
