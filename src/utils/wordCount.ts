/**
 * The one rule for "how many words is this", read by the Studio validators,
 * `assessLandingPageQuality` and the quickstart, so
 * they cannot disagree about whether a page is long enough (spec 014
 * research.md §4a).
 *
 * A word is a whitespace-separated token that holds at least one Unicode
 * letter or digit. A lone dash, ampersand or bullet is not a word;
 * `pre-wedding` is one; whitespace-only text is zero.
 *
 * No `@/` imports: the Studio bundle loads this file.
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token))
    .length;
}

export function countParagraphsWords(paragraphs: string[]): number {
  return paragraphs.reduce((total, text) => total + countWords(text), 0);
}
